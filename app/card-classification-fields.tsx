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
        <label htmlFor={`${idPrefix}-talent`}>
          Talent (multiple, includes None)
        </label>
        <select
          id={`${idPrefix}-talent`}
          multiple
          value={state.useNoTalent ? ["__NONE__"] : state.talent}
          onChange={(event) => {
            const values = getMultiSelectValues(event);
            const selectedNone = values.includes("__NONE__");
            onChange({
              ...state,
              useNoTalent: selectedNone,
              talent: selectedNone ? [] : (values as CardTalent[]),
            });
          }}
          disabled={state.class.includes("Generic")}
        >
          <option value="__NONE__">None</option>
          {CARD_TALENT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </p>

      <p className="field-row">
        <label htmlFor={`${idPrefix}-class`}>
          Class (hold Cmd/Ctrl to select multiple, optional - includes Generic)
        </label>
        <select
          id={`${idPrefix}-class`}
          multiple
          value={state.class}
          onChange={(event) => {
            const values = getMultiSelectValues(event) as CardClass[];
            onChange({
              ...state,
              class: values,
              talent: values.includes("Generic") ? [] : state.talent,
            });
          }}
        >
          {CARD_CLASS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </p>
    </>
  );
}
