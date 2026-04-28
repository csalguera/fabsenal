import Link from "next/link";
import CardImage from "../card-image";
import { getCards, normalizeFieldValue, type CardView } from "./_lib";
import CardGalleryActions from "./card-gallery-actions";
import CardsIndexControls from "@/app/cards/cards-index-controls";
import CardsAdminLink from "./cards-admin-link";

type SearchParamValue = string | string[] | undefined;

type CardsPageProps = {
  searchParams?: Promise<Record<string, SearchParamValue>>;
};

const LIMIT_OPTIONS = [10, 20, 30, 40, 50] as const;

const FILTER_QUERY_KEYS = [
  "pitch",
  "cost",
  "color",
  "power",
  "defense",
  "types",
  "functionalSubtypes",
  "nonFunctionalSubtypes",
  "talent",
  "class",
  "traits",
] as const;

const MULTI_FILTER_QUERY_KEYS = [
  "functionalSubtypes",
  "talent",
  "class",
] as const;

type FilterQueryKey = (typeof FILTER_QUERY_KEYS)[number];
type MultiFilterQueryKey = (typeof MULTI_FILTER_QUERY_KEYS)[number];
type SingleFilterQueryKey = Exclude<FilterQueryKey, MultiFilterQueryKey>;
type CardFilterValues = Record<SingleFilterQueryKey, string> &
  Record<MultiFilterQueryKey, string[]>;

function getSingle(value: SearchParamValue) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function getMulti(value: SearchParamValue) {
  const rawValues = Array.isArray(value) ? value : value ? [value] : [];

  return rawValues
    .flatMap((entry) => entry.split(","))
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeLimit(value: string) {
  const parsed = Number(value);
  if (LIMIT_OPTIONS.includes(parsed as (typeof LIMIT_OPTIONS)[number])) {
    return parsed;
  }

  return 10;
}

function normalizePage(value: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

export default async function CardsPage({ searchParams }: CardsPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};

  const search = getSingle(resolvedSearchParams.search).trim();
  const limit = normalizeLimit(getSingle(resolvedSearchParams.limit));
  const page = normalizePage(getSingle(resolvedSearchParams.page));

  const singleFilters = FILTER_QUERY_KEYS.filter(
    (key): key is SingleFilterQueryKey =>
      !MULTI_FILTER_QUERY_KEYS.includes(key as MultiFilterQueryKey),
  ).reduce(
    (acc, key) => {
      acc[key] = getSingle(resolvedSearchParams[key]).trim();
      return acc;
    },
    {} as Record<SingleFilterQueryKey, string>,
  );

  const multiFilters = MULTI_FILTER_QUERY_KEYS.reduce(
    (acc, key) => {
      acc[key] = getMulti(resolvedSearchParams[key]);
      return acc;
    },
    {} as Record<MultiFilterQueryKey, string[]>,
  );

  const filters: CardFilterValues = {
    ...singleFilters,
    ...multiFilters,
  };

  const cardsPage = await getCards({
    page,
    limit,
    search,
    ...filters,
  });

  const cards = cardsPage.items;
  const firstResultIndex =
    cardsPage.total === 0 ? 0 : (cardsPage.page - 1) * cardsPage.limit + 1;
  const lastResultIndex =
    cardsPage.total === 0 ? 0 : firstResultIndex + cards.length - 1;

  const sharedParams = new URLSearchParams();
  sharedParams.set("limit", String(cardsPage.limit));
  if (search) {
    sharedParams.set("search", search);
  }

  for (const key of FILTER_QUERY_KEYS) {
    const value = filters[key];
    if (Array.isArray(value)) {
      if (value.length > 0) {
        sharedParams.set(key, value.join(","));
      }
      continue;
    }

    if (value) {
      sharedParams.set(key, value);
    }
  }

  const createPageHref = (targetPage: number) => {
    const params = new URLSearchParams(sharedParams.toString());
    params.set("page", String(targetPage));
    return `/cards?${params.toString()}`;
  };

  return (
    <section className="cards-section">
      <div className="section-header">
        <h2 className="section-title">Cards</h2>
        <CardsAdminLink />
      </div>

      <CardsIndexControls
        initialSearch={search}
        initialLimit={cardsPage.limit}
        initialFilters={filters}
      />

      <p className="cards-results-count">
        Showing {firstResultIndex}-{lastResultIndex} of {cardsPage.total}
      </p>

      {cards.length === 0 ? (
        <p className="empty-state">
          No cards found yet. Add a card to get started.
        </p>
      ) : (
        <ul className="cards-grid">
          {cards.map((card: CardView) => {
            const imageSrc = normalizeFieldValue(card.imageUrl);

            return (
              <li key={card.id} className="card-item">
                <h3>{card.name}</h3>
                <p>Rarity: {card.rarity ?? "Common"}</p>
                <div className="card-image-shell">
                  {imageSrc ? (
                    <CardImage
                      src={imageSrc}
                      alt={card.name}
                      width={160}
                      height={240}
                      className="card-image"
                    />
                  ) : (
                    <span className="card-image-placeholder">No image</span>
                  )}
                </div>
                <CardGalleryActions id={card.id} />
              </li>
            );
          })}
        </ul>
      )}

      {cardsPage.totalPages > 1 ? (
        <nav className="cards-pagination" aria-label="Cards pagination">
          <Link
            href={createPageHref(Math.max(1, cardsPage.page - 1))}
            className="btn btn-primary"
            aria-disabled={cardsPage.page <= 1}
          >
            Previous
          </Link>
          <div className="cards-pagination-pages">
            {Array.from({ length: cardsPage.totalPages }, (_, index) => {
              const pageNumber = index + 1;
              const isActive = pageNumber === cardsPage.page;

              return (
                <Link
                  key={pageNumber}
                  href={createPageHref(pageNumber)}
                  className={`cards-pagination-link${isActive ? " cards-pagination-link-active" : ""}`}
                >
                  {pageNumber}
                </Link>
              );
            })}
          </div>
          <Link
            href={createPageHref(
              Math.min(cardsPage.totalPages, cardsPage.page + 1),
            )}
            className="btn btn-primary"
            aria-disabled={cardsPage.page >= cardsPage.totalPages}
          >
            Next
          </Link>
        </nav>
      ) : null}
    </section>
  );
}
