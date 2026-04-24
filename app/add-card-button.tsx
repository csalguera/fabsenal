"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type {
  Card,
  CardColor,
  CardTrait,
  PitchValue,
} from "./api/cards/types/card";
import CardClassificationFields, {
  type ClassificationState,
} from "./card-classification-fields";
import {
  CARD_TRAIT_OPTIONS,
  parseCommaSeparatedList,
  getMultiSelectValues,
  type PitchInputValue,
} from "./card-form-shared";

type CardFormState = ClassificationState & {
  name: string;
  pitch: PitchInputValue;
  color: "" | CardColor;
  power: string;
  defense: string;
  intellect: string;
  life: string;
  textBox: string;
  abilities: string;
  traits: CardTrait[];
  useNoTraits: boolean;
};

const INITIAL_FORM_STATE: CardFormState = {
  name: "",
  pitch: "",
  color: "",
  power: "",
  defense: "",
  intellect: "",
  life: "",
  types: ["Action"],
  subtypes: [],
  useNoSubtypes: true,
  supertypes: [],
  useGenericSupertype: true,
  textBox: "",
  abilities: "",
  traits: [],
  useNoTraits: true,
};

type AddCardButtonProps = {
  successRedirectTo?: string;
};

export default function AddCardButton({
  successRedirectTo,
}: AddCardButtonProps) {
  const [formState, setFormState] = useState<CardFormState>(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const uploadImageToS3 = async (file: File) => {
    const uploadPayload = new FormData();
    uploadPayload.append("file", file);

    const uploadResponse = await fetch("/api/uploads", {
      method: "POST",
      body: uploadPayload,
    });

    if (!uploadResponse.ok) {
      throw new Error("Image upload failed");
    }

    const uploadData = (await uploadResponse.json()) as { url: string };
    return uploadData.url;
  };

  const handleAddCard = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formState.name.trim()) {
      setMessage("Card name is required.");
      return;
    }

    if (formState.types.length === 0) {
      setMessage("Select at least one type.");
      return;
    }

    if (!formState.useGenericSupertype && formState.supertypes.length === 0) {
      setMessage("Select at least one supertype or choose Generic.");
      return;
    }

    if (!imageFile) {
      setMessage("Image upload is required.");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    let uploadedImageUrl = "";

    try {
      uploadedImageUrl = await uploadImageToS3(imageFile);
    } catch (error) {
      console.error("Failed to upload image", error);
      setMessage("Unable to upload image. Please try again.");
      setIsSubmitting(false);
      return;
    }

    const payload: Card = {
      id: crypto.randomUUID(),
      name: formState.name.trim(),
      pitch: formState.pitch ? (Number(formState.pitch) as PitchValue) : null,
      color: formState.color || null,
      power: formState.power ? Number(formState.power) : null,
      defense: formState.defense ? Number(formState.defense) : null,
      intellect: formState.intellect ? Number(formState.intellect) : null,
      life: formState.life ? Number(formState.life) : null,
      types: formState.types,
      subtypes: formState.useNoSubtypes ? null : formState.subtypes,
      supertypes: formState.useGenericSupertype
        ? "Generic"
        : formState.supertypes,
      traits:
        formState.useNoTraits || formState.traits.length === 0
          ? null
          : formState.traits,
      textBox: formState.textBox.trim(),
      abilities: parseCommaSeparatedList(formState.abilities),
      imageUrl: uploadedImageUrl,
    };

    try {
      const response = await fetch("/api/cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      setMessage("Card added.");
      setFormState(INITIAL_FORM_STATE);
      setImageFile(null);
      if (successRedirectTo) {
        router.replace(successRedirectTo);
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to add card", error);
      setMessage("Unable to add card. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleAddCard} className="card-form">
      <p className="field-row">
        <label htmlFor="name">Name </label>
        <input
          id="name"
          value={formState.name}
          onChange={(event) =>
            setFormState((current) => ({
              ...current,
              name: event.target.value,
            }))
          }
          required
        />
      </p>

      <p className="field-row">
        <label htmlFor="pitch">Pitch </label>
        <select
          id="pitch"
          value={formState.pitch}
          onChange={(event) =>
            setFormState((current) => ({
              ...current,
              pitch: event.target.value as CardFormState["pitch"],
            }))
          }
        >
          <option value="">None</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
        </select>
      </p>

      <p className="field-row">
        <label htmlFor="color">Color </label>
        <select
          id="color"
          value={formState.color}
          onChange={(event) =>
            setFormState((current) => ({
              ...current,
              color: event.target.value as CardFormState["color"],
            }))
          }
        >
          <option value="">None</option>
          <option value="red">Red</option>
          <option value="yellow">Yellow</option>
          <option value="blue">Blue</option>
        </select>
      </p>

      <p className="field-row">
        <label htmlFor="power">Power </label>
        <input
          id="power"
          type="number"
          value={formState.power}
          onChange={(event) =>
            setFormState((current) => ({
              ...current,
              power: event.target.value,
            }))
          }
        />
      </p>

      <p className="field-row">
        <label htmlFor="defense">Defense </label>
        <input
          id="defense"
          type="number"
          value={formState.defense}
          onChange={(event) =>
            setFormState((current) => ({
              ...current,
              defense: event.target.value,
            }))
          }
        />
      </p>

      <p className="field-row">
        <label htmlFor="intellect">Intellect </label>
        <input
          id="intellect"
          type="number"
          value={formState.intellect}
          onChange={(event) =>
            setFormState((current) => ({
              ...current,
              intellect: event.target.value,
            }))
          }
        />
      </p>

      <p className="field-row">
        <label htmlFor="life">Life </label>
        <input
          id="life"
          type="number"
          value={formState.life}
          onChange={(event) =>
            setFormState((current) => ({
              ...current,
              life: event.target.value,
            }))
          }
        />
      </p>

      <CardClassificationFields
        idPrefix="add"
        state={{
          types: formState.types,
          subtypes: formState.subtypes,
          useNoSubtypes: formState.useNoSubtypes,
          supertypes: formState.supertypes,
          useGenericSupertype: formState.useGenericSupertype,
        }}
        onChange={(next) =>
          setFormState((current) => ({
            ...current,
            ...next,
          }))
        }
      />

      <p className="field-row">
        <label htmlFor="abilities">Abilities (comma-separated) </label>
        <input
          id="abilities"
          value={formState.abilities}
          onChange={(event) =>
            setFormState((current) => ({
              ...current,
              abilities: event.target.value,
            }))
          }
        />
      </p>

      <p className="field-row">
        <label htmlFor="traits">
          Traits (hold Cmd/Ctrl to select multiple, includes None){" "}
        </label>
        <select
          id="traits"
          value={formState.useNoTraits ? ["__NONE__"] : formState.traits}
          onChange={(event) => {
            const values = getMultiSelectValues(event);
            const selectedNone = values.includes("__NONE__");

            setFormState((current) => ({
              ...current,
              useNoTraits: selectedNone,
              traits: selectedNone ? [] : (values as CardTrait[]),
            }));
          }}
          multiple
        >
          <option value="__NONE__">None</option>
          {CARD_TRAIT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </p>

      <p className="field-row">
        <label htmlFor="imageFile">Upload Image To S3 </label>
        <input
          id="imageFile"
          type="file"
          accept="image/*"
          onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
          required
        />
      </p>

      <button type="submit" disabled={isSubmitting} className="btn btn-primary">
        {isSubmitting ? "Adding..." : "Add Card"}
      </button>
      {message ? <p className="form-message">{message}</p> : null}
    </form>
  );
}
