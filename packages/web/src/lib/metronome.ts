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

function isAccentBeat(
  beat: number,
  numerator: number,
  denominator: number,
): boolean {
  if (beat === 0) return true;
  // 6/8 compound: accent on beats 0 and 3
  if (numerator === 6 && denominator === 8 && beat === 3) return true;
  return false;
}

export function playClick(beat: number, numerator = 4, denominator = 4): void {
  const synth = getClick();
  const frequency = isAccentBeat(beat, numerator, denominator) ? 1200 : 800;
  synth.triggerAttackRelease(frequency, 0.03);
}
