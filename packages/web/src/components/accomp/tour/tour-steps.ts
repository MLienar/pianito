import type { TFunction } from "i18next";
import type {
  PopperPlacement,
  StepOptions,
  StepOptionsButton,
  Tour,
} from "shepherd.js";
import { useSquareSelectionStore } from "@/stores/square-selection";

function getFirstSquareButton() {
  return document.querySelector(
    '[data-tour="grid-square"] button',
  ) as HTMLElement | null;
}

interface TourStepConfig {
  id: string;
  attachTo: { element: string; on: PopperPlacement };
  titleKey: string;
  textKey: string;
  beforeShowPromise?: () => Promise<void>;
  onHide?: () => void;
  canClickTarget?: boolean;
  /** Minimum number of squares required for this step (0 = no requirement) */
  minSquares?: number;
}

const STEP_CONFIGS: TourStepConfig[] = [
  // Phase 1 — Orientation
  {
    id: "grid-name",
    attachTo: { element: '[data-tour="grid-name"]', on: "bottom" },
    titleKey: "tour.gridName.title",
    textKey: "tour.gridName.text",
  },
  {
    id: "grid-overview",
    attachTo: { element: '[data-tour="grid-container"]', on: "bottom" },
    titleKey: "tour.gridOverview.title",
    textKey: "tour.gridOverview.text",
  },
  {
    id: "grid-square",
    attachTo: { element: '[data-tour="grid-square"]', on: "bottom" },
    titleKey: "tour.gridSquare.title",
    textKey: "tour.gridSquare.text",
    minSquares: 1,
  },
  // Phase 2 — Editing
  {
    id: "chord-search",
    attachTo: { element: '[data-tour="grid-square"]', on: "bottom" },
    titleKey: "tour.chordSearch.title",
    textKey: "tour.chordSearch.text",
    minSquares: 1,
    canClickTarget: false,
    beforeShowPromise: () =>
      new Promise<void>((resolve) => {
        getFirstSquareButton()?.click();
        setTimeout(resolve, 200);
      }),
    onHide: () => {
      getFirstSquareButton()?.click();
    },
  },
  {
    id: "resize-handle",
    attachTo: { element: '[data-tour="resize-handle"]', on: "left" },
    titleKey: "tour.resizeHandle.title",
    textKey: "tour.resizeHandle.text",
    minSquares: 1,
  },
  {
    id: "add-square",
    attachTo: { element: '[data-tour="add-square"]', on: "bottom" },
    titleKey: "tour.addSquare.title",
    textKey: "tour.addSquare.text",
  },
  {
    id: "multi-select",
    attachTo: { element: '[data-tour="grid-container"]', on: "bottom" },
    titleKey: "tour.multiSelect.title",
    textKey: "tour.multiSelect.text",
    minSquares: 1,
  },
  {
    id: "selection-toolbar",
    attachTo: { element: '[data-tour="selection-toolbar"]', on: "top" },
    titleKey: "tour.selectionToolbar.title",
    textKey: "tour.selectionToolbar.text",
    minSquares: 2,
    canClickTarget: false,
    beforeShowPromise: () =>
      new Promise<void>((resolve) => {
        const store = useSquareSelectionStore.getState();
        store.handleSquareClick(0, true, false, 999);
        store.handleSquareClick(1, true, false, 999);
        setTimeout(resolve, 100);
      }),
    onHide: () => {
      useSquareSelectionStore.getState().clearSelection();
    },
  },
  // Phase 3 — Playback & Settings
  {
    id: "play-button",
    attachTo: { element: '[data-tour="play-button"]', on: "bottom" },
    titleKey: "tour.playButton.title",
    textKey: "tour.playButton.text",
  },
  {
    id: "tempo",
    attachTo: { element: '[data-tour="tempo"]', on: "bottom" },
    titleKey: "tour.tempo.title",
    textKey: "tour.tempo.text",
  },
  {
    id: "loops",
    attachTo: { element: '[data-tour="loops"]', on: "bottom" },
    titleKey: "tour.loops.title",
    textKey: "tour.loops.text",
  },
  {
    id: "instruments",
    attachTo: { element: '[data-tour="instrument-toggles"]', on: "bottom" },
    titleKey: "tour.instruments.title",
    textKey: "tour.instruments.text",
  },
  {
    id: "style-select",
    attachTo: { element: '[data-tour="style-select"]', on: "bottom" },
    titleKey: "tour.styleSelect.title",
    textKey: "tour.styleSelect.text",
  },
  {
    id: "swing",
    attachTo: { element: '[data-tour="swing"]', on: "bottom" },
    titleKey: "tour.swing.title",
    textKey: "tour.swing.text",
  },
  {
    id: "save-button",
    attachTo: { element: '[data-tour="save-button"]', on: "bottom" },
    titleKey: "tour.saveButton.title",
    textKey: "tour.saveButton.text",
  },
];

export function getGridTourSteps(
  t: TFunction,
  tour: Tour,
  options?: { squareCount?: number },
): StepOptions[] {
  const count = options?.squareCount ?? 1;

  const filtered = STEP_CONFIGS.filter((cfg) => count >= (cfg.minSquares ?? 0));

  return filtered.map((cfg, index) => {
    const isFirst = index === 0;
    const isLast = index === filtered.length - 1;

    const buttons: StepOptionsButton[] = [];

    if (!isFirst) {
      buttons.push({
        text: t("tour.back"),
        action: () => tour.back(),
        classes: "shepherd-button",
      });
    }

    buttons.push({
      text: isLast ? t("tour.done") : t("tour.next"),
      action: () => (isLast ? tour.complete() : tour.next()),
      classes: "shepherd-button shepherd-button-primary",
    });

    const step: StepOptions = {
      id: cfg.id,
      title: t(cfg.titleKey),
      text: `<p>${t(cfg.textKey)}</p><p class="shepherd-progress">${index + 1}/${filtered.length}</p>`,
      attachTo: cfg.attachTo,
      buttons,
      canClickTarget: cfg.canClickTarget ?? true,
      cancelIcon: { enabled: true },
      scrollTo: { behavior: "smooth" as const, block: "center" as const },
    };

    if (cfg.beforeShowPromise) {
      step.beforeShowPromise = cfg.beforeShowPromise;
    }
    if (cfg.onHide) {
      step.when = { hide: cfg.onHide };
    }

    return step;
  });
}
