"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getClientUserId } from "./auth-client";
import { clearGuestDecks, deleteGuestDeck, loadGuestDecks } from "./storage";
import type { DeckRecord, GuestDeckRecord } from "./types";

type SavedDeck = DeckRecord | GuestDeckRecord;

function isGuestDeck(deck: SavedDeck): deck is GuestDeckRecord {
  return "guestExpiresAt" in deck;
}

export default function DecksPageClient() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [dbDecks, setDbDecks] = useState<DeckRecord[]>([]);
  const [guestDecks, setGuestDecks] = useState<GuestDeckRecord[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const loadDecks = async (currentUserId: string | null) => {
    try {
      const response = await fetch("/api/decks", {
        headers: currentUserId ? { "x-user-id": currentUserId } : undefined,
        cache: "no-store",
      });

      const payload = (await response.json()) as
        | DeckRecord[]
        | { error?: string };
      if (!response.ok || !Array.isArray(payload)) {
        setDbDecks([]);
      } else {
        setDbDecks(payload);
      }
    } catch (error) {
      console.error("Failed to fetch decks", error);
      setDbDecks([]);
    }

    setGuestDecks(loadGuestDecks());
  };

  useEffect(() => {
    const currentUserId = getClientUserId();
    setUserId(currentUserId);
    void loadDecks(currentUserId);
  }, []);

  const migrateGuestDecks = async () => {
    if (!userId) {
      return;
    }

    const decks = loadGuestDecks();
    if (decks.length === 0) {
      setMessage("No guest decks to migrate.");
      return;
    }

    try {
      for (const deck of decks) {
        await fetch("/api/decks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
          },
          body: JSON.stringify(deck),
        });
      }

      clearGuestDecks();
      setGuestDecks([]);
      setMessage("Guest decks migrated to your account.");
      await loadDecks(userId);
    } catch (error) {
      console.error("Failed to migrate guest decks", error);
      setMessage("Unable to migrate guest decks.");
    }
  };

  const removeDeck = async (deck: SavedDeck) => {
    if (!window.confirm(`Delete deck "${deck.name}"?`)) {
      return;
    }

    if (isGuestDeck(deck) || !deck.ownerId) {
      deleteGuestDeck(deck.id);
      setGuestDecks(loadGuestDecks());
      return;
    }

    try {
      const response = await fetch(
        `/api/decks?id=${encodeURIComponent(deck.id)}`,
        {
          method: "DELETE",
          headers: userId ? { "x-user-id": userId } : undefined,
        },
      );

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      await loadDecks(userId);
    } catch (error) {
      console.error("Failed to delete deck", error);
      setMessage("Unable to delete deck.");
    }
  };

  const allDecks = useMemo(
    () => [...guestDecks, ...dbDecks],
    [guestDecks, dbDecks],
  );

  return (
    <section className="cards-section">
      <div className="section-header">
        <h2>Decks</h2>
        <Link href="/decks/add" className="btn btn-primary">
          Create Deck
        </Link>
      </div>

      {message ? <p className="form-message">{message}</p> : null}

      {userId && guestDecks.length > 0 ? (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={migrateGuestDecks}
        >
          Save Guest Decks To Account
        </button>
      ) : null}

      {allDecks.length === 0 ? (
        <p className="empty-state">No decks yet. Create your first deck.</p>
      ) : (
        <ul className="cards-grid">
          {allDecks.map((deck) => (
            <li key={deck.id} className="card-item">
              <h3>{deck.name}</h3>
              <p>
                Format:{" "}
                {deck.format === "silver-age"
                  ? "Silver Age"
                  : "Classic Constructed"}
              </p>
              <p>Visibility: {deck.visibility}</p>
              <div className="card-item-actions">
                <Link
                  href={`/decks/${deck.id}/edit`}
                  className="btn btn-secondary"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => void removeDeck(deck)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
