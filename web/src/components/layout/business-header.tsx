"use client";

import { useBusiness } from "@/lib/business-store";

const businessIcons: Record<string, string> = {
  "bodega-derwin": "\uD83C\uDFEA",
  heladeria: "\uD83C\uDF66",
  kiosco: "\uD83D\uDED2",
  naturalvers: "\uD83C\uDF3F",
};

const businessLogos: Record<string, { text: string; bg: string }> = {
  "bodega-derwin": { text: "\uD83C\uDFEA", bg: "bg-blue-600" },
  heladeria: { text: "\uD83C\uDF66", bg: "bg-pink-500" },
  kiosco: { text: "\uD83D\uDED2", bg: "bg-amber-500" },
  naturalvers: { text: "N", bg: "bg-primary" },
};

export function BusinessHeader() {
  const { business } = useBusiness();

  if (!business) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
          <span className="text-xs font-bold text-primary-foreground">N</span>
        </div>
        <span className="font-bold text-foreground">NaturalVer&apos;s</span>
      </div>
    );
  }

  const logo = businessLogos[business.slug] || { text: "\uD83C\uDFEA", bg: "bg-primary" };

  return (
    <div className="flex items-center gap-2">
      <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${logo.bg}`}>
        {business && logo.text.length <= 2 ? (
          <span className="text-xs font-bold text-white">{logo.text}</span>
        ) : (
          <span className="text-sm">{logo.text}</span>
        )}
      </div>
      <span className="font-bold text-foreground">{business.name}</span>
    </div>
  );
}
