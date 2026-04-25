import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCardsCollection } from "@/lib/mongodb";
import type { Card } from "./types/card";
import { CARD_RARITY_OPTIONS } from "../../card-form-shared";
import type { CardRarity } from "./types/card";

type CardDocument = Card & {
  _id: ObjectId;
  id?: string;
};

type CardsResponseCard = Partial<Card> & Pick<Card, "id" | "name">;

const LIMIT_OPTIONS = [10, 20, 30, 40, 50] as const;

const COLOR_SORT_ORDER: Record<string, number> = {
  red: 0,
  yellow: 1,
  blue: 2,
};

function getNullableSingle(searchParams: URLSearchParams, key: string) {
  return normalizeString(searchParams.get(key));
}

function parseNumberFilter(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePage(value: string | null) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

function parseLimit(value: string | null) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    return 10;
  }

  if (LIMIT_OPTIONS.includes(parsed as (typeof LIMIT_OPTIONS)[number])) {
    return parsed;
  }

  return 10;
}

function includesIgnoreCase(
  value: string | null | undefined,
  needle: string | null,
) {
  if (!needle) {
    return true;
  }

  if (!value) {
    return false;
  }

  return value.toLowerCase().includes(needle.toLowerCase());
}

function hasArrayValue(
  values: string[] | null | undefined,
  needle: string | null,
) {
  if (!needle) {
    return true;
  }

  if (!values || values.length === 0) {
    return false;
  }

  return values.some((value) => value.toLowerCase() === needle.toLowerCase());
}

function normalizeString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "none") {
    return null;
  }

  return trimmed;
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value
    .map((item) => normalizeString(item))
    .filter((item): item is string => item !== null);
}

function normalizeCardShape(
  card: Partial<Card> & { id?: string },
  fallbackId: string,
) {
  const normalized: Record<string, unknown> = {
    id: typeof card.id === "string" ? card.id : fallbackId,
  };

  const normalizedName = normalizeString(card.name);
  normalized.name = normalizedName ?? "Unnamed Card";

  if (typeof card.pitch === "number") {
    normalized.pitch = card.pitch;
  }

  if (typeof card.cost === "number") {
    normalized.cost = card.cost;
  }

  const normalizedColor = normalizeString(card.color);
  if (normalizedColor) {
    normalized.color = normalizedColor;
  }

  if (typeof card.power === "number") {
    normalized.power = card.power;
  }

  if (typeof card.defense === "number") {
    normalized.defense = card.defense;
  }

  if (typeof card.intellect === "number") {
    normalized.intellect = card.intellect;
  }

  if (typeof card.life === "number") {
    normalized.life = card.life;
  }

  const normalizedTypes = normalizeStringArray(card.types);
  if (normalizedTypes.length > 0) {
    normalized.types = normalizedTypes;
  }

  const normalizedSubtypes = normalizeStringArray(card.subtypes);
  if (normalizedSubtypes.length > 0) {
    normalized.subtypes = normalizedSubtypes;
  }

  const normalizedTalent = normalizeStringArray(card.talent);
  if (normalizedTalent.length > 0) {
    normalized.talent = normalizedTalent;
  } else {
    normalized.talent = null;
  }

  const normalizedClass = normalizeStringArray(card.class);
  if (normalizedClass.length > 0) {
    normalized.class = normalizedClass;
    // If Generic is selected, clear talent
    if (normalizedClass.includes("Generic")) {
      normalized.talent = null;
    }
  } else {
    normalized.class = null;
  }

  const normalizedTraits = normalizeStringArray(card.traits);
  if (normalizedTraits.length > 0) {
    normalized.traits = normalizedTraits;
  }

  const normalizedTextBox = normalizeString(card.textBox);
  if (normalizedTextBox) {
    normalized.textBox = normalizedTextBox;
  }

  const normalizedAbilities = normalizeStringArray(card.abilities);
  if (normalizedAbilities.length > 0) {
    normalized.abilities = normalizedAbilities;
  }

  const normalizedImageUrl = normalizeString(card.imageUrl);
  if (normalizedImageUrl) {
    normalized.imageUrl = normalizedImageUrl;
  }

  const normalizedRarity = normalizeString(card.rarity);
  if (
    normalizedRarity &&
    CARD_RARITY_OPTIONS.includes(normalizedRarity as CardRarity)
  ) {
    normalized.rarity = normalizedRarity as CardRarity;
  } else {
    normalized.rarity = "Common";
  }

  return normalized;
}

function normalizeCardForResponse(document: CardDocument) {
  const { _id, ...card } = document;
  return normalizeCardShape(card, _id.toString());
}

export async function GET(request: Request) {
  try {
    const { searchParams: params } = new URL(request.url);
    const cardsCollection = await getCardsCollection();

    const id = getNullableSingle(params, "id");

    if (id) {
      const card = await cardsCollection.findOne<CardDocument>({ id });
      if (!card) {
        return NextResponse.json({ error: "Card not found." }, { status: 404 });
      }

      return NextResponse.json(normalizeCardForResponse(card));
    }

    const page = parsePage(params.get("page"));
    const limit = parseLimit(params.get("limit"));
    const search = getNullableSingle(params, "search");

    const filters = {
      name: getNullableSingle(params, "name"),
      pitch: parseNumberFilter(getNullableSingle(params, "pitch")),
      cost: parseNumberFilter(getNullableSingle(params, "cost")),
      color: getNullableSingle(params, "color"),
      power: parseNumberFilter(getNullableSingle(params, "power")),
      defense: parseNumberFilter(getNullableSingle(params, "defense")),
      intellect: parseNumberFilter(getNullableSingle(params, "intellect")),
      life: parseNumberFilter(getNullableSingle(params, "life")),
      types: getNullableSingle(params, "types"),
      subtypes: getNullableSingle(params, "subtypes"),
      talent: getNullableSingle(params, "talent"),
      class: getNullableSingle(params, "class"),
      traits: getNullableSingle(params, "traits"),
      textBox: getNullableSingle(params, "textBox"),
      abilities: getNullableSingle(params, "abilities"),
      imageUrl: getNullableSingle(params, "imageUrl"),
      rarity: getNullableSingle(params, "rarity"),
    };

    const cards = await cardsCollection.find<CardDocument>({}).toArray();
    const normalizedCards = cards.map(
      (card) => normalizeCardForResponse(card) as CardsResponseCard,
    );

    const filteredCards = normalizedCards
      .filter((card) => {
        if (search && !includesIgnoreCase(card.name, search)) {
          return false;
        }

        if (!includesIgnoreCase(card.name, filters.name)) {
          return false;
        }

        if (filters.pitch !== null && card.pitch !== filters.pitch) {
          return false;
        }

        if (filters.cost !== null && card.cost !== filters.cost) {
          return false;
        }

        if (
          filters.color &&
          String(card.color ?? "").toLowerCase() !== filters.color.toLowerCase()
        ) {
          return false;
        }

        if (filters.power !== null && card.power !== filters.power) {
          return false;
        }

        if (filters.defense !== null && card.defense !== filters.defense) {
          return false;
        }

        if (
          filters.intellect !== null &&
          card.intellect !== filters.intellect
        ) {
          return false;
        }

        if (filters.life !== null && card.life !== filters.life) {
          return false;
        }

        if (!hasArrayValue(card.types ?? null, filters.types)) {
          return false;
        }

        if (!hasArrayValue(card.subtypes ?? null, filters.subtypes)) {
          return false;
        }

        if (!hasArrayValue(card.talent ?? null, filters.talent)) {
          return false;
        }

        if (!hasArrayValue(card.class ?? null, filters.class)) {
          return false;
        }

        if (!hasArrayValue(card.traits ?? null, filters.traits)) {
          return false;
        }

        if (!includesIgnoreCase(card.textBox, filters.textBox)) {
          return false;
        }

        if (
          filters.abilities &&
          !card.abilities?.some((ability) =>
            ability.toLowerCase().includes(filters.abilities!.toLowerCase()),
          )
        ) {
          return false;
        }

        if (!includesIgnoreCase(card.imageUrl, filters.imageUrl)) {
          return false;
        }

        if (
          filters.rarity &&
          String(card.rarity ?? "").toLowerCase() !==
            filters.rarity.toLowerCase()
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const byName = a.name.localeCompare(b.name, undefined, {
          sensitivity: "base",
        });

        if (byName !== 0) {
          return byName;
        }

        const colorA = a.color ? (COLOR_SORT_ORDER[a.color] ?? 99) : 99;
        const colorB = b.color ? (COLOR_SORT_ORDER[b.color] ?? 99) : 99;
        return colorA - colorB;
      });

    const total = filteredCards.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    const safePage = totalPages === 0 ? 1 : Math.min(page, totalPages);
    const start = (safePage - 1) * limit;
    const items = filteredCards.slice(start, start + limit);

    return NextResponse.json({
      items,
      total,
      page: safePage,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error("Failed to fetch cards from MongoDB", error);
    return NextResponse.json(
      { error: "Failed to fetch cards" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const incomingCard: Card = await request.json();
    const cardsCollection = await getCardsCollection();

    const insertedId = incomingCard.id ?? new ObjectId().toString();
    const cardToInsert = {
      ...incomingCard,
      id: insertedId,
    };

    await cardsCollection.insertOne(cardToInsert);

    return NextResponse.json(normalizeCardShape(cardToInsert, insertedId), {
      status: 201,
    });
  } catch (error) {
    console.error("Failed to create card in MongoDB", error);
    return NextResponse.json(
      { error: "Failed to create card" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const payload = (await request.json()) as Partial<Card> & { id?: string };
    const id = payload.id;

    if (!id) {
      return NextResponse.json(
        { error: "Card id is required." },
        { status: 400 },
      );
    }

    const updateData = { ...payload };
    delete updateData.id;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "At least one field is required for update." },
        { status: 400 },
      );
    }

    const cardsCollection = await getCardsCollection();
    const result = await cardsCollection.updateOne(
      { id },
      { $set: updateData },
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Card not found." }, { status: 404 });
    }

    const updatedCard = await cardsCollection.findOne<CardDocument>({ id });

    if (!updatedCard) {
      return NextResponse.json({ error: "Card not found." }, { status: 404 });
    }

    return NextResponse.json(normalizeCardForResponse(updatedCard));
  } catch (error) {
    console.error("Failed to update card in MongoDB", error);
    return NextResponse.json(
      { error: "Failed to update card" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Card id is required." },
        { status: 400 },
      );
    }

    const cardsCollection = await getCardsCollection();
    const result = await cardsCollection.deleteOne({ id });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Card not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Failed to delete card from MongoDB", error);
    return NextResponse.json(
      { error: "Failed to delete card" },
      { status: 500 },
    );
  }
}
