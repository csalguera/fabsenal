import Link from "next/link";

export default function CardsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="app-shell">
      <header className="hero-panel">
        <h1>Fabsenal</h1>
        <p>Flesh and Blood deckbuilding application</p>
        <nav className="page-actions" aria-label="Card pages">
          <Link href="/cards" className="btn btn-secondary">
            View Cards
          </Link>
          <Link href="/cards/add" className="btn btn-primary">
            Add Card
          </Link>
        </nav>
      </header>
      {children}
    </main>
  );
}
