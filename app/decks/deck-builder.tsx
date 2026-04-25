"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Card } from "../api/cards/types/card";
import {
  getCopyLimitForCard,
  getUniqueCardKey,
  isCardAllowedForDeck,
  isEquipmentOrWeapon,
  isHeroAllowedForFormat,
  isHeroCard,
  isMainDeckCard,
  isTokenCard,
  validateDeck,
} from "./rules";
import { getClientUserId } from "./auth-client";
import { getGuestDeckById, saveGuestDeck } from "./storage";
import type {
  DeckCardEntry,
  DeckFormat,
  DeckRecord,
  DeckVisibility,
} from "./types";

type DeckBuilderProps = {
  deckId?: string;
};

type EditableDeck = {
  id: string;
  name: string;
  format: DeckFormat;
  heroCardId: string;
  cards: DeckCardEntry[];
  visibility: DeckVisibility;
};

const INITIAL_DECK: EditableDeck = {
  id: "",
  name: "",
  format: "silver-age",
  heroCardId: "",
  cards: [],
  visibility: "private",
};

function toCardMap(cards: Card[]) {
  return new Map(cards.map((card) => [card.id, card]));
}

function countForCard(entries: DeckCardEntry[], cardId: string) {
  return entries.find((entry) => entry.cardId === cardId)?.quantity ?? 0;
}

function getUniqueCopies(
  entries: DeckCardEntry[],
  cardsById: Map<string, Card>,
  card: Card,
) {
  const key = getUniqueCardKey(card);

  return entries.reduce((total, entry) => {
    const entryCard = cardsById.get(entry.cardId);
    if (!entryCard) {
      return total;
    }

    return getUniqueCardKey(entryCard) === key ? total + entry.quantity : total;
  }, 0);
}

function withQuantity(
  entries: DeckCardEntry[],
  cardId: string,
  quantity: number,
) {
  const filtered = entries.filter((entry) => entry.cardId !== cardId);
  if (quantity <= 0) {
    return filtered;
  }

  return [...filtered, { cardId, quantity }];
}

function byName(a: Card, b: Card) {
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}

export default function DeckBuilder({ deckId }: DeckBuilderProps) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [deck, setDeck] = useState<EditableDeck>(INITIAL_DECK);
  const [cardSearch, setCardSearch] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setUserId(getClientUserId());
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const cardsResponse = await fetch("/api/cards?all=true", {
          cache: "no-store",
        });
        const cardsPayload = await cardsResponse.json();
        const allCards: Card[] = Array.isArray(cardsPayload)
          ? cardsPayload
          : (cardsPayload.items ?? []);

        if (cancelled) {
          return;
        }

        setCards(allCards);

        if (!deckId) {
          setDeck({ ...INITIAL_DECK, id: `guest-${crypto.randomUUID()}` });
          return;
        }

        const dbResponse = await fetch(
          `/api/decks?id=${encodeURIComponent(deckId)}`,
          {
            cache: "no-store",
            headers: userId ? { "x-user-id": userId } : undefined,
          },
        );

        if (dbResponse.ok) {
          const dbDeck = (await dbResponse.json()) as DeckRecord;
          if (!cancelled) {
            setDeck({
              id: dbDeck.id,
              name: dbDeck.name,
              format: dbDeck.format,
              heroCardId: dbDeck.heroCardId,
              cards: dbDeck.cards,
              visibility: dbDeck.visibility,
            });
          }
          return;
        }

        const guestDeck = getGuestDeckById(deckId);
        if (guestDeck && !cancelled) {
          setDeck({
            id: guestDeck.id,
            name: guestDeck.name,
            format: guestDeck.format,
            heroCardId: guestDeck.heroCardId,
            cards: guestDeck.cards,
            visibility: guestDeck.visibility,
          });
          return;
        }

        setStatus("Deck not found.");
      } catch (error) {
        console.error("Failed to load deck builder", error);
        setStatus("Unable to load deck builder data.");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [deckId, userId]);

  const cardsById = useMemo(() => toCardMap(cards), [cards]);

  const heroes = useMemo(
    () =>
      cards
        .filter(
          (card) =>
            isHeroCard(card) && isHeroAllowedForFormat(card, deck.format),
        )
        .sort(byName),
    [cards, deck.format],
  );

  const heroCard = deck.heroCardId
    ? (cardsById.get(deck.heroCardId) ?? null)
    : null;

  const legalCards = useMemo(() => {
    if (!heroCard) {
      return [] as Card[];
    }

    const search = cardSearch.trim().toLowerCase();

    return cards
      .filter((card) => isCardAllowedForDeck(card, heroCard, deck.format))
      .filter((card) =>
        search ? card.name.toLowerCase().includes(search) : true,
      )
      .sort(byName);
  }, [cards, heroCard, deck.format, cardSearch]);

  const equipmentAndWeapons = useMemo(
    () =>
      legalCards.filter(
        (card) => isEquipmentOrWeapon(card) || isTokenCard(card),
      ),
    [legalCards],
  );

  const mainDeckCards = useMemo(
    () =>
      legalCards.filter(
        (card) =>
          isMainDeckCard(card) &&
          !isEquipmentOrWeapon(card) &&
          !isTokenCard(card),
      ),
    [legalCards],
  );

  const deckValidation = useMemo(
    () =>
      validateDeck(
        {
          format: deck.format,
          heroCardId: deck.heroCardId,
          cards: deck.cards,
        },
        {
          cardsById,
          heroCard,
        },
      ),
    [deck, cardsById, heroCard],
  );

  const updateQuantity = (card: Card, nextQuantity: number) => {
    setDeck((current) => {
      const currentUniqueCopies = getUniqueCopies(
        current.cards,
        cardsById,
        card,
      );
      const currentCardQty = countForCard(current.cards, card.id);
      const maxCopies = getCopyLimitForCard(card, current.format);

      if (Number.isFinite(maxCopies)) {
        const nextUniqueTotal =
          currentUniqueCopies - currentCardQty + nextQuantity;
        if (nextUniqueTotal > maxCopies) {
          return current;
        }
      }

      return {
        ...current,
        cards: withQuantity(current.cards, card.id, nextQuantity),
      };
    });
  };

  const handleSave = async () => {
    if (!deck.name.trim()) {
      setStatus("Deck name is required.");
      return;
    }

    if (!deck.heroCardId) {
      setStatus("Choose a hero.");
      return;
    }

    if (!deckValidation.isValid) {
      setStatus("Resolve deck validation errors before saving.");
      return;
    }

    setIsSaving(true);
    setStatus(null);

    try {
      if (!userId) {
        saveGuestDeck({
          ...deck,
          id: deck.id || `guest-${crypto.randomUUID()}`,
        });
        setStatus("Deck saved in browser storage for 24 hours.");
        router.replace("/decks");
        return;
      }

      const method = deckId ? "PUT" : "POST";
      const response = await fetch("/api/decks", {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify(deck),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? "Failed to save deck.");
      }

      router.replace("/decks");
    } catch (error) {
      console.error("Failed to save deck", error);
      setStatus(
        error instanceof Error ? error.message : "Failed to save deck.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <p className="empty-state">Loading deck builder...</p>;
  }

  return (
    <section className="cards-section">
      <div className="section-header">
        <h2>{deckId ? "Edit Deck" : "Create Deck"}</h2>
      </div>

      <div className="deck-builder-layout">
        <div className="deck-builder-panel">
          <p className="field-row">
            <label htmlFor="deck-name">Deck Name</label>
            <input
              id="deck-name"
              value={deck.name}
              onChange={(event) =>
                setDeck((current) => ({ ...current, name: event.target.value }))
              }
            />
          </p>

          <p className="field-row">
            <label htmlFor="deck-format">Format</label>
            <select
              id="deck-format"
              value={deck.format}
              onChange={(event) =>
                setDeck((current) => ({
                  ...current,
                  format: event.target.value as DeckFormat,
                  heroCardId: "",
                  cards: [],
                }))
              }
            >
              <option value="silver-age">Silver Age</option>
              <option value="classic-constructed">Classic Constructed</option>
            </select>
          </p>

          <p className="field-row">
            <label htmlFor="deck-hero">Hero</label>
            <select
              id="deck-hero"
              value={deck.heroCardId}
              onChange={(event) =>
                setDeck((current) => ({
                  ...current,
                  heroCardId: event.target.value,
                  cards: [],
                }))
              }
            >
              <option value="">Select a hero</option>
              {heroes.map((hero) => (
                <option key={hero.id} value={hero.id}>
                  {hero.name}
                </option>
              ))}
            </select>
          </p>

          {userId ? (
            <p className="field-row">
              <label htmlFor="deck-visibility">Visibility</label>
              <select
                id="deck-visibility"
                value={deck.visibility}
                onChange={(event) =>
                  setDeck((current) => ({
                    ...current,
                    visibility: event.target.value as DeckVisibility,
                  }))
                }
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
            </p>
          ) : (
            <p className="form-message">
              Guest mode: deck is stored in your browser for 24 hours.
            </p>
          )}

          <p className="field-row">
            <label htmlFor="card-search">Search Legal Cards</label>
            <input
              id="card-search"
              value={cardSearch}
              onChange={(event) => setCardSearch(event.target.value)}
              placeholder="Search by card name"
            />
          </p>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Deck"}
          </button>

          {status ? <p className="form-message">{status}</p> : null}

          <div className="deck-validation">
            <p>
              Inventory: {deckValidation.counts.inventory} | Main Deck:{" "}
              {deckValidation.counts.mainDeck}
            </p>
            {deckValidation.errors.map((error) => (
              <p key={error} className="deck-validation-error">
                {error}
              </p>
            ))}
            {deckValidation.warnings.map((warning) => (
              <p key={warning} className="deck-validation-warning">
                {warning}
              </p>
            ))}
          </div>
        </div>

        <div className="deck-builder-panel">
          <h3>Legal Equipment / Weapons / Tokens</h3>
          <ul className="deck-card-list">
            {equipmentAndWeapons.map((card) => {
              const qty = countForCard(deck.cards, card.id);
              return (
                <li key={card.id} className="deck-card-list-item">
                  <div>
                    <strong>{card.name}</strong>
                    <p>{card.types.join(", ")}</p>
                  </div>
                  <div className="deck-qty-controls">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => updateQuantity(card, Math.max(0, qty - 1))}
                    >
                      -
                    </button>
                    <span>{qty}</span>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => updateQuantity(card, qty + 1)}
                    >
                      +
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <h3>Main Deck Cards</h3>
          <ul className="deck-card-list">
            {mainDeckCards.map((card) => {
              const qty = countForCard(deck.cards, card.id);
              return (
                <li key={card.id} className="deck-card-list-item">
                  <div>
                    <strong>
                      {card.name}
                      {card.color ? ` (${card.color})` : ""}
                    </strong>
                    <p>
                      {card.types.join(", ")} | {card.rarity}
                    </p>
                  </div>
                  <div className="deck-qty-controls">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => updateQuantity(card, Math.max(0, qty - 1))}
                    >
                      -
                    </button>
                    <span>{qty}</span>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => updateQuantity(card, qty + 1)}
                    >
                      +
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
