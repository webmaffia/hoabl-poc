"use client";

import React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "gold";
type Size = "md" | "lg" | "sm";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-forest-800 text-ivory-100 hover:bg-forest-700 active:bg-forest-900 shadow-card disabled:opacity-50",
  secondary:
    "bg-ivory-200 text-forest-900 hover:bg-ivory-300 active:bg-ivory-300",
  outline:
    "bg-transparent border border-forest-800/20 text-forest-900 hover:bg-forest-800/5",
  ghost: "bg-transparent text-forest-800 hover:bg-forest-800/5",
  // Bronze-gold CTA for dark, hero-style screens (see Screen01) where the
  // default `primary` (a dark plum button) wouldn't stand out against an
  // already-dark background.
  gold: "bg-gold-500 text-forest-950 hover:bg-gold-400 active:bg-gold-600 shadow-card disabled:opacity-50",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-sm px-3 py-1.5 rounded-lg",
  md: "text-[15px] px-5 py-3 rounded-xl",
  lg: "text-base px-6 py-4 rounded-xl",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 disabled:cursor-not-allowed select-none",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
