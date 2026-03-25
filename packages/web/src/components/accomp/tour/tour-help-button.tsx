import { useTranslation } from "react-i18next";
import { Button } from "@/components/button";
import { Tooltip } from "@/components/tooltip";

interface TourHelpButtonProps {
  onClick: () => void;
}

export function TourHelpButton({ onClick }: TourHelpButtonProps) {
  const { t } = useTranslation();

  return (
    <Tooltip content={t("tour.helpButton")}>
      <Button
        variant="accent"
        size="sm"
        onClick={onClick}
        aria-label={t("tour.helpButton")}
      >
        ?
      </Button>
    </Tooltip>
  );
}
