import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  variant?: "elevated" | "glass" | "flat";
  accentColor?: string;
  onPress?: () => void;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
  style?: React.CSSProperties;
}

const variantStyles: Record<string, string> = {
  elevated: "bg-card shadow-md border border-border",
  glass: "bg-card/80 backdrop-blur-sm border border-border/50",
  flat: "bg-card border-0",
};

function Card({ className, variant = "elevated", accentColor, onPress, onClick, children, style }: CardProps) {
  const handleClick = onPress || onClick;
  const classes = cn(
    "rounded-xl p-4 text-left",
    variantStyles[variant],
    handleClick && "cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]",
    className
  );
  const mergedStyle = {
    ...(accentColor ? { borderLeftColor: accentColor, borderLeftWidth: 3 } : {}),
    ...style,
  };

  if (handleClick) {
    return (
      <button className={classes} onClick={handleClick} style={mergedStyle as React.CSSProperties}>
        {children}
      </button>
    );
  }

  return (
    <div className={classes} style={mergedStyle}>
      {children}
    </div>
  );
}

function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("", className)} {...props}>
      {children}
    </div>
  );
}

export { Card, CardContent };
