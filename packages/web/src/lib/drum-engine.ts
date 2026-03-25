import * as Tone from "tone";
import { getDrumKit } from "./drum-kit";
import type { DrumPattern } from "./drum-patterns";

let sequence: Tone.Sequence | null = null;

export function startDrums(
  tempo: number,
  pattern: DrumPattern,
  swing = 0,
): void {
  stopDrums();

  const kit = getDrumKit();
  const transport = Tone.getTransport();
  transport.bpm.value = tempo;
  transport.swing = swing;
  transport.swingSubdivision = "8n";

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
