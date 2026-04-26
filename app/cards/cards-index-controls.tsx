"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CARD_CLASS_OPTIONS,
  CARD_FUNCTIONAL_SUBTYPE_OPTIONS,
  CARD_NON_FUNCTIONAL_SUBTYPE_OPTIONS,
  CARD_TALENT_OPTIONS,
  CARD_TRAIT_OPTIONS,
  CARD_TYPE_OPTIONS,
} from "../card-form-shared";

export type CardFilterValues = {
  name: string;
  pitch: string;
  cost: string;
  color: string;
  power: string;
  defense: string;
  intellect: string;
  life: string;
  types: string;
  functionalSubtypes: string;
  nonFunctionalSubtypes: string;
  talent: string;
  class: string;
  traits: string;
  textBox: string;
  abilities: string;
  imageUrl: string;
};

type CardsIndexControlsProps = {
  initialSearch: string;
  initialLimit: number;
  initialFilters: CardFilterValues;
};

const LIMIT_OPTIONS = [10, 20, 30, 40, 50] as const;

const EMPTY_FILTERS: CardFilterValues = {
  name: "",
  pitch: "",
  cost: "",
  color: "",
  power: "",
  defense: "",
  intellect: "",
  life: "",
  types: "",
  functionalSubtypes: "",
  nonFunctionalSubtypes: "",
  talent: "",
  class: "",
  traits: "",
  textBox: "",
  abilities: "",
  imageUrl: "",
};

export default function CardsIndexControls({
  initialSearch,
  initialLimit,
  initialFilters,
}: CardsIndexControlsProps) {
  const router = useRouter();
  const filterDialogRef = useRef<HTMLDialogElement | null>(null);

  const [search, setSearch] = useState(initialSearch);
  const [limit, setLimit] = useState(String(initialLimit));
  const [filters, setFilters] = useState<CardFilterValues>(initialFilters);

  const activeFilterCount = useMemo(
    () =>
      Object.values(filters).filter((value) => value.trim().length > 0).length,
    [filters],
  );

  const applyQuery = () => {
    const params = new URLSearchParams();

    params.set("page", "1");
    params.set("limit", limit);

    if (search.trim()) {
      params.set("search", search.trim());
    }

    for (const [key, value] of Object.entries(filters)) {
      const trimmed = value.trim();
      if (trimmed) {
        params.set(key, trimmed);
      }
    }

    router.push(`/cards?${params.toString()}`);
  };

  const resetAll = () => {
    const nextLimit = "10";
    setSearch("");
    setLimit(nextLimit);
    setFilters(EMPTY_FILTERS);
    router.push(`/cards?page=1&limit=${nextLimit}`);
  };

  const setFilterValue = (key: keyof CardFilterValues, value: string) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  return (
    <div className="cards-toolbar">
      <form
        className="cards-toolbar-row"
        onSubmit={(event) => {
          event.preventDefault();
          applyQuery();
        }}
      >
        <label className="cards-toolbar-field" htmlFor="cards-search">
          Search Cards
          <input
            id="cards-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search any card field"
          />
        </label>

        <label
          className="cards-toolbar-field cards-toolbar-limit"
          htmlFor="cards-limit"
        >
          Per Page
          <select
            id="cards-limit"
            value={limit}
            onChange={(event) => setLimit(event.target.value)}
          >
            {LIMIT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div className="cards-toolbar-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => filterDialogRef.current?.showModal()}
          >
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </button>
          <button type="submit" className="btn btn-primary">
            Apply
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={resetAll}
          >
            Reset
          </button>
        </div>
      </form>

      <dialog className="filters-dialog" ref={filterDialogRef}>
        <form
          method="dialog"
          className="filters-dialog-body"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <div className="filters-dialog-header">
            <h3>Card Filters</h3>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => filterDialogRef.current?.close()}
            >
              Close
            </button>
          </div>

          <div className="filters-grid">
            <label className="cards-toolbar-field" htmlFor="filter-name">
              Name
              <input
                id="filter-name"
                value={filters.name}
                onChange={(event) => setFilterValue("name", event.target.value)}
              />
            </label>

            <label className="cards-toolbar-field" htmlFor="filter-pitch">
              Pitch
              <select
                id="filter-pitch"
                value={filters.pitch}
                onChange={(event) =>
                  setFilterValue("pitch", event.target.value)
                }
              >
                <option value="">Any</option>
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </label>

            <label className="cards-toolbar-field" htmlFor="filter-cost">
              Cost
              <input
                id="filter-cost"
                type="number"
                value={filters.cost}
                onChange={(event) => setFilterValue("cost", event.target.value)}
              />
            </label>

            <label className="cards-toolbar-field" htmlFor="filter-color">
              Color
              <select
                id="filter-color"
                value={filters.color}
                onChange={(event) =>
                  setFilterValue("color", event.target.value)
                }
              >
                <option value="">Any</option>
                <option value="red">Red</option>
                <option value="yellow">Yellow</option>
                <option value="blue">Blue</option>
              </select>
            </label>

            <label className="cards-toolbar-field" htmlFor="filter-power">
              Power
              <input
                id="filter-power"
                type="number"
                value={filters.power}
                onChange={(event) =>
                  setFilterValue("power", event.target.value)
                }
              />
            </label>

            <label className="cards-toolbar-field" htmlFor="filter-defense">
              Defense
              <input
                id="filter-defense"
                type="number"
                value={filters.defense}
                onChange={(event) =>
                  setFilterValue("defense", event.target.value)
                }
              />
            </label>

            <label className="cards-toolbar-field" htmlFor="filter-intellect">
              Intellect
              <input
                id="filter-intellect"
                type="number"
                value={filters.intellect}
                onChange={(event) =>
                  setFilterValue("intellect", event.target.value)
                }
              />
            </label>

            <label className="cards-toolbar-field" htmlFor="filter-life">
              Life
              <input
                id="filter-life"
                type="number"
                value={filters.life}
                onChange={(event) => setFilterValue("life", event.target.value)}
              />
            </label>

            <label className="cards-toolbar-field" htmlFor="filter-types">
              Types
              <select
                id="filter-types"
                value={filters.types}
                onChange={(event) =>
                  setFilterValue("types", event.target.value)
                }
              >
                <option value="">Any</option>
                {CARD_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label
              className="cards-toolbar-field"
              htmlFor="filter-functional-subtypes"
            >
              Functional Subtypes
              <select
                id="filter-functional-subtypes"
                value={filters.functionalSubtypes}
                onChange={(event) =>
                  setFilterValue("functionalSubtypes", event.target.value)
                }
              >
                <option value="">Any</option>
                {CARD_FUNCTIONAL_SUBTYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label
              className="cards-toolbar-field"
              htmlFor="filter-non-functional-subtypes"
            >
              Non-Functional Subtypes
              <select
                id="filter-non-functional-subtypes"
                value={filters.nonFunctionalSubtypes}
                onChange={(event) =>
                  setFilterValue("nonFunctionalSubtypes", event.target.value)
                }
              >
                <option value="">Any</option>
                {CARD_NON_FUNCTIONAL_SUBTYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="cards-toolbar-field" htmlFor="filter-talent">
              Talent
              <select
                id="filter-talent"
                value={filters.talent}
                onChange={(event) =>
                  setFilterValue("talent", event.target.value)
                }
              >
                <option value="">Any</option>
                {CARD_TALENT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="cards-toolbar-field" htmlFor="filter-class">
              Class
              <select
                id="filter-class"
                value={filters.class}
                onChange={(event) =>
                  setFilterValue("class", event.target.value)
                }
              >
                <option value="">Any</option>
                {CARD_CLASS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="cards-toolbar-field" htmlFor="filter-traits">
              Traits
              <select
                id="filter-traits"
                value={filters.traits}
                onChange={(event) =>
                  setFilterValue("traits", event.target.value)
                }
              >
                <option value="">Any</option>
                {CARD_TRAIT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="cards-toolbar-field" htmlFor="filter-text-box">
              Text Box
              <input
                id="filter-text-box"
                value={filters.textBox}
                onChange={(event) =>
                  setFilterValue("textBox", event.target.value)
                }
              />
            </label>

            <label className="cards-toolbar-field" htmlFor="filter-abilities">
              Abilities
              <input
                id="filter-abilities"
                value={filters.abilities}
                onChange={(event) =>
                  setFilterValue("abilities", event.target.value)
                }
              />
            </label>

            <label className="cards-toolbar-field" htmlFor="filter-image-url">
              Image Url
              <input
                id="filter-image-url"
                value={filters.imageUrl}
                onChange={(event) =>
                  setFilterValue("imageUrl", event.target.value)
                }
              />
            </label>

          </div>

          <div className="filters-dialog-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setFilters(EMPTY_FILTERS)}
            >
              Clear Filters
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                filterDialogRef.current?.close();
                applyQuery();
              }}
            >
              Apply Filters
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
