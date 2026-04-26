"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import type { Card } from "../api/cards/types/card";
import CardImage from "../card-image";
import {
  renderTokenizedInlineText,
  type InlineTokenMap,
} from "../tokenized-inline-text";
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

type BuilderStage = "format" | "hero" | "builder";

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

function getSearchableCardText(card: Card) {
  return [
    card.id,
    card.name,
    card.color,
    card.textBox,
    card.imageUrl,
    card.pitch,
    card.cost,
    card.power,
    card.defense,
    card.intellect,
    card.life,
    ...(card.types ?? []),
    ...(card.functionalSubtypes ?? []),
    ...(card.nonFunctionalSubtypes ?? []),
    ...(card.talent ?? []),
    ...(card.class ?? []),
    ...(card.traits ?? []),
    ...(card.abilities ?? []),
  ]
    .filter((value) => value != null)
    .map((value) => String(value).toLowerCase())
    .join(" ");
}

function getCardSubtitle(card: Card) {
  const parts = [
    card.color ? `Color: ${card.color}` : null,
    card.rarity ? `Rarity: ${card.rarity}` : null,
    card.types.length > 0 ? card.types.join(", ") : null,
  ].filter(Boolean);

  return parts.join(" | ");
}

function normalizeFieldValue(value: unknown) {
  if (Array.isArray(value)) {
    const values = value
      .map((entry) => String(entry ?? "").trim())
      .filter((entry) => entry.length > 0);
    return values.length > 0 ? values.join(", ") : "";
  }

  if (value == null) {
    return "";
  }

  return String(value).trim();
}

function formatModalFieldValue(label: string, value: unknown) {
  if (
    (label === "Talent" || label === "Class" || label === "Subtypes") &&
    Array.isArray(value)
  ) {
    const values = value
      .map((entry) => String(entry ?? "").trim())
      .filter(Boolean);

    return values.length > 0 ? values.join(" ") : "";
  }

  return normalizeFieldValue(value);
}

function shouldShowMainDeckStats(card: Card) {
  return card.types.some((type) => MAIN_DECK_TYPES.has(type));
}

function isWeaponCard(card: Card) {
  return card.types.some((type) => type.toLowerCase() === "weapon");
}

function isEquipmentCard(card: Card) {
  return card.types.some((type) => type.toLowerCase() === "equipment");
}

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

function filterBySearch(cards: Card[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return cards;
  }

  return cards.filter((card) =>
    getSearchableCardText(card).includes(normalized),
  );
}

function paginateCards(cards: Card[], requestedPage: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(cards.length / pageSize));
  const page = Math.min(Math.max(requestedPage, 1), totalPages);
  const start = (page - 1) * pageSize;
  return {
    page,
    totalPages,
    items: cards.slice(start, start + pageSize),
  };
}

export default function DeckBuilder({ deckId }: DeckBuilderProps) {
  const router = useRouter();
  const [userId] = useState<string | null>(() => getClientUserId());
  const [cards, setCards] = useState<Card[]>([]);
  const [deck, setDeck] = useState<EditableDeck>(INITIAL_DECK);
  const [stage, setStage] = useState<BuilderStage>("format");
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeckPane, setShowDeckPane] = useState(true);
  const [showLegalPane, setShowLegalPane] = useState(true);
  const [modalCard, setModalCard] = useState<Card | null>(null);
  const [legalWeaponsSearch, setLegalWeaponsSearch] = useState("");
  const [legalEquipmentSearch, setLegalEquipmentSearch] = useState("");
  const [legalMainDeckSearch, setLegalMainDeckSearch] = useState("");
  const [legalTokensSearch, setLegalTokensSearch] = useState("");
  const [legalWeaponsPage, setLegalWeaponsPage] = useState(1);
  const [legalEquipmentPage, setLegalEquipmentPage] = useState(1);
  const [legalMainDeckPage, setLegalMainDeckPage] = useState(1);
  const [legalTokensPage, setLegalTokensPage] = useState(1);

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
          setStage("format");
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
            setStage(dbDeck.heroCardId ? "builder" : "hero");
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
          setStage(guestDeck.heroCardId ? "builder" : "hero");
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

    return cards
      .filter((card) => isCardAllowedForDeck(card, heroCard, deck.format))
      .filter((card) => card.id !== heroCard.id)
      .sort(byName);
  }, [cards, heroCard, deck.format]);

  const selectedCards = useMemo(() => {
    return deck.cards
      .map((entry) => ({
        card: cardsById.get(entry.cardId),
        quantity: entry.quantity,
      }))
      .filter(
        (entry): entry is { card: Card; quantity: number } =>
          Boolean(entry.card) && entry.quantity > 0,
      )
      .sort((a, b) => byName(a.card, b.card));
  }, [deck.cards, cardsById]);

  const legalWeapons = useMemo(
    () => legalCards.filter((card) => isWeaponCard(card) && !isTokenCard(card)),
    [legalCards],
  );

  const legalEquipment = useMemo(
    () =>
      legalCards.filter(
        (card) =>
          isEquipmentCard(card) && !isWeaponCard(card) && !isTokenCard(card),
      ),
    [legalCards],
  );

  const legalMainDeckCards = useMemo(
    () =>
      legalCards.filter(
        (card) =>
          isMainDeckCard(card) &&
          !isWeaponCard(card) &&
          !isEquipmentCard(card) &&
          !isTokenCard(card),
      ),
    [legalCards],
  );

  const legalTokens = useMemo(
    () => legalCards.filter((card) => isTokenCard(card)),
    [legalCards],
  );

  const selectedEquipmentAndWeapons = useMemo(
    () => selectedCards.filter(({ card }) => isEquipmentOrWeapon(card)),
    [selectedCards],
  );

  const selectedMainDeck = useMemo(
    () =>
      selectedCards.filter(
        ({ card }) =>
          isMainDeckCard(card) &&
          !isEquipmentOrWeapon(card) &&
          !isTokenCard(card),
      ),
    [selectedCards],
  );

  const selectedTokens = useMemo(
    () => selectedCards.filter(({ card }) => isTokenCard(card)),
    [selectedCards],
  );

  const pagedWeapons = useMemo(
    () =>
      paginateCards(
        filterBySearch(legalWeapons, legalWeaponsSearch),
        legalWeaponsPage,
        4,
      ),
    [legalWeapons, legalWeaponsSearch, legalWeaponsPage],
  );

  const pagedEquipment = useMemo(
    () =>
      paginateCards(
        filterBySearch(legalEquipment, legalEquipmentSearch),
        legalEquipmentPage,
        4,
      ),
    [legalEquipment, legalEquipmentSearch, legalEquipmentPage],
  );

  const pagedMainDeck = useMemo(
    () =>
      paginateCards(
        filterBySearch(legalMainDeckCards, legalMainDeckSearch),
        legalMainDeckPage,
        12,
      ),
    [legalMainDeckCards, legalMainDeckSearch, legalMainDeckPage],
  );

  const pagedTokens = useMemo(
    () =>
      paginateCards(
        filterBySearch(legalTokens, legalTokensSearch),
        legalTokensPage,
        4,
      ),
    [legalTokens, legalTokensSearch, legalTokensPage],
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

  const canIncrement = (card: Card) => {
    if (isTokenCard(card)) {
      return true;
    }

    const maxCopies = getCopyLimitForCard(card, deck.format);
    if (!Number.isFinite(maxCopies)) {
      return true;
    }

    const currentUniqueCopies = getUniqueCopies(deck.cards, cardsById, card);
    return currentUniqueCopies < maxCopies;
  };

  const canDecrement = (card: Card) => countForCard(deck.cards, card.id) > 0;

  const openCardModal = (card: Card) => setModalCard(card);

  const closeCardModal = () => setModalCard(null);

  const goToFormatSelection = () => {
    setStage("format");
  };

  const goToHeroSelection = () => {
    if (!deck.format) {
      setStage("format");
      return;
    }
    setStage("hero");
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

      {stage === "format" ? (
        <div className="deck-format-chooser">
          <button
            type="button"
            className="deck-format-banner"
            onClick={() => {
              setDeck((current) => ({
                ...current,
                format: "silver-age",
                heroCardId: "",
                cards: [],
              }));
              setStage("hero");
            }}
          >
            <strong>Silver Age</strong>
            <span>
              Young / Pit-Fighter heroes, 2 copies, 55 inventory, 40 deck
            </span>
          </button>
          <button
            type="button"
            className="deck-format-banner"
            onClick={() => {
              setDeck((current) => ({
                ...current,
                format: "classic-constructed",
                heroCardId: "",
                cards: [],
              }));
              setStage("hero");
            }}
          >
            <strong>Classic Constructed</strong>
            <span>Adult heroes, 3 copies, 80 inventory, 60 deck</span>
          </button>
        </div>
      ) : null}

      {stage === "hero" ? (
        <div className="deck-hero-stage">
          <nav
            aria-label="Deck builder path"
            className="deck-builder-breadcrumbs"
          >
            <button
              type="button"
              className="deck-breadcrumb-button"
              onClick={goToFormatSelection}
            >
              Format
            </button>
            <span>/</span>
            <span>Hero</span>
          </nav>
          <h3>
            Select Hero (
            {deck.format === "silver-age"
              ? "Silver Age"
              : "Classic Constructed"}
            )
          </h3>
          <div className="deck-image-grid">
            {heroes.map((hero) => (
              <button
                key={hero.id}
                type="button"
                className="deck-image-card"
                onClick={() => {
                  setDeck((current) => ({
                    ...current,
                    heroCardId: hero.id,
                    cards: [],
                  }));
                  setLegalWeaponsSearch("");
                  setLegalEquipmentSearch("");
                  setLegalMainDeckSearch("");
                  setLegalTokensSearch("");
                  setLegalWeaponsPage(1);
                  setLegalEquipmentPage(1);
                  setLegalMainDeckPage(1);
                  setLegalTokensPage(1);
                  setStage("builder");
                  setStatus(null);
                }}
              >
                <div className="deck-image-card-media">
                  <CardImage
                    src={hero.imageUrl || "/file.svg"}
                    alt={hero.name}
                    width={180}
                    height={260}
                    className="deck-image"
                  />
                </div>
                <div className="deck-image-card-body">
                  <strong>{hero.name}</strong>
                  <span>{getCardSubtitle(hero)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {stage === "builder" && heroCard ? (
        <>
          <nav
            aria-label="Deck builder path"
            className="deck-builder-breadcrumbs"
          >
            <button
              type="button"
              className="deck-breadcrumb-button"
              onClick={goToFormatSelection}
            >
              Format
            </button>
            <span>/</span>
            <button
              type="button"
              className="deck-breadcrumb-button"
              onClick={goToHeroSelection}
            >
              Hero
            </button>
            <span>/</span>
            <span>Deck</span>
          </nav>

          <div
            className={`deck-builder-layout ${showDeckPane && showLegalPane ? "deck-builder-layout-split" : "deck-builder-layout-single"}`}
          >
            {showDeckPane ? (
              <div className="deck-builder-panel deck-builder-selected-pane">
                <div className="deck-pane-header">
                  <h3>Deck Cards</h3>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowLegalPane((current) => !current)}
                  >
                    {showLegalPane ? "Hide Legal Cards" : "Show Legal Cards"}
                  </button>
                </div>

                <p className="field-row">
                  <label htmlFor="deck-name">Deck Name</label>
                  <input
                    id="deck-name"
                    value={deck.name}
                    onChange={(event) =>
                      setDeck((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                  />
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

                <div className="deck-selected-sections">
                  <h4>Hero</h4>
                  <div className="deck-image-grid deck-image-grid-compact">
                    <div className="deck-image-card deck-image-card-static">
                      <button
                        type="button"
                        className="deck-image-card-media-button"
                        onClick={() => openCardModal(heroCard)}
                      >
                        <div className="deck-image-card-media">
                          <CardImage
                            src={heroCard.imageUrl || "/file.svg"}
                            alt={heroCard.name}
                            width={180}
                            height={260}
                            className="deck-image"
                          />
                        </div>
                      </button>
                      <div className="deck-image-card-body">
                        <strong>{heroCard.name} (Hero)</strong>
                        <span>{getCardSubtitle(heroCard)}</span>
                      </div>
                      <div className="deck-image-card-actions">
                        <span className="deck-qty-badge">Hero</span>
                      </div>
                    </div>
                  </div>

                  <h4>Equipment / Weapon</h4>
                  <div className="deck-image-grid deck-image-grid-compact">
                    {selectedEquipmentAndWeapons.length === 0 ? (
                      <p className="empty-state">
                        No equipment or weapons added.
                      </p>
                    ) : (
                      selectedEquipmentAndWeapons.map(({ card, quantity }) => {
                        const canAdd = canIncrement(card);
                        const canRemove = canDecrement(card);

                        return (
                          <div
                            key={`selected-eq-${card.id}`}
                            className="deck-image-card deck-image-card-static"
                          >
                            <button
                              type="button"
                              className="deck-image-card-media-button"
                              onClick={() => openCardModal(card)}
                            >
                              <div className="deck-image-card-media">
                                <CardImage
                                  src={card.imageUrl || "/file.svg"}
                                  alt={card.name}
                                  width={180}
                                  height={260}
                                  className="deck-image"
                                />
                              </div>
                            </button>
                            <div className="deck-image-card-body">
                              <strong>{card.name}</strong>
                              <span>{getCardSubtitle(card)}</span>
                            </div>
                            <div className="deck-image-card-actions">
                              <button
                                type="button"
                                className="btn btn-secondary deck-qty-btn"
                                onClick={() =>
                                  updateQuantity(
                                    card,
                                    Math.max(0, quantity - 1),
                                  )
                                }
                                disabled={!canRemove}
                                aria-disabled={!canRemove}
                                aria-label={`Decrease ${card.name}`}
                              >
                                -
                              </button>
                              <span className="deck-qty-value">{quantity}</span>
                              <button
                                type="button"
                                className="btn btn-secondary deck-qty-btn"
                                onClick={() =>
                                  updateQuantity(card, quantity + 1)
                                }
                                disabled={!canAdd}
                                aria-disabled={!canAdd}
                                aria-label={`Increase ${card.name}`}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <h4>Main Deck</h4>
                  <div className="deck-image-grid deck-image-grid-compact">
                    {selectedMainDeck.length === 0 ? (
                      <p className="empty-state">No main deck cards added.</p>
                    ) : (
                      selectedMainDeck.map(({ card, quantity }) => {
                        const canAdd = canIncrement(card);
                        const canRemove = canDecrement(card);

                        return (
                          <div
                            key={`selected-main-${card.id}`}
                            className="deck-image-card deck-image-card-static"
                          >
                            <button
                              type="button"
                              className="deck-image-card-media-button"
                              onClick={() => openCardModal(card)}
                            >
                              <div className="deck-image-card-media">
                                <CardImage
                                  src={card.imageUrl || "/file.svg"}
                                  alt={card.name}
                                  width={180}
                                  height={260}
                                  className="deck-image"
                                />
                              </div>
                            </button>
                            <div className="deck-image-card-body">
                              <strong>{card.name}</strong>
                              <span>{getCardSubtitle(card)}</span>
                            </div>
                            <div className="deck-image-card-actions">
                              <button
                                type="button"
                                className="btn btn-secondary deck-qty-btn"
                                onClick={() =>
                                  updateQuantity(
                                    card,
                                    Math.max(0, quantity - 1),
                                  )
                                }
                                disabled={!canRemove}
                                aria-disabled={!canRemove}
                                aria-label={`Decrease ${card.name}`}
                              >
                                -
                              </button>
                              <span className="deck-qty-value">{quantity}</span>
                              <button
                                type="button"
                                className="btn btn-secondary deck-qty-btn"
                                onClick={() =>
                                  updateQuantity(card, quantity + 1)
                                }
                                disabled={!canAdd}
                                aria-disabled={!canAdd}
                                aria-label={`Increase ${card.name}`}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <h4>Tokens</h4>
                  <div className="deck-image-grid deck-image-grid-compact">
                    {selectedTokens.length === 0 ? (
                      <p className="empty-state">No tokens added.</p>
                    ) : (
                      selectedTokens.map(({ card, quantity }) => {
                        const canAdd = canIncrement(card);
                        const canRemove = canDecrement(card);

                        return (
                          <div
                            key={`selected-token-${card.id}`}
                            className="deck-image-card deck-image-card-static"
                          >
                            <button
                              type="button"
                              className="deck-image-card-media-button"
                              onClick={() => openCardModal(card)}
                            >
                              <div className="deck-image-card-media">
                                <CardImage
                                  src={card.imageUrl || "/file.svg"}
                                  alt={card.name}
                                  width={180}
                                  height={260}
                                  className="deck-image"
                                />
                              </div>
                            </button>
                            <div className="deck-image-card-body">
                              <strong>{card.name}</strong>
                              <span>{getCardSubtitle(card)}</span>
                            </div>
                            <div className="deck-image-card-actions">
                              <button
                                type="button"
                                className="btn btn-secondary deck-qty-btn"
                                onClick={() =>
                                  updateQuantity(
                                    card,
                                    Math.max(0, quantity - 1),
                                  )
                                }
                                disabled={!canRemove}
                                aria-disabled={!canRemove}
                                aria-label={`Decrease ${card.name}`}
                              >
                                -
                              </button>
                              <span className="deck-qty-value">{quantity}</span>
                              <button
                                type="button"
                                className="btn btn-secondary deck-qty-btn"
                                onClick={() =>
                                  updateQuantity(card, quantity + 1)
                                }
                                disabled={!canAdd}
                                aria-disabled={!canAdd}
                                aria-label={`Increase ${card.name}`}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {showLegalPane ? (
              <div className="deck-builder-panel deck-builder-legal-pane">
                <div className="deck-pane-header">
                  <h3>Legal Cards</h3>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowDeckPane((current) => !current)}
                  >
                    {showDeckPane ? "Hide Deck Cards" : "Show Deck Cards"}
                  </button>
                </div>

                <div className="deck-legal-section">
                  <div className="deck-legal-section-header">
                    <h4>Weapons</h4>
                    <input
                      value={legalWeaponsSearch}
                      onChange={(event) => {
                        setLegalWeaponsSearch(event.target.value);
                        setLegalWeaponsPage(1);
                      }}
                      placeholder="Search weapons"
                    />
                  </div>
                  <div className="deck-image-grid deck-image-grid-legal-row">
                    {pagedWeapons.items.map((card) => {
                      const qty = countForCard(deck.cards, card.id);
                      const canAdd = canIncrement(card);
                      const canRemove = canDecrement(card);

                      return (
                        <div
                          key={`legal-weapon-${card.id}`}
                          className="deck-image-card deck-image-card-static"
                        >
                          <button
                            type="button"
                            className="deck-image-card-media-button"
                            onClick={() => openCardModal(card)}
                          >
                            <div className="deck-image-card-media">
                              <CardImage
                                src={card.imageUrl || "/file.svg"}
                                alt={card.name}
                                width={180}
                                height={260}
                                className="deck-image"
                              />
                            </div>
                          </button>
                          <div className="deck-image-card-body">
                            <strong>{card.name}</strong>
                            <span>{getCardSubtitle(card)}</span>
                          </div>
                          <div className="deck-image-card-actions">
                            <button
                              type="button"
                              className="btn btn-secondary deck-qty-btn"
                              onClick={() =>
                                updateQuantity(card, Math.max(0, qty - 1))
                              }
                              disabled={!canRemove}
                              aria-disabled={!canRemove}
                              aria-label={`Decrease ${card.name}`}
                            >
                              -
                            </button>
                            <span className="deck-qty-value">{qty}</span>
                            <button
                              type="button"
                              className="btn btn-secondary deck-qty-btn"
                              onClick={() => updateQuantity(card, qty + 1)}
                              disabled={!canAdd}
                              aria-disabled={!canAdd}
                              aria-label={`Increase ${card.name}`}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {pagedWeapons.items.length === 0 ? (
                      <p className="empty-state">No weapon cards found.</p>
                    ) : null}
                  </div>
                  <div className="deck-section-pagination">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() =>
                        setLegalWeaponsPage((page) => Math.max(1, page - 1))
                      }
                      disabled={pagedWeapons.page <= 1}
                    >
                      Prev
                    </button>
                    <span>
                      Page {pagedWeapons.page} / {pagedWeapons.totalPages}
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() =>
                        setLegalWeaponsPage((page) =>
                          Math.min(pagedWeapons.totalPages, page + 1),
                        )
                      }
                      disabled={pagedWeapons.page >= pagedWeapons.totalPages}
                    >
                      Next
                    </button>
                  </div>
                </div>

                <div className="deck-legal-section">
                  <div className="deck-legal-section-header">
                    <h4>Equipment</h4>
                    <input
                      value={legalEquipmentSearch}
                      onChange={(event) => {
                        setLegalEquipmentSearch(event.target.value);
                        setLegalEquipmentPage(1);
                      }}
                      placeholder="Search equipment"
                    />
                  </div>
                  <div className="deck-image-grid deck-image-grid-legal-row">
                    {pagedEquipment.items.map((card) => {
                      const qty = countForCard(deck.cards, card.id);
                      const canAdd = canIncrement(card);
                      const canRemove = canDecrement(card);

                      return (
                        <div
                          key={`legal-equipment-${card.id}`}
                          className="deck-image-card deck-image-card-static"
                        >
                          <button
                            type="button"
                            className="deck-image-card-media-button"
                            onClick={() => openCardModal(card)}
                          >
                            <div className="deck-image-card-media">
                              <CardImage
                                src={card.imageUrl || "/file.svg"}
                                alt={card.name}
                                width={180}
                                height={260}
                                className="deck-image"
                              />
                            </div>
                          </button>
                          <div className="deck-image-card-body">
                            <strong>{card.name}</strong>
                            <span>{getCardSubtitle(card)}</span>
                          </div>
                          <div className="deck-image-card-actions">
                            <button
                              type="button"
                              className="btn btn-secondary deck-qty-btn"
                              onClick={() =>
                                updateQuantity(card, Math.max(0, qty - 1))
                              }
                              disabled={!canRemove}
                              aria-disabled={!canRemove}
                              aria-label={`Decrease ${card.name}`}
                            >
                              -
                            </button>
                            <span className="deck-qty-value">{qty}</span>
                            <button
                              type="button"
                              className="btn btn-secondary deck-qty-btn"
                              onClick={() => updateQuantity(card, qty + 1)}
                              disabled={!canAdd}
                              aria-disabled={!canAdd}
                              aria-label={`Increase ${card.name}`}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {pagedEquipment.items.length === 0 ? (
                      <p className="empty-state">No equipment cards found.</p>
                    ) : null}
                  </div>
                  <div className="deck-section-pagination">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() =>
                        setLegalEquipmentPage((page) => Math.max(1, page - 1))
                      }
                      disabled={pagedEquipment.page <= 1}
                    >
                      Prev
                    </button>
                    <span>
                      Page {pagedEquipment.page} / {pagedEquipment.totalPages}
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() =>
                        setLegalEquipmentPage((page) =>
                          Math.min(pagedEquipment.totalPages, page + 1),
                        )
                      }
                      disabled={
                        pagedEquipment.page >= pagedEquipment.totalPages
                      }
                    >
                      Next
                    </button>
                  </div>
                </div>

                <div className="deck-legal-section">
                  <div className="deck-legal-section-header">
                    <h4>Main Deck</h4>
                    <input
                      value={legalMainDeckSearch}
                      onChange={(event) => {
                        setLegalMainDeckSearch(event.target.value);
                        setLegalMainDeckPage(1);
                      }}
                      placeholder="Search main deck cards"
                    />
                  </div>
                  <div className="deck-image-grid deck-image-grid-legal-main">
                    {pagedMainDeck.items.map((card) => {
                      const qty = countForCard(deck.cards, card.id);
                      const canAdd = canIncrement(card);
                      const canRemove = canDecrement(card);

                      return (
                        <div
                          key={`legal-main-${card.id}`}
                          className="deck-image-card deck-image-card-static"
                        >
                          <button
                            type="button"
                            className="deck-image-card-media-button"
                            onClick={() => openCardModal(card)}
                          >
                            <div className="deck-image-card-media">
                              <CardImage
                                src={card.imageUrl || "/file.svg"}
                                alt={card.name}
                                width={180}
                                height={260}
                                className="deck-image"
                              />
                            </div>
                          </button>
                          <div className="deck-image-card-body">
                            <strong>
                              {card.name}
                              {card.color ? ` (${card.color})` : ""}
                            </strong>
                            <span>{getCardSubtitle(card)}</span>
                          </div>
                          <div className="deck-image-card-actions">
                            <button
                              type="button"
                              className="btn btn-secondary deck-qty-btn"
                              onClick={() =>
                                updateQuantity(card, Math.max(0, qty - 1))
                              }
                              disabled={!canRemove}
                              aria-disabled={!canRemove}
                              aria-label={`Decrease ${card.name}`}
                            >
                              -
                            </button>
                            <span className="deck-qty-value">{qty}</span>
                            <button
                              type="button"
                              className="btn btn-secondary deck-qty-btn"
                              onClick={() => updateQuantity(card, qty + 1)}
                              disabled={!canAdd}
                              aria-disabled={!canAdd}
                              aria-label={`Increase ${card.name}`}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {pagedMainDeck.items.length === 0 ? (
                      <p className="empty-state">No main deck cards found.</p>
                    ) : null}
                  </div>
                  <div className="deck-section-pagination">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() =>
                        setLegalMainDeckPage((page) => Math.max(1, page - 1))
                      }
                      disabled={pagedMainDeck.page <= 1}
                    >
                      Prev
                    </button>
                    <span>
                      Page {pagedMainDeck.page} / {pagedMainDeck.totalPages}
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() =>
                        setLegalMainDeckPage((page) =>
                          Math.min(pagedMainDeck.totalPages, page + 1),
                        )
                      }
                      disabled={pagedMainDeck.page >= pagedMainDeck.totalPages}
                    >
                      Next
                    </button>
                  </div>
                </div>

                <div className="deck-legal-section">
                  <div className="deck-legal-section-header">
                    <h4>Tokens</h4>
                    <input
                      value={legalTokensSearch}
                      onChange={(event) => {
                        setLegalTokensSearch(event.target.value);
                        setLegalTokensPage(1);
                      }}
                      placeholder="Search tokens"
                    />
                  </div>
                  <div className="deck-image-grid deck-image-grid-legal-row">
                    {pagedTokens.items.map((card) => {
                      const qty = countForCard(deck.cards, card.id);
                      const canAdd = canIncrement(card);
                      const canRemove = canDecrement(card);

                      return (
                        <div
                          key={`legal-token-${card.id}`}
                          className="deck-image-card deck-image-card-static"
                        >
                          <button
                            type="button"
                            className="deck-image-card-media-button"
                            onClick={() => openCardModal(card)}
                          >
                            <div className="deck-image-card-media">
                              <CardImage
                                src={card.imageUrl || "/file.svg"}
                                alt={card.name}
                                width={180}
                                height={260}
                                className="deck-image"
                              />
                            </div>
                          </button>
                          <div className="deck-image-card-body">
                            <strong>{card.name}</strong>
                            <span>{getCardSubtitle(card)}</span>
                          </div>
                          <div className="deck-image-card-actions">
                            <button
                              type="button"
                              className="btn btn-secondary deck-qty-btn"
                              onClick={() =>
                                updateQuantity(card, Math.max(0, qty - 1))
                              }
                              disabled={!canRemove}
                              aria-disabled={!canRemove}
                              aria-label={`Decrease ${card.name}`}
                            >
                              -
                            </button>
                            <span className="deck-qty-value">{qty}</span>
                            <button
                              type="button"
                              className="btn btn-secondary deck-qty-btn"
                              onClick={() => updateQuantity(card, qty + 1)}
                              disabled={!canAdd}
                              aria-disabled={!canAdd}
                              aria-label={`Increase ${card.name}`}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {pagedTokens.items.length === 0 ? (
                      <p className="empty-state">No token cards found.</p>
                    ) : null}
                  </div>
                  <div className="deck-section-pagination">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() =>
                        setLegalTokensPage((page) => Math.max(1, page - 1))
                      }
                      disabled={pagedTokens.page <= 1}
                    >
                      Prev
                    </button>
                    <span>
                      Page {pagedTokens.page} / {pagedTokens.totalPages}
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() =>
                        setLegalTokensPage((page) =>
                          Math.min(pagedTokens.totalPages, page + 1),
                        )
                      }
                      disabled={pagedTokens.page >= pagedTokens.totalPages}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </>
      ) : null}

      {typeof document !== "undefined" && modalCard
        ? createPortal(
            <div className="deck-card-modal-backdrop" onClick={closeCardModal}>
              <div
                className="deck-card-modal"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={`${modalCard.name} details`}
              >
                <div className="deck-card-modal-header">
                  <h3>{modalCard.name}</h3>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeCardModal}
                  >
                    Close
                  </button>
                </div>
                <div className="deck-card-modal-content">
                  <div className="deck-card-modal-image-wrap">
                    <CardImage
                      src={modalCard.imageUrl || "/file.svg"}
                      alt={modalCard.name}
                      width={320}
                      height={480}
                    />
                  </div>
                  <div className="deck-card-modal-data">
                    {(() => {
                      const isMainDeckCard = shouldShowMainDeckStats(modalCard);
                      const shouldRenderNumericField = (
                        value: number | null | undefined,
                      ) => isMainDeckCard || (value ?? 0) > 0;
                      const mergedSubtypes = Array.from(
                        new Set([
                          ...(modalCard.functionalSubtypes ?? []),
                          ...(modalCard.nonFunctionalSubtypes ?? []),
                        ]),
                      );

                      return [
                        { label: "Rarity", value: modalCard.rarity },
                        ...(shouldRenderNumericField(modalCard.pitch)
                          ? [{ label: "Pitch", value: modalCard.pitch }]
                          : []),
                        ...(shouldRenderNumericField(modalCard.cost)
                          ? [{ label: "Cost", value: modalCard.cost }]
                          : []),
                        { label: "Color", value: modalCard.color },
                        ...(shouldRenderNumericField(modalCard.power)
                          ? [{ label: "Power", value: modalCard.power }]
                          : []),
                        ...(shouldRenderNumericField(modalCard.defense)
                          ? [{ label: "Defense", value: modalCard.defense }]
                          : []),
                        ...(shouldRenderNumericField(modalCard.intellect)
                          ? [{ label: "Intellect", value: modalCard.intellect }]
                          : []),
                        ...(shouldRenderNumericField(modalCard.life)
                          ? [{ label: "Life", value: modalCard.life }]
                          : []),
                        { label: "Types", value: modalCard.types },
                        { label: "Subtypes", value: mergedSubtypes },
                        { label: "Talent", value: modalCard.talent },
                        { label: "Class", value: modalCard.class },
                        { label: "Traits", value: modalCard.traits },
                        { label: "Text Box", value: modalCard.textBox },
                      ];
                    })().map((field) => {
                      const displayValue = formatModalFieldValue(
                        field.label,
                        field.value,
                      );
                      return displayValue ? (
                        <p key={field.label}>
                          {field.label}:{" "}
                          {renderTokenizedInlineText(
                            displayValue,
                            INLINE_TOKEN_MAP,
                          )}
                        </p>
                      ) : null;
                    })}

                    {modalCard.abilities.length > 0 ? (
                      <div className="deck-card-modal-abilities">
                        <p>Abilities:</p>
                        {modalCard.abilities.map((ability, index) => {
                          const displayAbility = normalizeFieldValue(ability);
                          if (!displayAbility) {
                            return null;
                          }

                          return (
                            <ReactMarkdown
                              key={`modal-ability-${index}`}
                              components={{
                                p: ({ children }) => (
                                  <span className="ability-markdown-line">
                                    {children}
                                  </span>
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
                              {toAbilityMarkdown(displayAbility)}
                            </ReactMarkdown>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}
