import { useCallback, useRef } from "react";
import { Note } from "tonal";

/** Convert MIDI note number to natural note letter (no sharps/flats) */
export function midiNoteToLetter(noteNumber: number): string | null {
  const n = Note.get(Note.fromMidi(noteNumber));
  if (!n.letter || n.acc) return null;
  return n.letter;
}

interface UseMidiMessageOptions {
  onNotePress?: (noteLetter: string) => void;
  enableNoteInput?: boolean;
}

export function useMidiMessage({
  onNotePress,
  enableNoteInput = true,
}: UseMidiMessageOptions) {
  const onNotePressRef = useRef(onNotePress);
  onNotePressRef.current = onNotePress;
  const enableNoteInputRef = useRef(enableNoteInput);
  enableNoteInputRef.current = enableNoteInput;

  const handleMidiMessage = useCallback((event: MIDIMessageEvent) => {
    if (!event.data || event.data.length < 2) return;

    const status = event.data[0];
    const data1 = event.data[1];
    const velocity = event.data[2];

    // Note on message (status 144-159) with velocity > 0
    if (
      status != null &&
      status >= 144 &&
      status <= 159 &&
      data1 != null &&
      velocity &&
      velocity > 0
    ) {
      const noteLetter = midiNoteToLetter(data1);
      if (noteLetter && enableNoteInputRef.current && onNotePressRef.current) {
        onNotePressRef.current(noteLetter);
      }
    }
  }, []);

  return { handleMidiMessage };
}
