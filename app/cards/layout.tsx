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
      </header>
      {children}
    </main>
  );
}
