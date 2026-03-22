import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { signIn, signUp } from "@/lib/auth";
import { Button } from "./button";

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = isSignup
      ? await signUp.email({ name, email, password })
      : await signIn.email({ email, password });

    if (result.error) {
      setError(
        result.error.message ??
          (isSignup ? "Failed to create account" : "Failed to sign in"),
      );
      setLoading(false);
    } else {
      navigate({ to: "/" });
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-md border-3 border-border bg-card p-8 shadow-[var(--shadow-brutal)]">
        <h1 className="text-3xl font-bold">
          {isSignup ? "Create account" : "Sign in"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {isSignup ? "Start your piano journey." : "Welcome back to pianito."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          {error && (
            <div className="border-3 border-border bg-destructive p-3 text-sm font-semibold text-destructive-foreground">
              {error}
            </div>
          )}

          {isSignup && (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold">Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="border-3 border-border bg-background p-3 font-mono text-sm outline-none focus:shadow-[var(--shadow-brutal-sm)]"
                placeholder="Your name"
              />
            </label>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-3 border-border bg-background p-3 font-mono text-sm outline-none focus:shadow-[var(--shadow-brutal-sm)]"
              placeholder="you@example.com"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={isSignup ? 8 : undefined}
              className="border-3 border-border bg-background p-3 font-mono text-sm outline-none focus:shadow-[var(--shadow-brutal-sm)]"
              placeholder="••••••••"
            />
          </label>

          <Button
            type="submit"
            disabled={loading}
            variant="primary"
            className="mt-2 p-3"
          >
            {loading
              ? isSignup
                ? "Creating account..."
                : "Signing in..."
              : isSignup
                ? "Create account"
                : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm">
          {isSignup ? "Already have an account? " : "Don't have an account? "}
          <Link
            to={isSignup ? "/login" : "/signup"}
            className="font-bold underline decoration-2 underline-offset-2 hover:text-primary"
          >
            {isSignup ? "Sign in" : "Sign up"}
          </Link>
        </p>
      </div>
    </div>
  );
}
