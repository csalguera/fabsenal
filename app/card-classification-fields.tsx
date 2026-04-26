import type {
  CardFunctionalSubtype,
  CardNonFunctionalSubtype,
  CardClass,
  CardTalent,
  CardType,
} from "./api/cards/types/card";
import {
  CARD_FUNCTIONAL_SUBTYPE_OPTIONS,
  CARD_NON_FUNCTIONAL_SUBTYPE_OPTIONS,
  CARD_CLASS_OPTIONS,
  CARD_TALENT_OPTIONS,
  CARD_TYPE_OPTIONS,
} from "./card-form-shared";

export type ClassificationState = {
  types: CardType[];
  functionalSubtypes: CardFunctionalSubtype[];
  useNoFunctionalSubtypes: boolean;
  nonFunctionalSubtypes: CardNonFunctionalSubtype[];
  useNoNonFunctionalSubtypes: boolean;
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
  const selectedType = state.types[0] ?? CARD_TYPE_OPTIONS[0];
  const selectedNonFunctionalSubtype = state.useNoNonFunctionalSubtypes
    ? "__NONE__"
    : (state.nonFunctionalSubtypes[0] ?? "__NONE__");

  const hasNonGenericClassSelected = state.class.some(
    (selectedClass) => selectedClass !== "Generic",
  );

  const isGenericClassOnly =
    state.class.includes("Generic") && !hasNonGenericClassSelected;

  return (
    <>
      <p className="field-row">
        <label htmlFor={`${idPrefix}-types`}>Type</label>
        <select
          id={`${idPrefix}-types`}
          value={selectedType}
          onChange={(event) =>
            onChange({
              ...state,
              types: [event.target.value as CardType],
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

      <div className="field-row">
        <label>Functional Subtypes (dynamic fields)</label>
        {!state.useNoFunctionalSubtypes
          ? state.functionalSubtypes.map((value, index) => (
              <div
                key={`${idPrefix}-functional-subtype-${index}`}
                className="dynamic-select-row"
              >
                <select
                  id={`${idPrefix}-functional-subtype-${index}`}
                  value={value}
                  onChange={(event) => {
                    const nextValues = withValueAtIndex(
                      state.functionalSubtypes,
                      index,
                      event.target.value as CardFunctionalSubtype,
                    );

                    onChange({
                      ...state,
                      useNoFunctionalSubtypes: false,
                      functionalSubtypes: uniqueValues(nextValues),
                    });
                  }}
                >
                  {CARD_FUNCTIONAL_SUBTYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    const nextValues = state.functionalSubtypes.filter(
                      (_, valueIndex) => valueIndex !== index,
                    );

                    onChange({
                      ...state,
                      useNoFunctionalSubtypes: nextValues.length === 0,
                      functionalSubtypes: nextValues,
                    });
                  }}
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
              const nextValues = state.functionalSubtypes.length
                ? [
                    ...state.functionalSubtypes,
                    CARD_FUNCTIONAL_SUBTYPE_OPTIONS[0],
                  ]
                : [CARD_FUNCTIONAL_SUBTYPE_OPTIONS[0]];

              onChange({
                ...state,
                useNoFunctionalSubtypes: false,
                functionalSubtypes: uniqueValues(nextValues),
              });
            }}
          >
            Add Functional Subtype
          </button>
        </div>
      </div>

      <p className="field-row">
        <label htmlFor={`${idPrefix}-non-functional-subtype`}>
          Non-Functional Subtype
        </label>
        <select
          id={`${idPrefix}-non-functional-subtype`}
          value={selectedNonFunctionalSubtype}
          onChange={(event) => {
            const selectedValue = event.target.value;
            const selectedNone = selectedValue === "__NONE__";

            onChange({
              ...state,
              useNoNonFunctionalSubtypes: selectedNone,
              nonFunctionalSubtypes: selectedNone
                ? []
                : [selectedValue as CardNonFunctionalSubtype],
            });
          }}
        >
          <option value="__NONE__">None</option>
          {CARD_NON_FUNCTIONAL_SUBTYPE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </p>

      <div className="field-row">
        <label>Talent (dynamic fields)</label>
        {isGenericClassOnly ? (
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
                  disabled={isGenericClassOnly}
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
                  disabled={isGenericClassOnly}
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
            disabled={isGenericClassOnly}
          >
            Add Talent
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
                const changedClass = event.target.value as CardClass;
                let nextClass = uniqueValues(nextValues);

                if (changedClass === "Generic") {
                  nextClass = ["Generic"];
                } else {
                  nextClass = nextClass.filter(
                    (className) => className !== "Generic",
                  );
                }

                const containsGeneric = nextClass.includes("Generic");

                onChange({
                  ...state,
                  class: nextClass,
                  useNoTalent: containsGeneric ? true : state.useNoTalent,
                  talent: containsGeneric ? [] : state.talent,
                });
              }}
            >
              {CARD_CLASS_OPTIONS.filter(
                (option) =>
                  option !== "Generic" ||
                  !hasNonGenericClassSelected ||
                  value === "Generic",
              ).map((option) => (
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
                  class: nextClass.length > 0 ? nextClass : ["Generic"],
                  useNoTalent: (nextClass.length === 0
                    ? ["Generic"]
                    : nextClass
                  ).includes("Generic")
                    ? true
                    : state.useNoTalent,
                  talent: (nextClass.length === 0
                    ? ["Generic"]
                    : nextClass
                  ).includes("Generic")
                    ? []
                    : state.talent,
                });
              }}
              disabled={isGenericClassOnly && state.class.length === 1}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn btn-secondary"
          disabled={isGenericClassOnly}
          onClick={() =>
            onChange({
              ...state,
              class: uniqueValues([
                ...state.class,
                CARD_CLASS_OPTIONS[state.class.length === 0 ? 0 : 1],
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
