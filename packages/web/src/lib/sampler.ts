import * as Tone from "tone";

let sampler: Tone.Sampler | null = null;
let initPromise: Promise<void> | null = null;

export function getSampler(): Tone.Sampler | null {
  return sampler;
}

export async function ensureSampler(): Promise<Tone.Sampler> {
  if (sampler) return sampler;
  if (initPromise) {
    await initPromise;
    return sampler as unknown as Tone.Sampler;
  }

  initPromise = (async () => {
    await Tone.start();
    sampler = new Tone.Sampler({
      urls: {
        C4: "C4.mp3",
        "D#4": "Ds4.mp3",
        "F#4": "Fs4.mp3",
        A4: "A4.mp3",
        C5: "C5.mp3",
        "D#5": "Ds5.mp3",
        "F#5": "Fs5.mp3",
        A5: "A5.mp3",
        C3: "C3.mp3",
        "D#3": "Ds3.mp3",
        "F#3": "Fs3.mp3",
        A3: "A3.mp3",
      },
      release: 1,
      baseUrl: "https://tonejs.github.io/audio/salamander/",
    }).toDestination();

    await Tone.loaded();
  })();

  await initPromise;
  return sampler as unknown as Tone.Sampler;
}
