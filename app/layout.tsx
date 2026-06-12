import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEXLAB - Système de Gestion Laboratoire",
  description: "LIMS professionnel - NEXLAB",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

import { ThemeProvider } from "@/components/ThemeProvider";
import { Providers } from "@/components/Providers";
import { auth } from "@/lib/security/auth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SessionManager } from "@/components/SessionManager";
import { DemoBannerWrapper } from "@/components/DemoBanner";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="bg-[var(--color-page)] font-sans antialiased text-[var(--color-text-secondary)]">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem storageKey="nexlab-theme" disableTransitionOnChange>
          <DemoBannerWrapper />
          <ErrorBoundary>
            <Providers session={session}>
              <SessionManager>
                {children}
              </SessionManager>
            </Providers>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
