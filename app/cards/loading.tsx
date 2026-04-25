export default function CardsLoading() {
  return (
    <section className="cards-section" aria-busy="true">
      <div className="section-header">
        <h2>Cards</h2>
      </div>
      <p className="cards-results-count">Loading cards...</p>
      <ul className="cards-grid">
        {Array.from({ length: 6 }, (_, index) => (
          <li key={index} className="card-item">
            <div className="card-image-shell" />
          </li>
        ))}
      </ul>
    </section>
  );
}
