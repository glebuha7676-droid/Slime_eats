"""Render the short mine sound effects. Requires NumPy and SciPy."""

from pathlib import Path
import wave

import numpy as np
from scipy import signal


RATE = 44100
OUTPUT = Path(__file__).resolve().parents[1] / 'assets/audio/mine-v1'


class Cue:
    def __init__(self, duration, seed):
        self.samples = np.zeros(round(duration * RATE))
        self.random = np.random.default_rng(seed)

    def add(self, time, samples):
        start = round(time * RATE)
        length = min(len(samples), len(self.samples) - start)
        self.samples[start:start + length] += samples[:length]

    def knock(self, time, hz, weight, decay, drop=.22):
        t = np.arange(round(.145 * RATE)) / RATE
        pitch = hz * (1 + drop * np.exp(-t / .011))
        phase = 2 * np.pi * np.cumsum(pitch) / RATE
        envelope = (1 - np.exp(-t / .0017)) * np.exp(-t / decay)
        self.add(time, np.sin(phase) * envelope * weight)

    def grain(self, time, lo, hi, weight, decay):
        # A few tiny damped transients give each impact a surface texture.
        t = np.arange(round(.055 * RATE)) / RATE
        band = signal.butter(2, (lo, hi), 'bandpass', fs=RATE, output='sos')
        texture = signal.sosfilt(band, self.random.normal(size=len(t)))
        envelope = (1 - np.exp(-t / .0011)) * np.exp(-t / decay)
        self.add(time, texture * envelope * weight / np.std(texture))

    def save(self, name, peak):
        cutoff = signal.butter(2, 4100, 'lowpass', fs=RATE, output='sos')
        mix = signal.sosfilt(cutoff, self.samples)
        end = round(.021 * RATE)
        mix[-end:] *= np.cos(np.linspace(0, np.pi / 2, end)) ** 2
        mix *= peak / np.max(np.abs(mix))
        pcm = np.rint(32767 * mix).astype('<i2')
        with wave.open(str(OUTPUT / f'{name}.wav'), 'wb') as file:
            file.setparams((1, 2, RATE, 0, 'NONE', 'not compressed'))
            file.writeframes(pcm.tobytes())


OUTPUT.mkdir(parents=True, exist_ok=True)

fragile = Cue(.091, 314)
fragile.knock(0, 358, .51, .018, .50)
fragile.knock(.002, 725, .20, .013, .16)
fragile.grain(.007, 730, 2280, .105, .009)
fragile.knock(.024, 612, .075, .011)
fragile.save('fragile', .45)

stone = Cue(.131, 522)
stone.knock(0, 252, .56, .023, .27)
stone.knock(.001, 493, .24, .014, .16)
stone.grain(.002, 480, 2150, .19, .011)
stone.knock(.029, 366, .15, .013)
stone.grain(.046, 720, 1910, .11, .014)
stone.grain(.068, 620, 1480, .047, .009)
stone.save('stone', .49)

bedrock = Cue(.171, 703)
bedrock.knock(0, 145, .67, .034, .30)
bedrock.knock(.001, 287, .32, .024, .15)
bedrock.knock(.005, 523, .12, .013, .12)
bedrock.grain(.005, 410, 1840, .22, .021)
bedrock.knock(.038, 229, .22, .021)
bedrock.grain(.050, 620, 1580, .17, .016)
bedrock.knock(.059, 358, .12, .015)
bedrock.grain(.077, 450, 1170, .09, .017)
bedrock.save('bedrock', .53)

impact = Cue(.082, 222)
impact.knock(0, 171, .68, .018, .38)
impact.knock(.001, 298, .28, .015)
impact.grain(.002, 370, 1300, .14, .008)
impact.save('impact', .42)

heavy = Cue(.109, 616)
heavy.knock(0, 133, .68, .022, .32)
heavy.knock(.002, 248, .28, .018)
heavy.grain(.003, 290, 1340, .19, .012)
heavy.knock(.019, 322, .08, .014)
heavy.save('impact-heavy', .48)

crystal = Cue(.183, 198)
crystal.knock(.009, 523.25, .49, .044, .018)
crystal.knock(.012, 1046.5, .15, .028, .01)
crystal.knock(.022, 1655, .058, .025, .01)
crystal.knock(.045, 783.99, .35, .052, .018)
crystal.knock(.047, 1568, .09, .037, .01)
crystal.grain(.009, 670, 1790, .05, .009)
crystal.save('crystal', .44)
