import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCardsCollection } from "@/lib/mongodb";
import type { Card } from "./types/card";

type CardDocument = Card & {
  _id: ObjectId;
  id?: string;
};

export async function GET() {
  try {
    const cardsCollection = await getCardsCollection();
    const cards = await cardsCollection.find<CardDocument>({}).toArray();

    const normalizedCards = cards.map(({ _id, ...card }) => ({
      ...card,
      id: typeof card.id === "string" ? card.id : _id.toString(),
    }));

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

    return NextResponse.json(cardToInsert, { status: 201 });
  } catch (error) {
    console.error("Failed to create card in MongoDB", error);
    return NextResponse.json(
      { error: "Failed to create card" },
      { status: 500 },
    );
  }
}
