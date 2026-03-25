import type { Tour } from "shepherd.js";
import Shepherd from "shepherd.js";
import "shepherd.js/dist/css/shepherd.css";
import "./tour-styles.css";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useGridEditorStore } from "@/stores/grid-editor";
import { useSquareSelectionStore } from "@/stores/square-selection";
import { getGridTourSteps } from "./tour-steps";

const TOUR_DISMISSED_KEY = "grid-tour-dismissed";

export function useGridTour() {
  const { t } = useTranslation();
  const tourRef = useRef<Tour | null>(null);

  const startTour = useCallback(() => {
    if (tourRef.current?.isActive()) return;

    const squareCount = useGridEditorStore.getState().data.squares.length;

    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        cancelIcon: { enabled: true },
        scrollTo: { behavior: "smooth", block: "center" },
      },
    });

    const steps = getGridTourSteps(t, tour, { squareCount });
    for (const step of steps) {
      tour.addStep(step);
    }

    const cleanup = () => {
      useSquareSelectionStore.getState().clearSelection();
    };

    tour.on("complete", () => {
      cleanup();
      localStorage.setItem(TOUR_DISMISSED_KEY, "1");
    });
    tour.on("cancel", cleanup);

    tourRef.current = tour;
    tour.start();
  }, [t]);

  // Auto-trigger on first visit
  useEffect(() => {
    const dismissed = localStorage.getItem(TOUR_DISMISSED_KEY);
    if (dismissed) return;

    const timer = setTimeout(startTour, 600);
    return () => clearTimeout(timer);
  }, [startTour]);

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
