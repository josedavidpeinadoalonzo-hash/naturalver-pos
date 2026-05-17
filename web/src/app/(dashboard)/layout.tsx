export const dynamic = "force-dynamic";

import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { EmployeeGate } from "@/components/layout/employee-gate";
import { BusinessSelector } from "@/components/layout/business-selector";
import { PriceUpdater } from "@/components/layout/price-updater";
import { BusinessHeader } from "@/components/layout/business-header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <EmployeeGate>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <header className="hide-desktop flex items-center justify-between border-b border-border bg-card px-4 py-3">
            <BusinessHeader />
            <div className="flex items-center gap-2">
              <BusinessSelector />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
            <div className="mx-auto max-w-5xl p-4 md:p-6">{children}</div>
          </main>
        </div>
        <MobileNav />
      </div>
      <PriceUpdater />
    </EmployeeGate>
  );
}
