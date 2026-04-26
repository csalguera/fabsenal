import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import CardImage from "../../../card-image";
import { getCardById, getCardNavigation, normalizeFieldValue } from "../../_lib";
import {
  renderTokenizedInlineText,
  type InlineTokenMap,
} from "../../../tokenized-inline-text";

type ViewCardPageProps = {
  params: Promise<{ id: string }>;
};

const MAIN_DECK_TYPES = new Set([
  "Action",
  "Attack Reaction",
  "Block",
  "Instant",
  "Defense Reaction",
  "Resource",
]);

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

const ABILITY_TOKEN_MARKDOWN_MAP: Record<string, string> = {
  "{resource}": "![Resource](/images/resource.png)",
  "{power}": "![Power](/images/power.png)",
  "{defense}": "![Defense](/images/defense.png)",
  "{tap}": "![Tap](/images/tap.png)",
  "{untap}": "![Untap](/images/untap.png)",
  "{life}": "![Life](/images/life.png)",
};

const ABILITY_KEYWORD_REGEX =
  /\b(Attack Reaction|Defense Reaction|Action|Instant|Reaction)\b/gi;

function toAbilityMarkdown(value: string) {
  let formatted = value;

  for (const [token, markdownImage] of Object.entries(
    ABILITY_TOKEN_MARKDOWN_MAP,
  )) {
    formatted = formatted.replaceAll(token, markdownImage);
  }

  return formatted.replace(ABILITY_KEYWORD_REGEX, "***$1***");
}

function formatViewFieldValue(label: string, value: unknown) {
  if (
    (label === "Talent" ||
      label === "Class" ||
      label === "Functional Subtypes") &&
    Array.isArray(value)
  ) {
    const values = value
      .map((entry) => String(entry ?? "").trim())
      .filter(Boolean);

    return values.length > 0 ? values.join(" ") : null;
  }

  return normalizeFieldValue(
    value as Parameters<typeof normalizeFieldValue>[0],
  );
}

export default async function ViewCardPage({ params }: ViewCardPageProps) {
  const { id } = await params;
  const card = await getCardById(id);

  if (!card) {
    notFound();
  }

  const navigation = await getCardNavigation(card.id);
  const previousViewHref = navigation.previousId
    ? `/cards/${navigation.previousId}/view`
    : `/cards/${card.id}/view`;
  const nextViewHref = navigation.nextId
    ? `/cards/${navigation.nextId}/view`
    : `/cards/${card.id}/view`;

  const imageSrc = normalizeFieldValue(card.imageUrl);
  const shouldShowMainDeckStats = card.types?.some((type) =>
    MAIN_DECK_TYPES.has(type),
  );

  return (
    <section className="cards-section">
      <div className="section-header">
        <h2>{card.name}</h2>
        <div className="card-item-actions">
          <Link
            href={previousViewHref}
            className="btn btn-secondary"
            aria-disabled={!navigation.previousId}
          >
            Prev
          </Link>
          <Link
            href={nextViewHref}
            className="btn btn-secondary"
            aria-disabled={!navigation.nextId}
          >
            Next
          </Link>
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
            ...(shouldShowMainDeckStats
              ? [
                  { label: "Pitch", value: card.pitch },
                  { label: "Cost", value: card.cost },
                ]
              : []),
            { label: "Color", value: card.color },
            { label: "Power", value: card.power },
            { label: "Defense", value: card.defense },
            { label: "Intellect", value: card.intellect },
            { label: "Life", value: card.life },
            { label: "Types", value: card.types },
            {
              label: "Functional Subtypes",
              value: card.functionalSubtypes,
            },
            {
              label: "Non-Functional Subtypes",
              value: card.nonFunctionalSubtypes,
            },
            { label: "Talent", value: card.talent },
            { label: "Class", value: card.class },
            { label: "Traits", value: card.traits },
            { label: "Text Box", value: card.textBox },
          ].map((field) => {
            const displayValue = formatViewFieldValue(field.label, field.value);
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
                  <ReactMarkdown
                    key={`ability-${index}`}
                    components={{
                      p: ({ children }) => (
                        <span className="ability-markdown-line">{children}</span>
                      ),
                      img: ({ src, alt }) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={src ?? ""}
                          alt={alt ?? ""}
                          className="ability-token-icon"
                        />
                      ),
                    }}
                  >
                    {toAbilityMarkdown(normalizedAbility)}
                  </ReactMarkdown>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
