import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-8 py-12">
      <div>
        <h1 className="text-5xl font-bold tracking-tight">pianito</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {t("home.tagline")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Link to="/read" search={{ clef: "treble" }}>
          <Card
            title={t("home.readMusic")}
            description={t("home.readMusicDescription")}
            color="bg-primary"
          />
        </Link>
        <Card
          title={t("home.chords")}
          description={t("home.chordsDescription")}
          color="bg-secondary"
        />
        <Link to="/accomp">
          <Card
            title={t("home.playSongs")}
            description={t("home.playSongsDescription")}
            color="bg-accent"
          />
        </Link>
      </div>
    </div>
  );
}

function Card({
  title,
  description,
  color,
}: {
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div
      className={`${color} cursor-pointer border-3 border-border p-6 shadow-[var(--shadow-brutal)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal-hover)]`}
    >
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-2">{description}</p>
    </div>
  );
}
