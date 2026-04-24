import Link from "next/link";

export default function Home() {
  return (
    <main className="app-shell">
      <header className="hero-panel">
        <h1>Fabsenal</h1>
        <p>Flesh and Blood deckbuilding application</p>
        <div className="page-actions">
          <Link href="/cards" className="btn btn-primary">
            Browse Cards
          </Link>
        </div>
      </header>

      <section className="cards-section">
        <h2>Welcome</h2>
        <p className="empty-state">
          Use the Cards page to view, add, edit, and manage your Flesh and Blood
          cards.
        </p>
      </section>
    </main>
  );
}
