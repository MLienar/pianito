import type { TFunction } from "i18next";
import type { StepOptions, StepOptionsButton, Tour } from "shepherd.js";

interface ReadTourOptions {
  noteNames: string[];
}

export function getReadTourSteps(
  t: TFunction,
  tour: Tour,
  { noteNames }: ReadTourOptions,
): StepOptions[] {
  return noteNames.map((noteName, index) => {
    const isFirst = index === 0;
    const isLast = index === noteNames.length - 1;

    const buttons: StepOptionsButton[] = [];

    if (!isFirst) {
      buttons.push({
        text: t("tour.back"),
        action: () => tour.back(),
        classes: "shepherd-button",
      });
    }

    buttons.push({
      text: isLast ? t("common.start") : t("tour.next"),
      action: () => (isLast ? tour.complete() : tour.next()),
      classes: "shepherd-button shepherd-button-primary",
    });

    return {
      id: `intro-note-${index}`,
      title: `${t("intro.thisIsA")}${noteName}`,
      text: `<p class="shepherd-progress">${t("intro.pageProgress", { current: index + 1, total: noteNames.length })}</p>`,
      attachTo: {
        element: `[data-tour="intro-note-${index}"]`,
        on: "bottom" as const,
      },
      buttons,
      canClickTarget: false,
      cancelIcon: { enabled: true },
      scrollTo: { behavior: "smooth" as const, block: "center" as const },
    };
  });
}
