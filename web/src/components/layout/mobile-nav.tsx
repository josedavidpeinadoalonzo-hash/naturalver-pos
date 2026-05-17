"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { mobileBottomNav, managementNav, isActive } from "@/lib/navigation";
import { MoreHorizontal, X } from "lucide-react";

function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [showMore, setShowMore] = useState(false);

  const handleMoreNav = (href: string) => {
    setShowMore(false);
    router.push(href);
  };

  return (
    <>
      <nav className="hide-desktop fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card">
        <div className="flex items-center justify-around h-16">
          {mobileBottomNav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors min-w-0 flex-1",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setShowMore(true)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors min-w-0 flex-1",
              showMore ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>Más</span>
          </button>
        </div>
      </nav>

      {/* More drawer overlay */}
      {showMore && (
        <div
          className="hide-desktop fixed inset-0 z-[60] bg-black/50"
          onClick={() => setShowMore(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-card p-6 pb-10 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Menú</h2>
              <button
                onClick={() => setShowMore(false)}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-1">
              {managementNav.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <button
                    key={item.href}
                    onClick={() => handleMoreNav(item.href)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors",
                      active
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export { MobileNav };
