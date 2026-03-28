import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base styles
  "border-3 border-border font-bold transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)] active:translate-y-0 active:shadow-none disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none",
  {
    variants: {
      variant: {
        default: "bg-background",
        primary: "bg-primary",
        secondary: "bg-secondary",
        accent: "bg-accent",
        destructive: "bg-destructive text-destructive-foreground",
        ghost: "bg-transparent border-transparent shadow-none hover:bg-muted",
      },
      size: {
        sm: "px-4 py-1.5 text-sm",
        md: "px-6 py-2 text-sm",
        lg: "px-6 py-3 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
