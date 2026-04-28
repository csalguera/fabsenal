"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Copy, Eye } from "lucide-react";
import { useAuthSession } from "@/app/auth/session-provider";
import type { DeckRecord } from "./types";

function getUsername(email: string | null): string {
  if (!email) return "Unknown";
  return email.split("@")[0];
}

export default function DecksIndexClient() {
  const { user, idToken } = useAuthSession();
  const [decks, setDecks] = useState<DeckRecord[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDecks = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/decks?scope=public", {
        cache: "no-store",
      });

      const payload = (await response.json()) as
        | DeckRecord[]
        | { error?: string };
      if (!response.ok || !Array.isArray(payload)) {
        setDecks([]);
      } else {
        setDecks(payload);
      }
    } catch (error) {
      console.error("Failed to fetch decks", error);
      setDecks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadDecks();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const copyDeck = async (deck: DeckRecord) => {
    if (!idToken) {
      setMessage("Sign in to copy decks.");
      return;
    }

    try {
      const response = await fetch("/api/decks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ sourceDeckId: deck.id }),
      });

      if (!response.ok) {
        throw new Error("Copy failed");
      }

      setMessage(`Copied "${deck.name}" to your account.`);
    } catch (error) {
      console.error("Failed to copy deck", error);
      setMessage("Unable to copy deck.");
    }
  };

  return (
    <section className="cards-section">
      <div className="section-header">
        <h2 className="section-title">Public Decks</h2>
        {user && (
          <Link href="/decks/my-decks" className="btn btn-primary">
            My Decks
          </Link>
        )}
      </div>

      {message ? <p className="form-message">{message}</p> : null}

      {loading ? (
        <p className="empty-state">Loading decks...</p>
      ) : decks.length === 0 ? (
        <p className="empty-state">No public decks yet.</p>
      ) : (
        <ul className="cards-grid">
          {decks.map((deck) => (
            <li key={deck.id} className="card-item">
              <h3>{deck.name}</h3>
              <p>
                Format:{" "}
                {deck.format === "silver-age"
                  ? "Silver Age"
                  : "Classic Constructed"}
              </p>
              <p>By: {getUsername(deck.ownerEmail)}</p>
              <div className="card-item-actions">
                <Link
                  href={`/decks/${deck.id}/edit`}
                  className="btn btn-primary btn-icon"
                  aria-label="View deck"
                  title="View deck"
                >
                  <Eye aria-hidden="true" focusable="false" />
                </Link>
                <button
                  type="button"
                  className="btn btn-primary btn-icon"
                  onClick={() => void copyDeck(deck)}
                  disabled={!user}
                  aria-label="Copy deck"
                  title="Copy deck"
                >
                  <Copy aria-hidden="true" focusable="false" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
