import { headers } from "next/headers";
import type { Card } from "../api/cards/types/card";

export type CardView = Partial<Card> & Pick<Card, "id" | "name">;

type CardQuery = {
  all?: boolean;
  page?: number;
  limit?: number;
  search?: string;
  name?: string;
  pitch?: string;
  cost?: string;
  color?: string;
  power?: string;
  defense?: string;
  intellect?: string;
  life?: string;
  types?: string;
  functionalSubtypes?: string | string[];
  nonFunctionalSubtypes?: string;
  talent?: string | string[];
  class?: string | string[];
  traits?: string;
  abilities?: string;
  imageUrl?: string;
  rarity?: string;
};

export type CardsPageData = {
  items: CardView[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

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

async function fetchCards(query: CardQuery = {}) {
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") ?? "http";

  if (!host) {
    return {
      items: [] as CardView[],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    };
  }

  try {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value == null) {
        continue;
      }

      const stringValue = String(value).trim();
      if (!stringValue) {
        continue;
      }

      searchParams.set(key, stringValue);
    }

    const querySuffix = searchParams.toString();
    const endpoint = `${protocol}://${host}/api/cards${
      querySuffix ? `?${querySuffix}` : ""
    }`;

    const response = await fetch(endpoint, {
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        items: [] as CardView[],
        total: 0,
        page: 1,
        limit: query.limit ?? 10,
        totalPages: 0,
      };
    }

    const payload = await response.json();

    if (Array.isArray(payload)) {
      return {
        items: payload as CardView[],
        total: payload.length,
        page: 1,
        limit: payload.length,
        totalPages: payload.length > 0 ? 1 : 0,
      };
    }

    return {
      items: (payload.items ?? []) as CardView[],
      total: Number(payload.total ?? 0),
      page: Number(payload.page ?? 1),
      limit: Number(payload.limit ?? query.limit ?? 10),
      totalPages: Number(payload.totalPages ?? 0),
    };
  } catch (error) {
    console.error("Cards fetch failed", error);
    return {
      items: [] as CardView[],
      total: 0,
      page: 1,
      limit: query.limit ?? 10,
      totalPages: 0,
    };
  }
}

export async function getCards(query: CardQuery = {}) {
  return fetchCards(query);
}

export async function getCardById(id: string) {
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") ?? "http";

  if (!host) {
    return null;
  }

  try {
    const response = await fetch(
      `${protocol}://${host}/api/cards?id=${encodeURIComponent(id)}`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as CardView;
  } catch (error) {
    console.error("Card fetch failed", error);
    return null;
  }
}

export async function getCardNavigation(id: string) {
  const allCards = await getCards({ all: true });
  const index = allCards.items.findIndex((card) => card.id === id);

  if (index === -1) {
    return {
      previousId: null as string | null,
      nextId: null as string | null,
    };
  }

  return {
    previousId: allCards.items[index - 1]?.id ?? null,
    nextId: allCards.items[index + 1]?.id ?? null,
  };
}
