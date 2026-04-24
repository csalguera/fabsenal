import type {
  CardSubtype,
  CardSupertype,
  CardType,
} from "./api/cards/types/card";
import {
  CARD_SUBTYPE_OPTIONS,
  CARD_SUPERTYPE_OPTIONS,
  CARD_TYPE_OPTIONS,
  getMultiSelectValues,
} from "./card-form-shared";

export type ClassificationState = {
  types: CardType[];
  subtypes: CardSubtype[];
  useNoSubtypes: boolean;
  supertypes: CardSupertype[];
  useGenericSupertype: boolean;
};

type CardClassificationFieldsProps = {
  idPrefix: string;
  state: ClassificationState;
  onChange: (next: ClassificationState) => void;
};

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

      <p className="field-row">
        <label htmlFor={`${idPrefix}-supertypes`}>
          Supertypes (multiple, includes Generic)
        </label>
        <select
          id={`${idPrefix}-supertypes`}
          multiple
          value={state.useGenericSupertype ? ["__GENERIC__"] : state.supertypes}
          onChange={(event) => {
            const values = getMultiSelectValues(event);
            const selectedGeneric = values.includes("__GENERIC__");
            onChange({
              ...state,
              useGenericSupertype: selectedGeneric,
              supertypes: selectedGeneric ? [] : (values as CardSupertype[]),
            });
          }}
          required
        >
          <option value="__GENERIC__">Generic</option>
          {CARD_SUPERTYPE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </p>
    </>
  );
}
