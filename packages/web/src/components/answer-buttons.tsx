import { ANSWER_NOTES } from "@/lib/constants";
import { Button } from "./button";

interface AnswerButtonsProps {
  disabled: boolean;
  onAnswer: (note: string) => void;
}

export function AnswerButtons({ disabled, onAnswer }: AnswerButtonsProps) {
  return (
    <div className="flex justify-center gap-3 flex-wrap">
      {ANSWER_NOTES.map((note) => (
        <Button
          key={note}
          onClick={() => onAnswer(note)}
          disabled={disabled}
          className="px-6 py-4 text-2xl font-mono min-w-[70px]"
        >
          {note}
        </Button>
      ))}
    </div>
  );
}
