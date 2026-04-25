"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  Card,
  CardColor,
  CardRarity,
  CardTrait,
  PitchValue,
} from "./api/cards/types/card";
import CardClassificationFields, {
  type ClassificationState,
} from "./card-classification-fields";
import {
  CARD_RARITY_OPTIONS,
  CARD_TRAIT_OPTIONS,
  getMultiSelectValues,
  parseCommaSeparatedList,
  type PitchInputValue,
} from "./card-form-shared";

type CardActionsProps = {
  card: Partial<Card> & { id: string; name: string };
  deleteRedirectTo?: string;
};

type CardEditState = ClassificationState & {
  name: string;
  pitch: PitchInputValue;
  color: "" | CardColor;
  power: string;
  defense: string;
  intellect: string;
  life: string;
  rarity: CardRarity;
  traits: CardTrait[];
  useNoTraits: boolean;
  textBox: string;
  abilities: string;
  imageUrl: string;
};

function initialStateFromCard(
  card: Partial<Card> & { id: string; name: string },
): CardEditState {
  return {
    name: card.name,
    pitch: card.pitch ? (String(card.pitch) as CardEditState["pitch"]) : "",
    color: card.color ?? "",
    power: card.power != null ? String(card.power) : "",
    defense: card.defense != null ? String(card.defense) : "",
    intellect: card.intellect != null ? String(card.intellect) : "",
    life: card.life != null ? String(card.life) : "",
    rarity: card.rarity ?? "Common",
    types: card.types ?? ["Action"],
    subtypes: card.subtypes ?? [],
    useNoSubtypes: !card.subtypes || card.subtypes.length === 0,
    supertypes:
      card.supertypes === "Generic" || !card.supertypes ? [] : card.supertypes,
    useGenericSupertype: card.supertypes === "Generic" || !card.supertypes,
    traits: card.traits ?? [],
    useNoTraits: !card.traits || card.traits.length === 0,
    textBox: card.textBox ?? "",
    abilities: (card.abilities ?? []).join(", "),
    imageUrl: card.imageUrl ?? "",
  };
}

export default function CardActions({
  card,
  deleteRedirectTo,
}: CardActionsProps) {
  const router = useRouter();
  const [formState, setFormState] = useState<CardEditState>(
    initialStateFromCard(card),
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const id = card.id;

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

  const handleUpdate = async () => {
    if (!formState.name.trim()) {
      setMessage("Name is required for update.");
      return;
    }

    if (formState.types.length === 0) {
      setMessage("At least one type is required.");
      return;
    }

    if (!formState.useGenericSupertype && formState.supertypes.length === 0) {
      setMessage("At least one supertype is required unless Generic.");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    let nextImageUrl = formState.imageUrl;

    if (imageFile) {
      try {
        nextImageUrl = await uploadImageToS3(imageFile);
      } catch (error) {
        console.error("Failed to upload image", error);
        setMessage("Unable to upload image. Please try again.");
        setIsSubmitting(false);
        return;
      }
    }

    const payload: Card = {
      id,
      name: formState.name.trim(),
      pitch: formState.pitch ? (Number(formState.pitch) as PitchValue) : null,
      color: formState.color || null,
      power: formState.power ? Number(formState.power) : null,
      defense: formState.defense ? Number(formState.defense) : null,
      intellect: formState.intellect ? Number(formState.intellect) : null,
      life: formState.life ? Number(formState.life) : null,
      rarity: formState.rarity,
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
      imageUrl: nextImageUrl,
    };

    try {
      const response = await fetch("/api/cards", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      setMessage("Card updated.");
      router.refresh();
    } catch (error) {
      console.error("Failed to update card", error);
      setMessage("Unable to update card.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Delete this card?");
    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/cards?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      setMessage("Card deleted.");
      if (deleteRedirectTo) {
        router.replace(deleteRedirectTo);
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to delete card", error);
      setMessage("Unable to delete card.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card-actions">
      <p className="field-row">
        <label htmlFor={`update-name-${id}`}>Name </label>
        <input
          id={`update-name-${id}`}
          value={formState.name}
          onChange={(event) =>
            setFormState((current) => ({
              ...current,
              name: event.target.value,
            }))
          }
        />
      </p>
      <p className="field-row">
        <label htmlFor={`update-pitch-${id}`}>Pitch </label>
        <select
          id={`update-pitch-${id}`}
          value={formState.pitch}
          onChange={(event) =>
            setFormState((current) => ({
              ...current,
              pitch: event.target.value as CardEditState["pitch"],
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
        <label htmlFor={`update-color-${id}`}>Color </label>
        <select
          id={`update-color-${id}`}
          value={formState.color}
          onChange={(event) =>
            setFormState((current) => ({
              ...current,
              color: event.target.value as CardEditState["color"],
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
        <label htmlFor={`update-power-${id}`}>Power </label>
        <input
          id={`update-power-${id}`}
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
        <label htmlFor={`update-defense-${id}`}>Defense </label>
        <input
          id={`update-defense-${id}`}
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
        <label htmlFor={`update-intellect-${id}`}>Intellect </label>
        <input
          id={`update-intellect-${id}`}
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
        <label htmlFor={`update-life-${id}`}>Life </label>
        <input
          id={`update-life-${id}`}
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

      <p className="field-row">
        <label htmlFor={`update-rarity-${id}`}>Rarity </label>
        <select
          id={`update-rarity-${id}`}
          value={formState.rarity}
          onChange={(event) =>
            setFormState((current) => ({
              ...current,
              rarity: event.target.value as CardRarity,
            }))
          }
          required
        >
          {CARD_RARITY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </p>

      <CardClassificationFields
        idPrefix={`update-${id}`}
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
        <label htmlFor={`update-traits-${id}`}>
          Traits (hold Cmd/Ctrl to select multiple, includes None)
        </label>
        <select
          id={`update-traits-${id}`}
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
        <label htmlFor={`update-textbox-${id}`}>Text Box </label>
        <input
          id={`update-textbox-${id}`}
          value={formState.textBox}
          onChange={(event) =>
            setFormState((current) => ({
              ...current,
              textBox: event.target.value,
            }))
          }
        />
      </p>
      <p className="field-row">
        <label htmlFor={`update-abilities-${id}`}>
          Abilities (comma-separated)
        </label>
        <input
          id={`update-abilities-${id}`}
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
        <label htmlFor={`update-imageFile-${id}`}>
          Replace Image (upload only)
        </label>
        <input
          id={`update-imageFile-${id}`}
          type="file"
          accept="image/*"
          onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
        />
      </p>
      <button
        type="button"
        onClick={handleUpdate}
        disabled={isSubmitting}
        className="btn btn-secondary"
      >
        Update
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isSubmitting}
        className="btn btn-danger"
      >
        Delete
      </button>
      {message ? <p className="form-message">{message}</p> : null}
    </div>
  );
}
