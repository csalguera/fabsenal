import Link from "next/link";
import CardImage from "../card-image";
import { getCards, normalizeFieldValue, type CardView } from "./_lib";

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
                <div className="card-meta">
                  {[
                    { label: "Pitch", value: card.pitch },
                    { label: "Color", value: card.color },
                    { label: "Power", value: card.power },
                    { label: "Defense", value: card.defense },
                    { label: "Intellect", value: card.intellect },
                    { label: "Life", value: card.life },
                    { label: "Types", value: card.types },
                    { label: "Subtypes", value: card.subtypes },
                    { label: "Supertypes", value: card.supertypes },
                    { label: "Traits", value: card.traits },
                    { label: "Text Box", value: card.textBox },
                    { label: "Abilities", value: card.abilities },
                  ].map((field) => {
                    const displayValue = normalizeFieldValue(field.value);
                    return displayValue ? (
                      <p key={field.label}>
                        {field.label}: {displayValue}
                      </p>
                    ) : null;
                  })}
                </div>
                {imageSrc ? (
                  <CardImage
                    src={imageSrc}
                    alt={card.name}
                    width={200}
                    height={300}
                  />
                ) : null}
                <div className="card-item-actions">
                  <Link
                    href={`/cards/${card.id}/edit`}
                    className="btn btn-secondary"
                  >
                    Edit Card
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
