import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="flex flex-col gap-8 py-12">
      <div>
        <h1 className="text-5xl font-bold tracking-tight">pianito</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Learn piano, read music, master chords.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Link to="/read" search={{ clef: "treble" }}>
          <Card
            title="Read Music"
            description="Learn to read music notation with interactive exercises."
            color="bg-primary"
          />
        </Link>
        <Card
          title="Chords"
          description="Visualize and learn chords with scale degrees."
          color="bg-secondary"
        />
        <Card
          title="Play Songs"
          description="Play along with backing tracks and accompaniment."
          color="bg-accent"
        />
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
