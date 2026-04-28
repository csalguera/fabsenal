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

function hasSubtype(card: CardLike, subtype: string) {
  return [
    ...(card.functionalSubtypes ?? []),
    ...(card.nonFunctionalSubtypes ?? []),
  ].some((value) => value.toLowerCase() === subtype.toLowerCase());
}

export function isMainDeckDisplayCard(card: CardLike) {
  return (card.types ?? []).some((type) => MAIN_DECK_TYPES.has(type));
}

export function hasAllySubtype(card: CardLike) {
  return hasSubtype(card, "ally");
}

function isBasicOrTokenRarity(card: CardLike) {
  return card.rarity === "Basic" || card.rarity === "Token";
}

function isResourceCard(card: CardLike) {
  return (card.types ?? []).includes("Resource");
}

export function shouldDisplayPitch(card: CardLike) {
  if (!isMainDeckDisplayCard(card)) {
    return card.pitch != null;
  }

  return !isBasicOrTokenRarity(card) && card.pitch != null;
}

export function shouldDisplayCost(card: CardLike) {
  if (!isMainDeckDisplayCard(card)) {
    return card.cost != null;
  }

  return !isResourceCard(card) && card.cost != null;
}

export function shouldDisplayDefense(card: CardLike) {
  if (!isMainDeckDisplayCard(card)) {
    return card.defense != null;
  }

  return (
    !isBasicOrTokenRarity(card) && !isResourceCard(card) && card.defense != null
  );
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
