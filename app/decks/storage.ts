"use client";

import type { DeckRecord, GuestDeckRecord } from "./types";

const STORAGE_KEY = "fabsenal_guest_decks_v1";
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

function nowIso() {
  return new Date().toISOString();
}

function getExpiryIso() {
  return new Date(Date.now() + TWENTY_FOUR_HOURS_MS).toISOString();
}

function parseStoredDecks(raw: string | null): GuestDeckRecord[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as GuestDeckRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function loadGuestDecks() {
  if (typeof window === "undefined") {
    return [] as GuestDeckRecord[];
  }

  const allDecks = parseStoredDecks(window.localStorage.getItem(STORAGE_KEY));
  const now = Date.now();

  const activeDecks = allDecks.filter((deck) => {
    const expiresAt = Date.parse(deck.guestExpiresAt);
    return Number.isFinite(expiresAt) && expiresAt > now;
  });

  if (activeDecks.length !== allDecks.length) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(activeDecks));
  }

  return activeDecks;
}

export function saveGuestDeck(
  input: Omit<DeckRecord, "ownerId" | "createdAt" | "updatedAt">,
) {
  if (typeof window === "undefined") {
    return;
  }

  const existing = loadGuestDecks();
  const now = nowIso();

  const nextDeck: GuestDeckRecord = {
    ...input,
    ownerId: null,
    createdAt: existing.find((deck) => deck.id === input.id)?.createdAt ?? now,
    updatedAt: now,
    guestExpiresAt: getExpiryIso(),
  };

  const withoutCurrent = existing.filter((deck) => deck.id !== input.id);
  const next = [nextDeck, ...withoutCurrent];

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function deleteGuestDeck(id: string) {
  if (typeof window === "undefined") {
    return;
  }

  const existing = loadGuestDecks();
  const next = existing.filter((deck) => deck.id !== id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function getGuestDeckById(id: string) {
  return loadGuestDecks().find((deck) => deck.id === id) ?? null;
}

export function clearGuestDecks() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}
