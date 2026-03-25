import { Note } from "tonal";
import * as Tone from "tone";

let synth: Tone.MonoSynth | null = null;

function getSynth(): Tone.MonoSynth {
  if (!synth) {
    synth = new Tone.MonoSynth({
      oscillator: {
        type: "fmsawtooth",
        modulationType: "sine",
        modulationIndex: 0.8,
      },
      envelope: { attack: 0.03, decay: 0.4, sustain: 0.5, release: 0.2 },
      filterEnvelope: {
        attack: 0.01,
        decay: 0.3,
        sustain: 0.2,
        release: 0.15,
        baseFrequency: 60,
        octaves: 2.5,
      },
      volume: -6,
    }).toDestination();
  }
  return synth;
}

export function playBassNote(
  rootNote: string,
  semitoneOffset: number,
  duration: string,
): void {
  const s = getSynth();
  const rootMidi = Note.midi(`${rootNote}2`);
  if (rootMidi === null) return;
  const noteName = Note.fromMidi(rootMidi + semitoneOffset);
  if (!noteName) return;
  s.triggerAttackRelease(noteName, duration);
}

export function stopBass(): void {
  synth?.triggerRelease();
}
