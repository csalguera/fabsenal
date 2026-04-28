import Link from "next/link";

export default function Home() {
  return (
    <main className="app-shell">
      <header className="hero-panel">
        <h1>Fabsenal</h1>
        <p>Flesh and Blood deckbuilding application</p>
      </header>

      <section className="cards-section card-home-banner">
        <h2>Welcome</h2>
        <p className="empty-state">
          Navigate to the cards page to preview all available cards.
        </p>
        <div className="page-actions">
          <Link href="/cards" className="btn btn-primary">
            Browse Cards
          </Link>
        </div>
      </section>

      <section className="cards-section decks-home-banner">
        <h2>View Decks</h2>
        <p className="empty-state">
          Gain inspiration from other user decks.
        </p>
        <div className="page-actions">
          <Link href="/decks" className="btn btn-primary">
            Browse Decks
          </Link>
        </div>
      </section>

      <section className="cards-section deck-home-banner">
        <h2>Start Building</h2>
        <p className="empty-state">
          Pick a format, select your hero, and build a deck.
        </p>
        <div className="page-actions">
          <Link
            href="/decks/add"
            className="btn btn-primary btn-icon"
            aria-label="Create deck"
            title="Create deck"
          >
            Create Deck
          </Link>
        </div>
      </section>
    </main>
  );
}
