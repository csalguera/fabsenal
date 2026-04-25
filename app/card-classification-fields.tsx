import type {
  CardSubtype,
  CardClass,
  CardTalent,
  CardType,
} from "./api/cards/types/card";
import {
  CARD_SUBTYPE_OPTIONS,
  CARD_CLASS_OPTIONS,
  CARD_TALENT_OPTIONS,
  CARD_TYPE_OPTIONS,
  getMultiSelectValues,
} from "./card-form-shared";

export type ClassificationState = {
  types: CardType[];
  subtypes: CardSubtype[];
  useNoSubtypes: boolean;
  talent: CardTalent[];
  useNoTalent: boolean;
  class: CardClass[];
};

type CardClassificationFieldsProps = {
  idPrefix: string;
  state: ClassificationState;
  onChange: (next: ClassificationState) => void;
};

function uniqueValues<T extends string>(values: T[]) {
  return Array.from(new Set(values));
}

function withValueAtIndex<T>(values: T[], index: number, nextValue: T) {
  return values.map((value, valueIndex) =>
    valueIndex === index ? nextValue : value,
  );
}

export default function CardClassificationFields({
  idPrefix,
  state,
  onChange,
}: CardClassificationFieldsProps) {
  return (
    <>
      <p className="field-row">
        <label htmlFor={`${idPrefix}-types`}>
          Types (hold Cmd/Ctrl to select multiple)
        </label>
        <select
          id={`${idPrefix}-types`}
          multiple
          value={state.types}
          onChange={(event) =>
            onChange({
              ...state,
              types: getMultiSelectValues(event) as CardType[],
            })
          }
          required
        >
          {CARD_TYPE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </p>

      <p className="field-row">
        <label htmlFor={`${idPrefix}-subtypes`}>
          Subtypes (multiple, includes None)
        </label>
        <select
          id={`${idPrefix}-subtypes`}
          multiple
          value={state.useNoSubtypes ? ["__NONE__"] : state.subtypes}
          onChange={(event) => {
            const values = getMultiSelectValues(event);
            const selectedNone = values.includes("__NONE__");
            onChange({
              ...state,
              useNoSubtypes: selectedNone,
              subtypes: selectedNone ? [] : (values as CardSubtype[]),
            });
          }}
        >
          <option value="__NONE__">None</option>
          {CARD_SUBTYPE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </p>

      <div className="field-row">
        <label>Talent (dynamic fields, includes None)</label>
        {state.class.includes("Generic") ? (
          <p className="form-message">
            Talent is disabled when Generic class is selected.
          </p>
        ) : null}
        {!state.useNoTalent
          ? state.talent.map((value, index) => (
              <div
                key={`${idPrefix}-talent-${index}`}
                className="dynamic-select-row"
              >
                <select
                  id={`${idPrefix}-talent-${index}`}
                  value={value}
                  onChange={(event) => {
                    const nextValues = withValueAtIndex(
                      state.talent,
                      index,
                      event.target.value as CardTalent,
                    );

                    onChange({
                      ...state,
                      useNoTalent: false,
                      talent: uniqueValues(nextValues),
                    });
                  }}
                  disabled={state.class.includes("Generic")}
                >
                  {CARD_TALENT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    const nextValues = state.talent.filter(
                      (_, valueIndex) => valueIndex !== index,
                    );

                    onChange({
                      ...state,
                      useNoTalent: nextValues.length === 0,
                      talent: nextValues,
                    });
                  }}
                  disabled={state.class.includes("Generic")}
                >
                  Remove
                </button>
              </div>
            ))
          : null}
        <div className="dynamic-select-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              const nextTalent = state.talent.length
                ? [...state.talent, CARD_TALENT_OPTIONS[0]]
                : [CARD_TALENT_OPTIONS[0]];

              onChange({
                ...state,
                useNoTalent: false,
                talent: uniqueValues(nextTalent),
              });
            }}
            disabled={state.class.includes("Generic")}
          >
            Add Talent
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() =>
              onChange({
                ...state,
                useNoTalent: true,
                talent: [],
              })
            }
          >
            None
          </button>
        </div>
      </div>

      <div className="field-row">
        <label>Class (dynamic fields, includes Generic)</label>
        {state.class.map((value, index) => (
          <div
            key={`${idPrefix}-class-${index}`}
            className="dynamic-select-row"
          >
            <select
              id={`${idPrefix}-class-${index}`}
              value={value}
              onChange={(event) => {
                const nextValues = withValueAtIndex(
                  state.class,
                  index,
                  event.target.value as CardClass,
                );
                const nextClass = uniqueValues(nextValues);
                const containsGeneric = nextClass.includes("Generic");

                onChange({
                  ...state,
                  class: nextClass,
                  useNoTalent: containsGeneric ? true : state.useNoTalent,
                  talent: containsGeneric ? [] : state.talent,
                });
              }}
            >
              {CARD_CLASS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                const nextClass = state.class.filter(
                  (_, valueIndex) => valueIndex !== index,
                );

                onChange({
                  ...state,
                  class: nextClass,
                });
              }}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() =>
            onChange({
              ...state,
              class: uniqueValues([
                ...state.class,
                CARD_CLASS_OPTIONS[state.class.includes("Generic") ? 1 : 0],
              ]),
            })
          }
        >
          Add Class
        </button>
      </div>
    </>
  );
}
