"use client";

import { useEffect, useState } from "react";
import { offlineDB } from "@/lib/offline";
import { startSyncListener } from "@/lib/offline/sync";
import { Wifi, WifiOff, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setOnline(navigator.onLine);

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }

    startSyncListener();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  async function handleInstall() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstallPrompt(null);
  }

  return (
    <>
      {/* Offline banner */}
      {!online && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-danger/90 text-danger-foreground px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
          <WifiOff className="h-4 w-4" />
          Sin conexión — los datos se sincronizarán automáticamente
        </div>
      )}

      {/* Install prompt */}
      {installPrompt && online && (
        <div className="fixed bottom-24 left-4 right-4 z-50 rounded-xl bg-card border border-border p-4 shadow-xl md:bottom-8 md:left-auto md:right-8 md:w-80">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Instala NaturalVer&apos;s</p>
              <p className="text-xs text-muted-foreground">Acceso r&aacute;pido desde tu pantalla de inicio</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setInstallPrompt(null)}
              className="flex-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Ahora no
            </button>
            <button
              onClick={handleInstall}
              className="flex-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
            >
              Instalar
            </button>
          </div>
        </div>
      )}

      {online && <div className="hidden"><Wifi className="h-4 w-4" /></div>}
      {children}
    </>
  );
}
