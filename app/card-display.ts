import type { Card } from "./api/cards/types/card";

type CardLike = Partial<Card> & {
  types?: Card["types"];
  functionalSubtypes?: Card["functionalSubtypes"];
  nonFunctionalSubtypes?: Card["nonFunctionalSubtypes"];
  rarity?: Card["rarity"];
};

const MAIN_DECK_TYPES = new Set([
  "Action",
  "Attack Reaction",
  "Block",
  "Instant",
  "Defense Reaction",
  "Resource",
]);

const NO_PITCH_OR_COLOR_TYPES = new Set([
  "Equipment",
  "Hero",
  "Demi-Hero",
  "Weapon",
]);

const NO_COST_TYPES = new Set([
  "Equipment",
  "Hero",
  "Demi-Hero",
  "Weapon",
  "Resource",
]);

const NO_POWER_TYPES = new Set([
  "Action",
  "Block",
  "Defense Reaction",
  "Instant",
  "Resource",
  "Equipment",
  "Hero",
  "Demi-Hero",
]);

const NO_DEFENSE_TYPES = new Set([
  "Action",
  "Block",
  "Defense Reaction",
  "Instant",
  "Resource",
  "Weapon",
  "Hero",
  "Demi-Hero",
]);

function hasSubtype(card: CardLike, subtype: string) {
  return [
    ...(card.functionalSubtypes ?? []),
    ...(card.nonFunctionalSubtypes ?? []),
  ].some((value) => value.toLowerCase() === subtype.toLowerCase());
}

function hasType(card: CardLike, type: string) {
  return (card.types ?? []).some((value) => value === type);
}

function hasAnyType(card: CardLike, types: Set<string>) {
  return Array.from(types).some((type) => hasType(card, type));
}

function isTokenLikeRarity(card: CardLike) {
  return card.rarity === "Basic" || card.rarity === "Token";
}

export function isMainDeckDisplayCard(card: CardLike) {
  return (card.types ?? []).some((type) => MAIN_DECK_TYPES.has(type));
}

export function hasAllySubtype(card: CardLike) {
  return hasSubtype(card, "ally");
}

export function shouldDisplayPitch(card: CardLike) {
  if (card.pitch == null || isTokenLikeRarity(card)) {
    return false;
  }

  return !hasAnyType(card, NO_PITCH_OR_COLOR_TYPES);
}

export function shouldDisplayCost(card: CardLike) {
  if (card.cost == null || isTokenLikeRarity(card)) {
    return false;
  }

  return !hasAnyType(card, NO_COST_TYPES);
}

export function shouldDisplayColor(card: CardLike) {
  if (card.color == null || isTokenLikeRarity(card)) {
    return false;
  }

  return !hasAnyType(card, NO_PITCH_OR_COLOR_TYPES);
}

export function shouldDisplayPower(card: CardLike) {
  if (card.power == null) {
    return false;
  }

  return !hasAnyType(card, NO_POWER_TYPES);
}

export function shouldDisplayDefense(card: CardLike) {
  if (card.defense == null) {
    return false;
  }

  return !hasAnyType(card, NO_DEFENSE_TYPES);
}

export function shouldDisplayLife(card: CardLike) {
  if (card.life == null) {
    return false;
  }

  if (isMainDeckDisplayCard(card)) {
    return hasAllySubtype(card);
  }

  return true;
}
