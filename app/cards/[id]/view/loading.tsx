export default function CardViewLoading() {
  return (
    <section className="cards-section" aria-busy="true">
      <div className="card-view-layout card-view-loading">
        <div className="card-view-loading-image" />
        <div className="card-view-loading-data">
          <div className="card-view-loading-line card-view-loading-line-lg" />
          <div className="card-view-loading-line" />
          <div className="card-view-loading-line" />
          <div className="card-view-loading-line card-view-loading-line-sm" />
          <div className="card-view-loading-line" />
          <div className="card-view-loading-line card-view-loading-line-sm" />
        </div>
      </div>
      <div className="card-item-actions card-view-loading-actions">
        <div className="card-view-loading-chip" />
        <div className="card-view-loading-chip" />
        <div className="card-view-loading-chip card-view-loading-chip-lg" />
      </div>
    </section>
  );
}
