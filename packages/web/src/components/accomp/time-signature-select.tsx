import type { TimeSignature } from "@pianito/shared";
import { SUPPORTED_TIME_SIGNATURES } from "@pianito/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toTimeSignatureKey } from "@/lib/drum-patterns";

function formatTs(ts: TimeSignature): string {
  return toTimeSignatureKey(ts.numerator, ts.denominator);
}

function tsEquals(a: TimeSignature, b: TimeSignature): boolean {
  return a.numerator === b.numerator && a.denominator === b.denominator;
}

interface TimeSignatureSelectProps {
  value: TimeSignature;
  disabled?: boolean;
  onChange: (ts: TimeSignature) => void;
}

export function TimeSignatureSelect({
  value,
  disabled,
  onChange,
}: TimeSignatureSelectProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const select = useCallback(
    (ts: TimeSignature) => {
      onChange(ts);
      setOpen(false);
    },
    [onChange],
  );

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
        setFocusedIndex(
          Math.max(
            0,
            SUPPORTED_TIME_SIGNATURES.findIndex((ts) => tsEquals(ts, value)),
          ),
        );
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((i) =>
          Math.min(i + 1, SUPPORTED_TIME_SIGNATURES.length - 1),
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (focusedIndex >= 0) {
          const ts = SUPPORTED_TIME_SIGNATURES[focusedIndex];
          if (ts) select(ts);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-bold">{t("accomp.timeSignature")}</span>
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => !disabled && setOpen((v) => !v)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex items-center gap-2 border-3 border-border bg-background py-1 pr-7 pl-2 font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        >
          {formatTs(value)}
          <span className="pointer-events-none absolute right-1.5 text-[10px] font-bold">
            ▼
          </span>
        </button>

        {open && (
          <div
            role="listbox"
            className="absolute top-full left-0 z-50 mt-1 min-w-full border-3 border-border bg-background shadow-[var(--shadow-brutal)]"
          >
            {SUPPORTED_TIME_SIGNATURES.map((ts, i) => (
              <div
                key={formatTs(ts)}
                role="option"
                tabIndex={0}
                aria-selected={tsEquals(ts, value)}
                onMouseDown={() => select(ts)}
                onMouseEnter={() => setFocusedIndex(i)}
                className={`cursor-pointer px-3 py-1.5 font-mono text-sm font-bold whitespace-nowrap ${
                  tsEquals(ts, value)
                    ? "bg-accent text-accent-foreground"
                    : i === focusedIndex
                      ? "bg-muted"
                      : "bg-background hover:bg-muted"
                }`}
              >
                {formatTs(ts)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
