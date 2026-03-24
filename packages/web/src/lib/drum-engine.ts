import * as Tone from "tone";
import { getDrumKit } from "./drum-kit";
import {
  type DrumPattern,
  type DrumPatternId,
  DRUM_PATTERNS,
} from "./drum-patterns";

let sequence: Tone.Sequence | null = null;

export function startDrums(tempo: number, patternId: DrumPatternId): void {
  stopDrums();

  const pattern: DrumPattern = DRUM_PATTERNS[patternId];
  const kit = getDrumKit();

  Tone.getTransport().bpm.value = tempo;

  sequence = new Tone.Sequence(
    (time, step) => {
      if (pattern.kick[step]) {
        kit.kick.triggerAttackRelease("C1", "8n", time);
      }
      if (pattern.snare[step]) {
        kit.snare.triggerAttackRelease("8n", time);
      }
      if (pattern.hihat[step]) {
        kit.hihat.triggerAttackRelease("C4", "32n", time);
      }
      if (pattern.ride?.[step]) {
        kit.ride.triggerAttackRelease("8n", time);
      }
      if (pattern.shaker?.[step]) {
        kit.shaker.triggerAttackRelease("32n", time);
      }
    },
    [...Array(pattern.kick.length).keys()],
    pattern.subdivision,
  );

  sequence.loop = true;
  sequence.start(0);
  Tone.getTransport().start();
}

export function stopDrums(): void {
  if (sequence) {
    sequence.stop();
    sequence.dispose();
    sequence = null;
  }
  Tone.getTransport().stop();
  Tone.getTransport().position = 0;
}
