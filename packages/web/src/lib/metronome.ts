import * as Tone from "tone";

let click: Tone.Synth | null = null;

function getClick(): Tone.Synth {
  if (!click) {
    click = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.01 },
      volume: -6,
    }).toDestination();
  }
  return click;
}

export function playClick(beat: number): void {
  const synth = getClick();
  const frequency = beat === 0 ? 1200 : 800;
  synth.triggerAttackRelease(frequency, 0.03);
}
