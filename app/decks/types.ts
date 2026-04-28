import type { Card } from "../api/cards/types/card";

export type DeckFormat = "silver-age" | "classic-constructed";
export type DeckVisibility = "public" | "private";

export type DeckCardEntry = {
  cardId: string;
  quantity: number;
};

export type DeckRecord = {
  id: string;
  name: string;
  format: DeckFormat;
  heroCardId: string;
  cards: DeckCardEntry[];
  visibility: DeckVisibility;
  ownerId: string | null;
  ownerEmail: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GuestDeckRecord = DeckRecord & {
  guestExpiresAt: string;
};

export type DeckValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  counts: {
    inventory: number;
    mainDeck: number;
  };
};

export type DeckBuildContext = {
  cardsById: Map<string, Card>;
  heroCard: Card | null;
};
