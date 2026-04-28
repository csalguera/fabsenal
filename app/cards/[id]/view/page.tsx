import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import CardImage from "../../../card-image";
import {
  hasAllySubtype,
  isMainDeckDisplayCard,
  shouldDisplayCost,
  shouldDisplayDefense,
  shouldDisplayLife,
  shouldDisplayPitch,
} from "../../../card-display";
import {
  getCardById,
  getCardNavigation,
  normalizeFieldValue,
} from "../../_lib";
import ViewCardActions from "./view-card-actions";
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

const ABILITY_TOKEN_MARKDOWN_MAP: Record<string, string> = {
  "{resource}": "![Resource](/images/resource.png)",
  "{power}": "![Power](/images/power.png)",
  "{defense}": "![Defense](/images/defense.png)",
  "{tap}": "![Tap](/images/tap.png)",
  "{untap}": "![Untap](/images/untap.png)",
  "{life}": "![Life](/images/life.png)",
};

function toAbilityMarkdown(value: string) {
  let formatted = value;

  for (const [token, markdownImage] of Object.entries(
    ABILITY_TOKEN_MARKDOWN_MAP,
  )) {
    formatted = formatted.replaceAll(token, markdownImage);
  }

  return formatted;
}

function formatViewFieldValue(label: string, value: unknown) {
  if (
    (label === "Talent" || label === "Class" || label === "Subtypes") &&
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
  const isMainDeckCard = isMainDeckDisplayCard(card);
  const cardHasAllySubtype = hasAllySubtype(card);
  const mergedSubtypes = Array.from(
    new Set([
      ...(card.functionalSubtypes ?? []),
      ...(card.nonFunctionalSubtypes ?? []),
    ]),
  );

  return (
    <section className="cards-section">
      <div className="card-view-layout">
        {imageSrc ? (
          <CardImage src={imageSrc} alt={card.name} width={320} height={480} />
        ) : null}

        <div className="card-view-data">
          {[
            { label: "Name", value: card.name },
            { label: "Rarity", value: card.rarity },
            ...(shouldDisplayPitch(card)
              ? [{ label: "Pitch", value: card.pitch }]
              : []),
            ...(shouldDisplayCost(card)
              ? [{ label: "Cost", value: card.cost }]
              : []),
            { label: "Color", value: card.color },
            ...(card.power != null
              ? [{ label: "Power", value: card.power }]
              : []),
            ...(shouldDisplayDefense(card)
              ? [{ label: "Defense", value: card.defense }]
              : []),
            ...(!isMainDeckCard && card.intellect != null
              ? [{ label: "Intellect", value: card.intellect }]
              : []),
            ...(!isMainDeckCard && card.life != null
              ? [{ label: "Life", value: card.life }]
              : cardHasAllySubtype && shouldDisplayLife(card)
              ? [{ label: "Life", value: card.life }]
              : []),
            { label: "Types", value: card.types },
            {
              label: "Subtypes",
              value: mergedSubtypes,
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
                        <span className="ability-markdown-line">
                          {children}
                        </span>
                      ),
                      img: ({ src, alt }) => (
                        <CardImage
                          src={typeof src === "string" ? src : "/file.svg"}
                          alt={alt ?? ""}
                          width={14}
                          height={14}
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
      <ViewCardActions
        previousViewHref={previousViewHref}
        nextViewHref={nextViewHref}
        hasPrevious={Boolean(navigation.previousId)}
        hasNext={Boolean(navigation.nextId)}
        cardId={card.id}
      />
    </section>
  );
}
