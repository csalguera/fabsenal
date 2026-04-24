import { notFound } from "next/navigation";
import Link from "next/link";
import CardImage from "../../../card-image";
import { getCardById, normalizeFieldValue } from "../../_lib";

type ViewCardPageProps = {
  params: Promise<{ id: string }>;
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
      </div>
    </section>
  );
}
