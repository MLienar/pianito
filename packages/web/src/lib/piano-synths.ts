import * as Tone from "tone";
import type { PianoPreset } from "./styles";

/**
 * Common interface for all keyboard instruments used in chord playback.
 * Both samplers and poly-synths support these methods.
 */
export interface KeyboardInstrument {
  triggerAttackRelease(
    notes: string | string[],
    duration: number | string,
    time?: number,
    velocity?: number,
  ): void;
  releaseAll(): void;
}

/* ── Grand Piano (Salamander sampler) ──────────────────────────── */

let grandPiano: Tone.Sampler | null = null;
let grandPianoPromise: Promise<void> | null = null;

async function ensureGrandPiano(): Promise<Tone.Sampler> {
  if (grandPiano) return grandPiano;
  if (grandPianoPromise) {
    await grandPianoPromise;
    return grandPiano as unknown as Tone.Sampler;
  }

  grandPianoPromise = (async () => {
    await Tone.start();
    grandPiano = new Tone.Sampler({
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

  await grandPianoPromise;
  return grandPiano as unknown as Tone.Sampler;
}

/* ── Rhodes Electric Piano (FM synthesis) ──────────────────────── */

let rhodes: Tone.PolySynth | null = null;

function getOrCreateRhodes(): Tone.PolySynth {
  if (!rhodes) {
    rhodes = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 3.01,
      modulationIndex: 1.5,
      oscillator: { type: "sine" },
      modulation: { type: "sine" },
      envelope: { attack: 0.01, decay: 0.8, sustain: 0.3, release: 0.6 },
      modulationEnvelope: {
        attack: 0.01,
        decay: 0.5,
        sustain: 0.2,
        release: 0.4,
      },
      volume: -10,
    }).toDestination();
    rhodes.maxPolyphony = 8;
  }
  return rhodes;
}

/* ── Clavinet (bright, percussive pluck) ───────────────────────── */

let clav: Tone.PolySynth | null = null;

function getOrCreateClav(): Tone.PolySynth {
  if (!clav) {
    clav = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 2,
      modulationIndex: 4,
      oscillator: { type: "square" },
      modulation: { type: "sawtooth" },
      envelope: { attack: 0.002, decay: 0.3, sustain: 0.1, release: 0.05 },
      modulationEnvelope: {
        attack: 0.002,
        decay: 0.15,
        sustain: 0,
        release: 0.05,
      },
      volume: -12,
    }).toDestination();
    clav.maxPolyphony = 8;
  }
  return clav;
}

/* ── Organ stab (square waves, short release) ──────────────────── */

let organ: Tone.PolySynth | null = null;

function getOrCreateOrgan(): Tone.PolySynth {
  if (!organ) {
    organ = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "square8" },
      envelope: { attack: 0.005, decay: 0.2, sustain: 0.6, release: 0.08 },
      volume: -14,
    }).toDestination();
    organ.maxPolyphony = 8;
  }
  return organ;
}

/* ── Public API ────────────────────────────────────────────────── */

const synthGetters: Record<
  Exclude<PianoPreset, "grand">,
  () => KeyboardInstrument
> = {
  rhodes: getOrCreateRhodes,
  clav: getOrCreateClav,
  organ: getOrCreateOrgan,
};

let activeInstrument: KeyboardInstrument | null = null;

/**
 * Ensures the instrument for the given preset is ready and returns it.
 * Synth-based presets are instant; "grand" needs async sample loading.
 */
export async function ensureKeyboard(
  preset: PianoPreset,
): Promise<KeyboardInstrument> {
  if (preset === "grand") {
    activeInstrument = await ensureGrandPiano();
    return activeInstrument;
  }
  await Tone.start();
  activeInstrument = synthGetters[preset]();
  return activeInstrument;
}

/**
 * Returns the instrument synchronously.
 * For synth-based presets, lazily creates on first call.
 * For "grand", returns null until `ensureKeyboard` has been called.
 */
export function getOrCreateKeyboard(
  preset: PianoPreset,
): KeyboardInstrument | null {
  if (preset === "grand") return grandPiano;
  return synthGetters[preset]();
}

/**
 * Release voices on the active keyboard instrument.
 */
export function releaseActiveKeyboard(): void {
  activeInstrument?.releaseAll();
}
