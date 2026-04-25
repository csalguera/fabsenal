import { notFound } from "next/navigation";
import Link from "next/link";
import CardImage from "../../../card-image";
import { getCardById, normalizeFieldValue } from "../../_lib";
import {
  renderTokenizedInlineText,
  type InlineTokenMap,
} from "../../../tokenized-inline-text";

type ViewCardPageProps = {
  params: Promise<{ id: string }>;
};

const INLINE_TOKEN_MAP: InlineTokenMap = {
  "{resource}": {
    src: "/images/resource.png",
    alt: "Resource",
    width: 14,
    height: 14,
  },
  "{power}": {
    src: "/images/power.png",
    alt: "Power",
    width: 14,
    height: 14,
  },
  "{defense}": {
    src: "/images/defense.png",
    alt: "Defense",
    width: 14,
    height: 14,
  },
  "{tap}": {
    src: "/images/tap.png",
    alt: "Tap",
    width: 14,
    height: 14,
  },
  "{untap}": {
    src: "/images/untap.png",
    alt: "Untap",
    width: 14,
    height: 14,
  },
  "{life}": {
    src: "/images/life.png",
    alt: "Life",
    width: 14,
    height: 14,
  },
};

export default async function ViewCardPage({ params }: ViewCardPageProps) {
  const { id } = await params;
  const card = await getCardById(id);

  if (!card) {
    notFound();
  }

  const imageSrc = normalizeFieldValue(card.imageUrl);

  return (
    <section className="cards-section">
      <div className="section-header">
        <h2>{card.name}</h2>
        <div className="card-item-actions">
          <Link href={`/cards/${card.id}/edit`} className="btn btn-secondary">
            Edit
          </Link>
          <Link href="/cards" className="btn btn-primary">
            Back to Cards
          </Link>
        </div>
      </div>

      <div className="card-view-layout">
        {imageSrc ? (
          <CardImage src={imageSrc} alt={card.name} width={320} height={480} />
        ) : null}

        <div className="card-view-data">
          {[
            { label: "Rarity", value: card.rarity },
            { label: "Pitch", value: card.pitch },
            { label: "Cost", value: card.cost },
            { label: "Color", value: card.color },
            { label: "Power", value: card.power },
            { label: "Defense", value: card.defense },
            { label: "Intellect", value: card.intellect },
            { label: "Life", value: card.life },
            { label: "Types", value: card.types },
            { label: "Subtypes", value: card.subtypes },
            { label: "Talent", value: card.talent },
            { label: "Class", value: card.class },
            { label: "Traits", value: card.traits },
            { label: "Text Box", value: card.textBox },
          ].map((field) => {
            const displayValue = normalizeFieldValue(field.value);
            return displayValue ? (
              <p key={field.label}>
                {field.label}:{" "}
                {renderTokenizedInlineText(displayValue, INLINE_TOKEN_MAP)}
              </p>
            ) : null;
          })}

          {card.abilities && card.abilities.length > 0 ? (
            <div className="card-view-abilities">
              <p>Abilities:</p>
              {card.abilities.map((ability, index) => {
                const normalizedAbility = normalizeFieldValue(ability);
                if (!normalizedAbility) {
                  return null;
                }

                return (
                  <p key={`ability-${index}`}>
                    {renderTokenizedInlineText(
                      normalizedAbility,
                      INLINE_TOKEN_MAP,
                    )}
                  </p>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
