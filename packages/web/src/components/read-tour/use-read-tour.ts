import type { Tour } from "shepherd.js";
import Shepherd from "shepherd.js";
import "shepherd.js/dist/css/shepherd.css";
import "../accomp/tour/tour-styles.css";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { getReadTourSteps } from "./tour-steps";

interface UseReadTourOptions {
  introKey: string;
  noteNames: string[];
  enabled: boolean;
  onComplete: () => void;
  onDismiss: () => void;
}

export function useReadTour({
  introKey,
  noteNames,
  enabled,
  onComplete,
  onDismiss,
}: UseReadTourOptions) {
  const { t } = useTranslation();
  const tourRef = useRef<Tour | null>(null);
  const onCompleteRef = useRef(onComplete);
  const onDismissRef = useRef(onDismiss);
  onCompleteRef.current = onComplete;
  onDismissRef.current = onDismiss;

  const startTour = useCallback(() => {
    if (tourRef.current?.isActive()) return;

    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        cancelIcon: { enabled: true },
        scrollTo: { behavior: "smooth", block: "center" },
      },
    });

    const steps = getReadTourSteps(t, tour, { noteNames });
    for (const step of steps) {
      tour.addStep(step);
    }

    tour.on("complete", () => {
      localStorage.setItem(introKey, "1");
      onCompleteRef.current();
    });

    tour.on("cancel", () => {
      onDismissRef.current();
    });

    tourRef.current = tour;
    tour.start();
  }, [t, noteNames, introKey]);

  // Auto-trigger when enabled and DOM is ready
  useEffect(() => {
    if (!enabled || noteNames.length === 0) return;

    const timer = setTimeout(startTour, 300);
    return () => clearTimeout(timer);
  }, [enabled, startTour, noteNames.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (tourRef.current?.isActive()) {
        tourRef.current.cancel();
      }
    };
  }, []);

  return { startTour };
}
