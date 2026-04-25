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

export async function GET() {
  try {
    const cardsCollection = await getCardsCollection();
    const cards = await cardsCollection.find<CardDocument>({}).toArray();

    const normalizedCards = cards.map((card) => normalizeCardForResponse(card));

    return NextResponse.json(normalizedCards);
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
