import type { Card, CardRarity } from "../api/cards/types/card";
import type {
  DeckBuildContext,
  DeckCardEntry,
  DeckFormat,
  DeckRecord,
  DeckValidationResult,
} from "./types";

const MAIN_DECK_TYPES = new Set([
  "Action",
  "Block",
  "Instant",
  "Attack Reaction",
  "Defense Reaction",
  "Resource",
]);

const SILVER_AGE_ALLOWED_RARITIES = new Set<CardRarity>([
  "Common",
  "Basic",
  "Token",
  "Rare",
  "Promo",
]);

function hasSubtype(card: Card, subtype: string) {
  return (card.nonFunctionalSubtypes ?? []).includes(subtype as never);
}

function isYoungOrPitFighter(card: Card) {
  return hasSubtype(card, "Young") || hasSubtype(card, "Pit-Fighter");
}

export function isHeroCard(card: Card) {
  return card.types.includes("Hero");
}

export function isTokenCard(card: Card) {
  return card.types.includes("Token");
}

export function isEquipmentOrWeapon(card: Card) {
  return card.types.includes("Equipment") || card.types.includes("Weapon");
}

export function isMainDeckCard(card: Card) {
  return card.types.some((type) => MAIN_DECK_TYPES.has(type));
}

export function isHeroAllowedForFormat(hero: Card, format: DeckFormat) {
  if (!isHeroCard(hero)) {
    return false;
  }

  const isSilverHero = isYoungOrPitFighter(hero);
  return format === "silver-age" ? isSilverHero : !isSilverHero;
}

function cardClassMatchesHero(card: Card, hero: Card) {
  const cardClasses = card.class ?? [];
  if (cardClasses.length === 0) {
    return true;
  }

  const heroClasses = hero.class ?? [];
  return cardClasses.every(
    (cardClass) => cardClass === "Generic" || heroClasses.includes(cardClass),
  );
}

function cardTalentMatchesHero(card: Card, hero: Card) {
  const cardTalents = card.talent ?? [];
  if (cardTalents.length === 0) {
    return true;
  }

  const heroTalents = hero.talent ?? [];
  return cardTalents.every((talent) => heroTalents.includes(talent));
}

export function isCardAllowedForDeck(
  card: Card,
  hero: Card,
  format: DeckFormat,
): boolean {
  if (isHeroCard(card)) {
    return false;
  }

  if (
    format === "silver-age" &&
    !SILVER_AGE_ALLOWED_RARITIES.has(card.rarity)
  ) {
    return false;
  }

  return cardClassMatchesHero(card, hero) && cardTalentMatchesHero(card, hero);
}

export function getCopyLimitForCard(card: Card, format: DeckFormat) {
  if (isTokenCard(card)) {
    return Number.POSITIVE_INFINITY;
  }

  if (isEquipmentOrWeapon(card)) {
    return 1;
  }

  return format === "silver-age" ? 2 : 3;
}

export function getUniqueCardKey(card: Card) {
  return `${card.name}::${card.color ?? "none"}`;
}

function getFormatDeckConstraints(format: DeckFormat) {
  return format === "silver-age"
    ? { inventoryMax: 55, mainDeckMin: 40 }
    : { inventoryMax: 80, mainDeckMin: 60 };
}

function sumQuantity(entries: DeckCardEntry[]) {
  return entries.reduce((total, entry) => total + entry.quantity, 0);
}

export function validateDeck(
  deck: Pick<DeckRecord, "format" | "heroCardId" | "cards">,
  context: DeckBuildContext,
): DeckValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const hero = context.heroCard;
  if (!hero) {
    errors.push("Select a hero.");
    return {
      isValid: false,
      errors,
      warnings,
      counts: { inventory: 0, mainDeck: 0 },
    };
  }

  if (!isHeroAllowedForFormat(hero, deck.format)) {
    errors.push("Selected hero is not legal for the chosen format.");
  }

  const uniqueCardTotals = new Map<string, number>();

  const inventoryEntries: DeckCardEntry[] = [];
  const mainDeckEntries: DeckCardEntry[] = [];

  for (const entry of deck.cards) {
    if (entry.quantity <= 0) {
      continue;
    }

    const card = context.cardsById.get(entry.cardId);
    if (!card) {
      errors.push(`Card not found for id ${entry.cardId}.`);
      continue;
    }

    if (!isCardAllowedForDeck(card, hero, deck.format)) {
      errors.push(`${card.name} is not legal for this hero or format.`);
    }

    if (!isTokenCard(card)) {
      inventoryEntries.push(entry);
    }

    if (isMainDeckCard(card) && !isTokenCard(card)) {
      mainDeckEntries.push(entry);
    }

    const uniqueKey = getUniqueCardKey(card);
    const nextTotal = (uniqueCardTotals.get(uniqueKey) ?? 0) + entry.quantity;
    uniqueCardTotals.set(uniqueKey, nextTotal);

    const maxCopies = getCopyLimitForCard(card, deck.format);
    if (Number.isFinite(maxCopies) && nextTotal > maxCopies) {
      errors.push(
        `${card.name} (${card.color ?? "no color"}) exceeds copy limit of ${maxCopies}.`,
      );
    }
  }

  const constraints = getFormatDeckConstraints(deck.format);
  const inventoryCount = sumQuantity(inventoryEntries);
  const mainDeckCount = sumQuantity(mainDeckEntries);

  if (inventoryCount > constraints.inventoryMax) {
    errors.push(
      `Inventory exceeds ${constraints.inventoryMax} cards (hero and tokens excluded).`,
    );
  }

  if (mainDeckCount < constraints.mainDeckMin) {
    errors.push(
      `Main deck must contain at least ${constraints.mainDeckMin} cards.`,
    );
  }

  const equipmentAndWeapons = deck.cards
    .map((entry) => ({ entry, card: context.cardsById.get(entry.cardId) }))
    .filter(
      (item): item is { entry: DeckCardEntry; card: Card } =>
        !!item.card &&
        isEquipmentOrWeapon(item.card) &&
        item.entry.quantity > 0,
    );

  if (equipmentAndWeapons.length === 0) {
    warnings.push(
      "Recommended: include at least one equipment or weapon card.",
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    counts: {
      inventory: inventoryCount,
      mainDeck: mainDeckCount,
    },
  };
}
