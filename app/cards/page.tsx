import Link from "next/link";
import CardImage from "../card-image";
import { getCards, normalizeFieldValue, type CardView } from "./_lib";
import CardGalleryActions from "./card-gallery-actions";

export default async function CardsPage() {
  const cards = await getCards();

  return (
    <section className="cards-section">
      <div className="section-header">
        <h2>Cards</h2>
        <Link href="/cards/add" className="btn btn-primary">
          Add a Card
        </Link>
      </div>

      {cards.length === 0 ? (
        <p className="empty-state">
          No cards found yet. Add a card to get started.
        </p>
      ) : (
        <ul className="cards-grid">
          {cards.map((card: CardView) => {
            const imageSrc = normalizeFieldValue(card.imageUrl);

            return (
              <li key={card.id} className="card-item">
                <h3>{card.name}</h3>
                <p>Rarity: {card.rarity ?? "Common"}</p>
                {imageSrc ? (
                  <CardImage
                    src={imageSrc}
                    alt={card.name}
                    width={200}
                    height={300}
                  />
                ) : null}
                <CardGalleryActions id={card.id} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
