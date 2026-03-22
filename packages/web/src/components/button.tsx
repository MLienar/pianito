import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "primary" | "accent" | "ghost";

const variantClasses: Record<ButtonVariant, string> = {
  default: "bg-background",
  primary: "bg-primary",
  accent: "bg-accent",
  ghost: "bg-transparent border-transparent shadow-none",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "px-4 py-1.5 text-sm",
  md: "px-6 py-2 text-sm",
  lg: "px-6 py-3 text-lg",
};

export function Button({
  variant = "default",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "border-3 border-border font-bold transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)] active:translate-y-0 active:shadow-none disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
