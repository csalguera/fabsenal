import Link from "next/link";
import CardImage from "../card-image";
import { getCards, normalizeFieldValue, type CardView } from "./_lib";
import CardGalleryActions from "./card-gallery-actions";
import CardsIndexControls from "@/app/cards/cards-index-controls";

type SearchParamValue = string | string[] | undefined;

type CardsPageProps = {
  searchParams?: Promise<Record<string, SearchParamValue>>;
};

const LIMIT_OPTIONS = [10, 20, 30, 40, 50] as const;

const FILTER_QUERY_KEYS = [
  "name",
  "pitch",
  "cost",
  "color",
  "power",
  "defense",
  "intellect",
  "life",
  "types",
  "functionalSubtypes",
  "nonFunctionalSubtypes",
  "talent",
  "class",
  "traits",
  "textBox",
  "abilities",
  "imageUrl",
] as const;

type FilterQueryKey = (typeof FILTER_QUERY_KEYS)[number];
type CardFilterValues = Record<FilterQueryKey, string>;

function getSingle(value: SearchParamValue) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
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

  const filters = FILTER_QUERY_KEYS.reduce((acc, key) => {
    acc[key] = getSingle(resolvedSearchParams[key]).trim();
    return acc;
  }, {} as CardFilterValues);

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
        <h2>Cards</h2>
        <Link href="/cards/add" className="btn btn-primary">
          Add a Card
        </Link>
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
            className="btn btn-secondary"
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
            className="btn btn-secondary"
            aria-disabled={cardsPage.page >= cardsPage.totalPages}
          >
            Next
          </Link>
        </nav>
      ) : null}
    </section>
  );
}
