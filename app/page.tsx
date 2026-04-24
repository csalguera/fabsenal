import { headers } from "next/headers";
import { Card } from "./api/cards/types/card";
import AddCardButton from "./add-card-button";
import CardImage from "./card-image";
import CardActions from "./card-actions";

type CardView = Partial<Card> & Pick<Card, "id" | "name">;

type FieldValue = string | number | string[] | null | undefined;

function normalizeFieldValue(value: FieldValue): string | null {
  if (value == null) {
    return null;
  }

  if (Array.isArray(value)) {
    const normalizedValues = value
      .map((item) => normalizeFieldValue(item))
      .filter((item): item is string => item !== null);

    return normalizedValues.length > 0 ? normalizedValues.join(", ") : null;
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();
    if (!trimmedValue || trimmedValue.toLowerCase() === "none") {
      return null;
    }

    return trimmedValue;
  }

  return String(value);
}

async function getCards() {
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") ?? "http";

  if (!host) {
    return [] as CardView[];
  }

  try {
    const response = await fetch(`${protocol}://${host}/api/cards`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return [] as CardView[];
    }

    return (await response.json()) as CardView[];
  } catch (error) {
    console.error("Cards fetch failed", error);
    return [] as CardView[];
  }
}

const Home = async () => {
  const cards = await getCards();

  return (
    <main className="app-shell">
      <header className="hero-panel">
        <h1>Fabsenal</h1>
        <p>Flesh and Blood deckbuilding application</p>
      </header>

      <section className="add-card-panel">
        <AddCardButton />
      </section>

      <section className="cards-section">
        <h2>Cards</h2>
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
                  <CardActions card={card} />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
};

export default Home;
