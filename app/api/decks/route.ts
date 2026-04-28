import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDecksCollection } from "@/lib/mongodb";
import { getAuthUserFromRequest } from "@/lib/firebase-server-auth";
import type {
  DeckCardEntry,
  DeckFormat,
  DeckRecord,
  DeckVisibility,
} from "@/app/decks/types";

type DeckDocument = DeckRecord & {
  _id: ObjectId;
};

type DeckMutationPayload = Partial<DeckRecord> & {
  sourceDeckId?: string;
};

function normalizeDeckForResponse(deck: DeckDocument) {
  const { _id, ...rest } = deck;
  void _id;
  return rest;
}

function normalizeDeckCardEntries(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as DeckCardEntry[];
  }

  return value
    .map((entry) => {
      if (
        !entry ||
        typeof entry !== "object" ||
        typeof (entry as { cardId?: unknown }).cardId !== "string"
      ) {
        return null;
      }

      const quantity = Number((entry as { quantity?: unknown }).quantity ?? 0);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        return null;
      }

      return {
        cardId: (entry as { cardId: string }).cardId,
        quantity: Math.floor(quantity),
      } satisfies DeckCardEntry;
    })
    .filter((entry): entry is DeckCardEntry => !!entry);
}

function normalizeFormat(value: unknown): DeckFormat {
  return value === "silver-age" ? "silver-age" : "classic-constructed";
}

function normalizeVisibility(value: unknown): DeckVisibility {
  return value === "public" ? "public" : "private";
}

function normalizeDeck(
  payload: Partial<DeckRecord>,
  ownerId: string,
  ownerEmail: string | null = null,
): DeckRecord {
  const now = new Date().toISOString();

  return {
    id: typeof payload.id === "string" ? payload.id : new ObjectId().toString(),
    name:
      typeof payload.name === "string" && payload.name.trim()
        ? payload.name.trim()
        : "Untitled Deck",
    format: normalizeFormat(payload.format),
    heroCardId:
      typeof payload.heroCardId === "string" ? payload.heroCardId : "",
    cards: normalizeDeckCardEntries(payload.cards),
    visibility: normalizeVisibility(payload.visibility),
    ownerId,
    ownerEmail,
    createdAt: typeof payload.createdAt === "string" ? payload.createdAt : now,
    updatedAt: now,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedId = searchParams.get("id");
    const authUser = await getAuthUserFromRequest(request);
    const userId = authUser?.uid ?? null;

    const decksCollection = await getDecksCollection();

    if (requestedId) {
      const deck = await decksCollection.findOne<DeckDocument>({
        id: requestedId,
      });
      if (!deck) {
        return NextResponse.json({ error: "Deck not found." }, { status: 404 });
      }

      const canAccess =
        deck.visibility === "public" || (userId && deck.ownerId === userId);
      if (!canAccess) {
        return NextResponse.json({ error: "Deck not found." }, { status: 404 });
      }

      return NextResponse.json(normalizeDeckForResponse(deck));
    }

    const query = userId
      ? { $or: [{ visibility: "public" }, { ownerId: userId }] }
      : { visibility: "public" };

    const decks = await decksCollection
      .find<DeckDocument>(query)
      .sort({ updatedAt: -1 })
      .toArray();

    return NextResponse.json(
      decks.map((deck) => normalizeDeckForResponse(deck)),
    );
  } catch (error) {
    console.error("Failed to fetch decks", error);
    return NextResponse.json(
      { error: "Failed to fetch decks" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUserFromRequest(request);

    if (!authUser) {
      return NextResponse.json(
        {
          error:
            "You must be logged in to persist decks. Guests can keep decks in browser storage for 24 hours.",
        },
        { status: 401 },
      );
    }

    const payload = (await request.json()) as DeckMutationPayload;
    const decksCollection = await getDecksCollection();

    if (payload.sourceDeckId) {
      const sourceDeck = await decksCollection.findOne<DeckDocument>({
        id: payload.sourceDeckId,
      });

      if (!sourceDeck) {
        return NextResponse.json({ error: "Deck not found." }, { status: 404 });
      }

      const canAccessSource =
        sourceDeck.visibility === "public" ||
        sourceDeck.ownerId === authUser.uid;

      if (!canAccessSource) {
        return NextResponse.json({ error: "Deck not found." }, { status: 404 });
      }

      const copiedDeck = normalizeDeck(
        {
          name: `Copy of ${sourceDeck.name}`,
          format: sourceDeck.format,
          heroCardId: sourceDeck.heroCardId,
          cards: sourceDeck.cards,
          visibility: "private",
        },
        authUser.uid,
        authUser.email,
      );

      await decksCollection.insertOne(copiedDeck);

      return NextResponse.json(copiedDeck, { status: 201 });
    }

    const deck = normalizeDeck(payload, authUser.uid, authUser.email);
    await decksCollection.insertOne(deck);

    return NextResponse.json(deck, { status: 201 });
  } catch (error) {
    console.error("Failed to create deck", error);
    return NextResponse.json(
      { error: "Failed to create deck" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const authUser = await getAuthUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const payload = (await request.json()) as Partial<DeckRecord>;
    if (!payload.id) {
      return NextResponse.json(
        { error: "Deck id is required." },
        { status: 400 },
      );
    }

    const decksCollection = await getDecksCollection();
    const existingDeck = await decksCollection.findOne<DeckDocument>({
      id: payload.id,
    });

    if (!existingDeck) {
      return NextResponse.json({ error: "Deck not found." }, { status: 404 });
    }

    if (existingDeck.ownerId !== authUser.uid) {
      return NextResponse.json(
        { error: "You can only edit your own decks." },
        { status: 403 },
      );
    }

    const nextDeck = normalizeDeck(
      { ...existingDeck, ...payload },
      authUser.uid,
      authUser.email,
    );

    await decksCollection.updateOne({ id: payload.id }, { $set: nextDeck });

    return NextResponse.json(nextDeck);
  } catch (error) {
    console.error("Failed to update deck", error);
    return NextResponse.json(
      { error: "Failed to update deck" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const authUser = await getAuthUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Deck id is required." },
        { status: 400 },
      );
    }

    const decksCollection = await getDecksCollection();
    const existingDeck = await decksCollection.findOne<DeckDocument>({ id });

    if (!existingDeck) {
      return NextResponse.json({ error: "Deck not found." }, { status: 404 });
    }

    if (existingDeck.ownerId !== authUser.uid) {
      return NextResponse.json(
        { error: "You can only delete your own decks." },
        { status: 403 },
      );
    }

    await decksCollection.deleteOne({ id });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Failed to delete deck", error);
    return NextResponse.json(
      { error: "Failed to delete deck" },
      { status: 500 },
    );
  }
}
