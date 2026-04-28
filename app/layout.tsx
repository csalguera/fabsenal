import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthSessionProvider } from "./auth/session-provider";
import AuthControls from "./auth/auth-controls";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fabsenal - Flesh and Blood Deckbuilder",
  description: "Flesh and Blood deckbuilding application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthSessionProvider>
          <header className="top-nav-shell">
            <nav className="top-nav" aria-label="Main navigation">
              <Link
                href="/"
                className="top-nav-brand"
                aria-label="Fabsenal home"
              >
                Fabsenal
              </Link>
              <div className="top-nav-links">
                <Link href="/" className="top-nav-link">
                  Home
                </Link>
                <Link href="/cards" className="top-nav-link">
                  Cards
                </Link>
                <Link href="/decks" className="top-nav-link">
                  Decks
                </Link>
              </div>
              <AuthControls />
            </nav>
          </header>
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  );
}
