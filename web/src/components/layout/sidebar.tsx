"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useBusiness } from "@/lib/business-store";
import { mainNav, managementNav, isActive } from "@/lib/navigation";
import { BusinessSelector } from "./business-selector";

const logos: Record<string, { text: string; bg: string }> = {
  "bodega-derwin": { text: "\uD83C\uDFEA", bg: "bg-blue-600" },
  heladeria: { text: "\uD83C\uDF66", bg: "bg-pink-500" },
  kiosco: { text: "\uD83D\uDED2", bg: "bg-amber-500" },
  naturalvers: { text: "N", bg: "bg-primary" },
};

function Sidebar() {
  const pathname = usePathname();
  const { business } = useBusiness();
  const logo = logos[business?.slug || ""] || { text: "N", bg: "bg-primary" };

  return (
    <aside className="hide-mobile flex h-screen w-64 flex-col border-r border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-5">
        <div className="flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${logo.bg}`}>
            {logo.text.length <= 2 ? (
              <span className="text-sm font-bold text-white">{logo.text}</span>
            ) : (
              <span className="text-lg">{logo.text}</span>
            )}
          </div>
          <span className="text-lg font-bold text-foreground">{business?.name || "NaturalVer's"}</span>
        </div>
        <BusinessSelector />
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <div className="mb-6">
          <p className="mb-2 px-2 text-xs font-medium uppercase text-muted-foreground">
            Principal
          </p>
          <div className="space-y-1">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive(pathname, item.href)
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 px-2 text-xs font-medium uppercase text-muted-foreground">
            Gestión
          </p>
          <div className="space-y-1">
            {managementNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive(pathname, item.href)
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </aside>
  );
}

export { Sidebar };
