import * as Tone from "tone";
import { getDrumBus } from "./drum-bus";

export interface DrumKit {
  kick: Tone.MembraneSynth;
  snare: Tone.NoiseSynth;
  hihat: Tone.MetalSynth;
  ride: Tone.NoiseSynth;
  shaker: Tone.NoiseSynth;
}

let kit: DrumKit | null = null;

export function getDrumKit(): DrumKit {
  if (!kit) {
    const bus = getDrumBus();

    kit = {
      kick: new Tone.MembraneSynth({
        pitchDecay: 0.08,
        octaves: 6,
        oscillator: { type: "sine" },
        envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.1 },
        volume: -8,
      }).connect(bus),
      snare: new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.05 },
        volume: -12,
      }).connect(bus),
      hihat: new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.01 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5,
        volume: -20,
      }).connect(bus),
      shaker: new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.003, decay: 0.06, sustain: 0, release: 0.02 },
        volume: -26,
      }).chain(
        new Tone.Filter({ type: "highpass", frequency: 8000, Q: 0.3 }),
        bus,
      ),
      ride: new Tone.NoiseSynth({
        noise: { type: "pink" },
        envelope: { attack: 0.08, decay: 0.5, sustain: 0.15, release: 0.3 },
        volume: -18,
      }).chain(
        new Tone.Filter({ type: "bandpass", frequency: 4000, Q: 0.5 }),
        bus,
      ),
    };
  }
  return kit;
}
