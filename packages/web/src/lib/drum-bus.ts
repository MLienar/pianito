import * as Tone from "tone";

let bus: Tone.Channel | null = null;

export function getDrumBus(): Tone.Channel {
  if (!bus) {
    bus = new Tone.Channel({ volume: 0 }).chain(
      new Tone.Compressor({
        threshold: -12,
        ratio: 4,
        attack: 0.003,
        release: 0.1,
      }),
      new Tone.EQ3({ low: 2, mid: -1, high: 0 }),
      Tone.getDestination(),
    );
  }
  return bus;
}
