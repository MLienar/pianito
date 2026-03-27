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
  transport.swing = Math.min(swing, 0.5);
  transport.swingSubdivision = "8n";

  sequence = new Tone.Sequence(
    (time, step) => {
      const kickVel = pattern.kick[step];
      if (kickVel !== null && kickVel !== undefined) {
        kit.kick.triggerAttackRelease("C1", "8n", time, kickVel);
      }
      const snareVel = pattern.snare[step];
      if (snareVel !== null && snareVel !== undefined) {
        kit.snare.triggerAttackRelease("8n", time, snareVel);
      }
      const hihatVel = pattern.hihat[step];
      if (hihatVel !== null && hihatVel !== undefined) {
        kit.hihat.triggerAttackRelease("C4", "32n", time, hihatVel);
      }
      const rideVel = pattern.ride?.[step];
      if (rideVel !== null && rideVel !== undefined) {
        kit.ride.triggerAttackRelease("8n", time, rideVel);
      }
      const shakerVel = pattern.shaker?.[step];
      if (shakerVel !== null && shakerVel !== undefined) {
        kit.shaker.triggerAttackRelease("32n", time, shakerVel);
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
