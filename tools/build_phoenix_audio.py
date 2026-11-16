"""Master three Soundbox / Stable Audio 3.0 SFX takes for the Phoenix summon and flight.

Release sources, each rendered at 4 s in Soundbox: ignition seed 914826,
one call cut from seed 512064, and fire pass and downstroke from seed 200481.
The flight cue starts on the animation's 880 ms launch event.
"""

import argparse
from math import gcd
from pathlib import Path

import numpy as np
from scipy import signal
import soundfile as sf


RATE = 44100
ARRIVAL_MS = 880
DURATION_MS = 2510


def frames(seconds):
    return round(seconds * RATE)


def filter_band(samples, low, high, order=3):
    sos = signal.butter(order, [low, high], 'bandpass', fs=RATE, output='sos')
    return signal.sosfiltfilt(sos, samples, axis=0)


def envelope(samples, keyframes):
    times, levels = zip(*keyframes)
    t = np.arange(len(samples)) / RATE
    return samples * np.interp(t, times, levels)[:, None]


def smooth_edges(samples, attack, release):
    a, r = frames(attack), frames(release)
    samples = samples.copy()
    samples[:a] *= np.sin(np.linspace(0, np.pi / 2, a))[:, None] ** 2
    samples[-r:] *= np.cos(np.linspace(0, np.pi / 2, r))[:, None] ** 2
    return samples


def read_take(path, start, duration, speed=1):
    samples, rate = sf.read(path, always_2d=True)
    source = samples[round(start * rate):round((start + duration * speed) * rate)]
    interpreted_rate = round(rate * speed)
    divisor = gcd(interpreted_rate, RATE)
    shaped = signal.resample_poly(source, RATE // divisor, interpreted_rate // divisor, axis=0)
    if len(shaped) < frames(duration):
        shaped = np.pad(shaped, ((0, frames(duration) - len(shaped)), (0, 0)))
    return shaped[:frames(duration)]


def level(samples, target_db, start, end):
    active = samples[frames(start):frames(end)]
    rms = np.sqrt(np.mean(active ** 2))
    if not np.isfinite(rms) or rms < 1e-6:
        raise ValueError('The selected part of the generated take is silent')
    return samples * (10 ** (target_db / 20) / rms)


def width(samples, amount):
    center = samples.mean(axis=1, keepdims=True)
    return np.broadcast_to(center + (samples - center) * amount, (len(samples), 2))


def master(mix, max_db):
    length = frames(.018)
    energy = np.convolve(np.mean(mix ** 2, axis=1), np.ones(length) / length, mode='same')
    gain = 10 ** (-np.maximum(10 * np.log10(np.maximum(energy, 1e-9)) + 16, 0) * .32 / 20)
    smooth = np.exp(-1 / (RATE * .021))
    gain = signal.lfilter([1 - smooth], [1, -smooth], gain, zi=[smooth])[0]
    mix = mix * gain[:, None]
    return mix * min(1, 10 ** (max_db / 20) / np.max(np.abs(mix)))


def render(args):
    summon_time = ARRIVAL_MS / 1000
    flight_time = (DURATION_MS - ARRIVAL_MS) / 1000
    fire = read_take(args.ignite, args.ignite_start, .69, args.ignite_speed)
    fire = width(filter_band(fire, 110, 3900), .78)
    fire = level(fire, -20, .08, .59)
    fire = envelope(fire, [(0, 0), (.045, .55), (.22, 1), (.45, .75), (.60, .44), (.69, 0)])
    summon = np.zeros((frames(summon_time), 2))
    offset = frames(.18)
    summon[offset:offset + len(fire)] = fire

    call_time = .63
    voice = read_take(args.cry, args.cry_start, call_time, args.cry_speed)
    voice = filter_band(voice, 270, 4500)
    voice -= .25 * filter_band(voice, 2650, 3850, order=2)
    voice = level(width(voice, .51), -14.6, .025, .34)
    voice = smooth_edges(voice, .008, .17)

    pass_by = read_take(args.flight, args.flight_start, flight_time, args.flight_speed)
    pass_by = level(width(filter_band(pass_by, 88, 3500), .86), -15.8, .10, .90)
    # Let the cry lead the impact for a few frames, then bring the fire fully forward.
    pass_by = envelope(pass_by, [(0, 0), (.029, .52), (.12, .57), (.25, .62), (.42, .92),
                                  (.78, 1), (.99, .67), (1.34, .21), (flight_time, 0)])
    wing = read_take(args.flight, args.wing_start, .24)
    wing = width(filter_band(wing, 80, 740), .64)
    wing = smooth_edges(level(wing, -23.8, .025, .12), .018, .085)
    pass_by[:len(wing)] += wing
    pass_by[:len(voice)] += voice
    reflection = filter_band(voice, 500, 2200)
    for time, pan in ((.039, (.07, .13)), (.071, (.10, .058))):
        delay = frames(time)
        pass_by[delay:delay + len(reflection)] += reflection * pan
    final_flight = smooth_edges(master(pass_by, -3.5), .006, .095)

    args.output.mkdir(parents=True, exist_ok=True)
    for name, data in [('phoenix-summon', master(summon, -6)), ('phoenix-flight', final_flight)]:
        sf.write(args.output / f'{name}.wav', data, RATE, subtype='PCM_16')
        print(f'{name}: {len(data) / RATE:.3f} s, peak {20 * np.log10(np.max(np.abs(data))):.1f} dBFS')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    for stem in ('ignite', 'cry', 'flight'):
        parser.add_argument(f'--{stem}', required=True, type=Path)
        parser.add_argument(f'--{stem}-start', type=float, default=0)
        parser.add_argument(f'--{stem}-speed', type=float, default=1)
    parser.add_argument('--wing-start', type=float, default=.145)
    parser.add_argument('--output', required=True, type=Path)
    render(parser.parse_args())
