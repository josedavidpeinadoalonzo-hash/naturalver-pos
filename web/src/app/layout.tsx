import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NaturalVer's",
  description: "Sistema de punto de venta NaturalVer's",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NaturalVer's",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAF7" },
    { media: "(prefers-color-scheme: dark)", color: "#0E1511" },
  ],
};

import { PwaProvider } from "@/components/layout/pwa-provider";
import { BusinessProvider } from "@/lib/business-store";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>
        <BusinessProvider>
          <PwaProvider>
            <div id="app">{children}</div>
          </PwaProvider>
        </BusinessProvider>
      </body>
    </html>
  );
}
