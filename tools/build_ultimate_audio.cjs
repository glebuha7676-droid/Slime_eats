// Run with Playwright available: node tools/build_ultimate_audio.cjs <path-to-Tone.js-15.1.22>
// The Phoenix cue is rendered separately by tools/build_phoenix_audio.py.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

async function main() {
  const tonePath = process.argv[2];
  if (!tonePath) throw new Error('Pass the browser build of Tone.js 15.1.22 as the first argument.');
  const output = path.resolve(__dirname, '../assets/audio/ultimates');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage();
    await page.addScriptTag({ path: path.resolve(tonePath) });
    const clips = await page.evaluate(async () => {
      const Tone = window.Tone;
      const sampleRate = 44100;

      async function render(name, duration, peak, recipe) {
        let seed = 827553 + name.length * 719;
        const random = () => {
          seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
          return seed / 4294967296;
        };
        const rendered = await Tone.Offline(offline => {
          const ctx = offline.rawContext;
          const mix = ctx.createGain();
          const highpass = ctx.createBiquadFilter();
          highpass.type = 'highpass';
          highpass.frequency.value = 43;
          const lowpass = ctx.createBiquadFilter();
          lowpass.type = 'lowpass';
          lowpass.frequency.value = 6750;
          lowpass.Q.value = .1;
          const shaper = ctx.createDynamicsCompressor();
          shaper.threshold.value = -13;
          shaper.knee.value = 12;
          shaper.ratio.value = 2.2;
          shaper.attack.value = .004;
          shaper.release.value = .095;
          mix.connect(highpass).connect(lowpass).connect(shaper).connect(ctx.destination);

          const noise = ctx.createBuffer(1, Math.ceil(duration * sampleRate), sampleRate);
          const samples = noise.getChannelData(0);
          for (let i = 0; i < samples.length; i++) samples[i] = random() * 2 - 1;

          function envelope(param, start, length, shape) {
            param.setValueAtTime(0, start);
            for (const [fraction, level] of shape) param.linearRampToValueAtTime(level, start + length * fraction);
            param.linearRampToValueAtTime(0, start + length);
          }

          function voice(input, start, length, shape, pan, space) {
            const amp = ctx.createGain();
            const panner = ctx.createStereoPanner();
            panner.pan.setValueAtTime(Array.isArray(pan) ? pan[0] : pan, start);
            if (Array.isArray(pan)) panner.pan.linearRampToValueAtTime(pan[1], start + length);
            envelope(amp.gain, start, length, shape);
            input.connect(amp).connect(panner).connect(mix);
            if (space) {
              for (const [delay, sign, gain] of [[.039, 1, .21], [.067, -1, .13], [.112, 1, .07]]) {
                const early = ctx.createDelay(.15);
                early.delayTime.value = delay;
                const damp = ctx.createBiquadFilter();
                damp.type = 'lowpass';
                damp.frequency.value = 2300;
                const reflection = ctx.createGain();
                reflection.gain.value = space * gain;
                const side = ctx.createStereoPanner();
                side.pan.value = sign * .68;
                amp.connect(early).connect(damp).connect(reflection).connect(side).connect(mix);
              }
            }
          }

          function tone(start, length, from, to, shape, { type = 'sine', pan = 0, space = 0 } = {}) {
            const osc = ctx.createOscillator();
            osc.type = type;
            osc.frequency.setValueAtTime(from, start);
            osc.frequency.exponentialRampToValueAtTime(to, start + length);
            voice(osc, start, length, shape, pan, space);
            osc.start(start);
            osc.stop(start + length);
          }

          function air(start, length, from, to, q, shape, { pan = 0, space = 0, floor = 58 } = {}) {
            const stream = ctx.createBufferSource();
            stream.buffer = noise;
            stream.loop = true;
            const body = ctx.createBiquadFilter();
            body.type = 'highpass';
            body.frequency.value = floor;
            const color = ctx.createBiquadFilter();
            color.type = 'bandpass';
            color.Q.value = q;
            color.frequency.setValueAtTime(from, start);
            color.frequency.exponentialRampToValueAtTime(to, start + length);
            stream.connect(body).connect(color);
            voice(color, start, length, shape, pan, space);
            stream.start(start, random() * duration);
            stream.stop(start + length);
          }

          function particles(start, length, count, pitch, amount, width) {
            for (let i = 0; i < count; i++) {
              const at = start + length * (i + random() * .65) / count;
              const span = .013 + random() * .046;
              const color = pitch * (.55 + random() * .9);
              const gain = amount * (.35 + random() * .65);
              air(at, span, color, color * .64, .64, [[.1, gain], [.53, gain * .39]], {
                pan: (random() * 2 - 1) * width, space: .11, floor: 280
              });
            }
          }

          function fm(start, length, frequency, { volume = -20, pan = 0, index = 1.4, harmonicity = 1.5, attack = .035 } = {}) {
            const side = new Tone.Panner(pan).toDestination();
            const synth = new Tone.FMSynth({
              volume, harmonicity, modulationIndex: index,
              oscillator: { type: 'sine' }, modulation: { type: 'sine' },
              envelope: { attack, decay: .14, sustain: .33, release: .12 },
              modulationEnvelope: { attack: .029, decay: .14, sustain: .12, release: .08 }
            }).connect(side);
            synth.triggerAttackRelease(frequency, length, start, .75);
          }

          function strike(start, note, volume) {
            const drum = new Tone.MembraneSynth({
              volume, octaves: 2.15, pitchDecay: .072,
              oscillator: { type: 'sine' },
              envelope: { attack: .006, decay: .22, sustain: .01, release: .14 }
            }).toDestination();
            drum.triggerAttackRelease(note, .18, start, .9);
          }

          recipe({ air, tone, particles, fm, strike });
        }, duration, 2, sampleRate);

        const channels = Array.from({ length: 2 }, (_, i) => rendered.getChannelData(i));
        const frames = channels[0].length;
        // Apply short edge fades to reflections and align peaks to each cue's place in the mix.
        let max = 0;
        for (let frame = 0; frame < frames; frame++) {
          const fade = Math.min(1, frame / (sampleRate * .003), (frames - 1 - frame) / (sampleRate * .029));
          for (const channel of channels) {
            channel[frame] *= fade;
            max = Math.max(max, Math.abs(channel[frame]));
          }
        }
        if (!Number.isFinite(max) || max < .01) throw new Error(`Empty render: ${name}`);
        const bytes = new Uint8Array(44 + frames * 4);
        const view = new DataView(bytes.buffer);
        function label(offset, value) {
          for (let i = 0; i < value.length; i++) bytes[offset + i] = value.charCodeAt(i);
        }
        label(0, 'RIFF'); view.setUint32(4, 36 + frames * 4, true);
        label(8, 'WAVE'); label(12, 'fmt '); view.setUint32(16, 16, true);
        view.setUint16(20, 1, true); view.setUint16(22, 2, true);
        view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 4, true);
        view.setUint16(32, 4, true); view.setUint16(34, 16, true);
        label(36, 'data'); view.setUint32(40, frames * 4, true);
        const scale = 32767 * peak / max;
        for (let frame = 0; frame < frames; frame++) {
          for (let channel = 0; channel < 2; channel++) {
            view.setInt16(44 + frame * 4 + channel * 2, Math.round(channels[channel][frame] * scale), true);
          }
        }
        let binary = '';
        for (let i = 0; i < bytes.length; i += 16384) binary += String.fromCharCode(...bytes.subarray(i, i + 16384));
        return { name, duration, data: btoa(binary) };
      }

      const clips = [];
      clips.push(await render('infinity-charge', 1.13, .27, ({ air, tone, fm, particles }) => {
        // Left and right form first, then stereo motion follows the converging spheres.
        fm(.018, .23, 382, { volume: -19, pan: -.55, index: 2.1, attack: .023 });
        fm(.145, .24, 259, { volume: -19, pan: .55, harmonicity: 1.21 });
        air(.01, .58, 580, 1570, 1.3, [[.12, .20], [.49, .13], [.79, .08]], { pan: -.48, space: .6 });
        air(.13, .61, 320, 780, 1.05, [[.14, .22], [.54, .16], [.79, .10]], { pan: .48, space: .5 });
        tone(.07, 1.01, 93, 167, [[.18, .052], [.54, .081], [.86, .12], [.96, .015]]);
        air(.49, .60, 430, 2570, 1.24, [[.25, .09], [.82, .28], [.96, .058]], { pan: [-.53, 0], space: .25 });
        air(.57, .50, 280, 1650, .95, [[.22, .09], [.84, .33], [.96, .055]], { pan: [.55, 0], space: .25 });
        particles(.21, .72, 13, 1960, .083, .72);
      }));

      clips.push(await render('infinity-fusion', .45, .40, ({ air, tone, fm }) => {
        fm(.006, .14, 337, { volume: -18, index: 2.5, attack: .011 });
        fm(.024, .105, 508, { volume: -26, pan: .18, index: 1.2, attack: .009 });
        tone(.006, .365, 184, 94, [[.035, .24], [.26, .17], [.68, .061]], { space: .36 });
        air(.003, .18, 2380, 590, .87, [[.07, .42], [.31, .23], [.69, .08]], { space: .53 });
        air(.105, .275, 490, 930, 2.8, [[.17, .065], [.59, .11], [.85, .03]], { space: .31 });
      }));

      clips.push(await render('infinity-launch', .89, .75, ({ air, tone, strike, fm, particles }) => {
        strike(.003, 58, -13);
        fm(.008, .11, 227, { volume: -20, index: 2.8, attack: .008 });
        tone(.004, .38, 235, 77, [[.044, .35], [.24, .23], [.51, .091]], { space: .22 });
        air(.001, .34, 2960, 790, .79, [[.025, .81], [.16, .54], [.57, .27], [.86, .085]], { space: .57 });
        air(.055, .81, 820, 285, 1.04, [[.095, .52], [.37, .39], [.72, .24], [.91, .095]], { pan: [-.22, -.37], space: .26 });
        air(.071, .80, 1380, 485, 1.16, [[.09, .42], [.39, .32], [.73, .19], [.91, .08]], { pan: [.24, .39], space: .28 });
        tone(.087, .765, 176, 91, [[.11, .17], [.37, .133], [.71, .075], [.94, .022]], { type: 'triangle' });
        particles(.12, .69, 34, 2290, .145, .75);
      }));

      clips.push(await render('infinity-tail', .46, .28, ({ air, tone, particles }) => {
        air(.002, .29, 1290, 360, .89, [[.055, .35], [.24, .24], [.62, .081]], { space: .89 });
        tone(.01, .34, 156, 64, [[.055, .19], [.26, .11], [.64, .031]], { space: .52 });
        particles(.02, .265, 12, 1670, .062, .74);
      }));

      return clips;
    });

    fs.mkdirSync(output, { recursive: true });
    for (const { name, duration, data } of clips) {
      const file = path.join(output, `${name}.wav`);
      fs.writeFileSync(file, Buffer.from(data, 'base64'));
      console.log(`${name}.wav  ${duration.toFixed(3)} s`);
    }
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
