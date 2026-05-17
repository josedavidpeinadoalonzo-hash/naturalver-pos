"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: LucideIcon;
  color: string;
  onPress?: () => void;
  className?: string;
}

function StatCard({ label, value, subValue, icon: Icon, color, onPress, className }: StatCardProps) {
  const Component = onPress ? "button" : "div";

  return (
    <Component
      onClick={onPress}
      className={cn(
        "flex items-center gap-3 rounded-xl bg-card p-4 shadow-sm border border-border",
        onPress && "cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]",
        className
      )}
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-lg font-bold">{value}</span>
        {subValue && (
          <span className="text-xs text-muted-foreground">{subValue}</span>
        )}
      </div>
    </Component>
  );
}

export { StatCard };
