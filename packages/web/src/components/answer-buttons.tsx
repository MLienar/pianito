import { useNoteFormatter } from "@/hooks/use-note-formatter";
import { ANSWER_NOTES } from "@/lib/constants";
import { Button } from "./button";

interface AnswerButtonsProps {
  disabled: boolean;
  allowedNotes?: string[];
  onAnswer: (note: string) => void;
}

export function AnswerButtons({
  disabled,
  allowedNotes,
  onAnswer,
}: AnswerButtonsProps) {
  const formatNote = useNoteFormatter();

  return (
    <div className="flex justify-center gap-3 flex-wrap">
      {ANSWER_NOTES.map((note) => {
        const isAllowed = !allowedNotes || allowedNotes.includes(note);
        return (
          <Button
            key={note}
            onClick={() => onAnswer(note)}
            disabled={disabled || !isAllowed}
            className="px-6 py-4 text-2xl font-mono min-w-[70px]"
          >
            {formatNote(note)}
          </Button>
        );
      })}
    </div>
  );
}
