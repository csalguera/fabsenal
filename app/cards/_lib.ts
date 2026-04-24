import { headers } from "next/headers";
import type { Card } from "../api/cards/types/card";

export type CardView = Partial<Card> & Pick<Card, "id" | "name">;

type FieldValue = string | number | string[] | null | undefined;

export function normalizeFieldValue(value: FieldValue): string | null {
  if (value == null) {
    return null;
  }

  if (Array.isArray(value)) {
    const normalizedValues = value
      .map((item) => normalizeFieldValue(item))
      .filter((item): item is string => item !== null);

    return normalizedValues.length > 0 ? normalizedValues.join(", ") : null;
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();
    if (!trimmedValue || trimmedValue.toLowerCase() === "none") {
      return null;
    }

    return trimmedValue;
  }

  return String(value);
}

async function fetchCards() {
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") ?? "http";

  if (!host) {
    return [] as CardView[];
  }

  try {
    const response = await fetch(`${protocol}://${host}/api/cards`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return [] as CardView[];
    }

    return (await response.json()) as CardView[];
  } catch (error) {
    console.error("Cards fetch failed", error);
    return [] as CardView[];
  }
}

export async function getCards() {
  return fetchCards();
}

export async function getCardById(id: string) {
  const cards = await fetchCards();
  return cards.find((card) => card.id === id) ?? null;
}
