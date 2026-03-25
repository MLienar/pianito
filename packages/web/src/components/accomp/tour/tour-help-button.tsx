import { useTranslation } from "react-i18next";
import { Button } from "@/components/button";

interface TourHelpButtonProps {
  onClick: () => void;
}

export function TourHelpButton({ onClick }: TourHelpButtonProps) {
  const { t } = useTranslation();

  return (
    <Button
      variant="accent"
      size="sm"
      onClick={onClick}
      aria-label={t("tour.helpButton")}
      title={t("tour.helpButton")}
    >
      ?
    </Button>
  );
}
