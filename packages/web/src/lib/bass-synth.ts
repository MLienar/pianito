import { Note } from "tonal";
import * as Tone from "tone";
import type { BassPreset } from "./styles";

interface BassVoice {
  synth: Tone.MonoSynth;
  compressor: Tone.Compressor;
}

const voices = new Map<BassPreset, BassVoice>();

const PRESETS: Record<
  BassPreset,
  ConstructorParameters<typeof Tone.MonoSynth>[0]
> = {
  fingered: {
    oscillator: {
      type: "fmsawtooth",
      modulationType: "sine",
      modulationIndex: 0.8,
    },
    envelope: { attack: 0.05, decay: 0.4, sustain: 0.5, release: 0.2 },
    filterEnvelope: {
      attack: 0.01,
      decay: 0.3,
      sustain: 0.2,
      release: 0.15,
      baseFrequency: 60,
      octaves: 2.5,
    },
    volume: -6,
  },
  walking: {
    oscillator: {
      type: "fmtriangle",
      modulationType: "sine",
      modulationIndex: 0.3,
    },
    envelope: { attack: 0.08, decay: 0.5, sustain: 0.4, release: 0.25 },
    filterEnvelope: {
      attack: 0.02,
      decay: 0.4,
      sustain: 0.15,
      release: 0.2,
      baseFrequency: 50,
      octaves: 2,
    },
    volume: -6,
  },
  synth: {
    oscillator: {
      type: "fmsquare",
      modulationType: "sine",
      modulationIndex: 0.5,
    },
    envelope: { attack: 0.01, decay: 0.25, sustain: 0.3, release: 0.1 },
    filterEnvelope: {
      attack: 0.005,
      decay: 0.2,
      sustain: 0.3,
      release: 0.1,
      baseFrequency: 80,
      octaves: 3,
    },
    volume: -6,
  },
};

function getVoice(preset: BassPreset): BassVoice {
  const existing = voices.get(preset);
  if (existing) return existing;

  const compressor = new Tone.Compressor({
    threshold: -15,
    ratio: 3,
    attack: 0.005,
    release: 0.1,
  }).toDestination();

  const synth = new Tone.MonoSynth(PRESETS[preset]).connect(compressor);

  const voice: BassVoice = { synth, compressor };
  voices.set(preset, voice);
  return voice;
}

export function playBassNote(
  rootNote: string,
  semitoneOffset: number,
  duration: string,
  velocity = 0.8,
  preset: BassPreset = "fingered",
): void {
  const { synth } = getVoice(preset);
  const rootMidi = Note.midi(`${rootNote}2`);
  if (rootMidi === null) return;
  const noteName = Note.fromMidi(rootMidi + semitoneOffset);
  if (!noteName) return;
  synth.triggerAttackRelease(noteName, duration, undefined, velocity);
}

export function stopBass(): void {
  for (const { synth } of voices.values()) {
    synth.triggerRelease();
  }
}
