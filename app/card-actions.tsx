"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CardImage from "./card-image";
import { useAuthSession } from "@/app/auth/session-provider";
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
  type PitchInputValue,
} from "./card-form-shared";

type CardActionsProps = {
  card: Partial<Card> & { id: string; name: string };
  deleteRedirectTo?: string;
};

type CardEditState = ClassificationState & {
  name: string;
  pitch: PitchInputValue;
  cost: string;
  color: "" | CardColor;
  power: string;
  defense: string;
  intellect: string;
  life: string;
  rarity: CardRarity;
  traits: CardTrait[];
  useNoTraits: boolean;
  textBox: string;
  abilities: string[];
  imageUrl: string;
};

function initialStateFromCard(
  card: Partial<Card> & { id: string; name: string },
): CardEditState {
  return {
    name: card.name,
    pitch:
      card.pitch != null ? (String(card.pitch) as CardEditState["pitch"]) : "0",
    cost: card.cost != null ? String(card.cost) : "0",
    color: card.color ?? "",
    power: card.power != null ? String(card.power) : "0",
    defense: card.defense != null ? String(card.defense) : "0",
    intellect: card.intellect != null ? String(card.intellect) : "0",
    life: card.life != null ? String(card.life) : "0",
    rarity: card.rarity ?? "Common",
    types: card.types ?? ["Action"],
    functionalSubtypes: card.functionalSubtypes ?? [],
    useNoFunctionalSubtypes:
      !card.functionalSubtypes || card.functionalSubtypes.length === 0,
    nonFunctionalSubtypes: card.nonFunctionalSubtypes ?? [],
    useNoNonFunctionalSubtypes:
      !card.nonFunctionalSubtypes || card.nonFunctionalSubtypes.length === 0,
    talent: card.talent ?? [],
    useNoTalent: !card.talent || card.talent.length === 0,
    class: card.class && card.class.length > 0 ? card.class : ["Generic"],
    traits: card.traits ?? [],
    useNoTraits: !card.traits || card.traits.length === 0,
    textBox: card.textBox ?? "",
    abilities:
      (card.abilities ?? []).length > 0 ? (card.abilities ?? []) : [""],
    imageUrl: card.imageUrl ?? "",
  };
}

export default function CardActions({
  card,
  deleteRedirectTo,
}: CardActionsProps) {
  const { idToken, isAdmin, loading } = useAuthSession();
  const router = useRouter();
  const [formState, setFormState] = useState<CardEditState>(
    initialStateFromCard(card),
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const id = card.id;

  if (!loading && !isAdmin) {
    return (
      <p className="form-message">Only admins can edit or delete cards.</p>
    );
  }

  const updateAbility = (index: number, value: string) => {
    setFormState((current) => ({
      ...current,
      abilities: current.abilities.map((ability, abilityIndex) =>
        abilityIndex === index ? value : ability,
      ),
    }));
  };

  const addAbilityField = () => {
    setFormState((current) => ({
      ...current,
      abilities: [...current.abilities, ""],
    }));
  };

  const removeAbilityField = (index: number) => {
    setFormState((current) => {
      const nextAbilities = current.abilities.filter(
        (_, abilityIndex) => abilityIndex !== index,
      );

      return {
        ...current,
        abilities: nextAbilities.length > 0 ? nextAbilities : [""],
      };
    });
  };

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
    if (!isAdmin) {
      setMessage("Only admins can update cards.");
      return;
    }

    if (!idToken) {
      setMessage("Sign in again to continue.");
      return;
    }

    if (!formState.name.trim()) {
      setMessage("Name is required for update.");
      return;
    }

    if (formState.types.length === 0) {
      setMessage("At least one type is required.");
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
      cost: formState.cost ? Number(formState.cost) : null,
      color: formState.color || null,
      power: formState.power ? Number(formState.power) : null,
      defense: formState.defense ? Number(formState.defense) : null,
      intellect: formState.intellect ? Number(formState.intellect) : null,
      life: formState.life ? Number(formState.life) : null,
      rarity: formState.rarity,
      types: formState.types,
      functionalSubtypes: formState.useNoFunctionalSubtypes
        ? null
        : formState.functionalSubtypes,
      nonFunctionalSubtypes: formState.useNoNonFunctionalSubtypes
        ? null
        : formState.nonFunctionalSubtypes,
      talent: formState.useNoTalent ? null : formState.talent,
      class: formState.class.length > 0 ? formState.class : null,
      traits:
        formState.useNoTraits || formState.traits.length === 0
          ? null
          : formState.traits,
      textBox: formState.textBox.trim(),
      abilities: formState.abilities
        .map((ability) => ability.trim())
        .filter(Boolean),
      imageUrl: nextImageUrl,
    };

    try {
      const response = await fetch("/api/cards", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      setMessage("Card updated.");
      router.replace(`/cards/${id}/view`);
    } catch (error) {
      console.error("Failed to update card", error);
      setMessage("Unable to update card.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin) {
      setMessage("Only admins can delete cards.");
      return;
    }

    if (!idToken) {
      setMessage("Sign in again to continue.");
      return;
    }

    const confirmed = window.confirm("Delete this card?");
    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/cards?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
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
    <form
      className="card-actions"
      autoComplete="off"
      onSubmit={(event) => event.preventDefault()}
    >
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
          <option value="0">0</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
        </select>
      </p>
      <p className="field-row">
        <label htmlFor={`update-cost-${id}`}>Cost </label>
        <input
          id={`update-cost-${id}`}
          type="number"
          value={formState.cost}
          onChange={(event) =>
            setFormState((current) => ({
              ...current,
              cost: event.target.value,
            }))
          }
        />
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
          functionalSubtypes: formState.functionalSubtypes,
          useNoFunctionalSubtypes: formState.useNoFunctionalSubtypes,
          nonFunctionalSubtypes: formState.nonFunctionalSubtypes,
          useNoNonFunctionalSubtypes: formState.useNoNonFunctionalSubtypes,
          talent: formState.talent,
          useNoTalent: formState.useNoTalent,
          class: formState.class,
        }}
        onChange={(next) =>
          setFormState((current) => ({
            ...current,
            ...next,
          }))
        }
      />
      <p className="field-row">
        <label htmlFor={`update-traits-${id}`}>Trait</label>
        <select
          id={`update-traits-${id}`}
          value={
            formState.useNoTraits
              ? "__NONE__"
              : (formState.traits[0] ?? "__NONE__")
          }
          onChange={(event) => {
            const selectedValue = event.target.value;
            const selectedNone = selectedValue === "__NONE__";

            setFormState((current) => ({
              ...current,
              useNoTraits: selectedNone,
              traits: selectedNone ? [] : ([selectedValue] as CardTrait[]),
            }));
          }}
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
      <div className="field-row">
        <label>Abilities</label>
        <div className="abilities-list">
          {formState.abilities.map((ability, index) => (
            <div key={`update-ability-${index}`} className="abilities-item">
              <textarea
                id={`update-abilities-${id}-${index}`}
                value={ability}
                onChange={(event) => updateAbility(index, event.target.value)}
                placeholder={`Ability ${index + 1}`}
                rows={3}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => removeAbilityField(index)}
                disabled={formState.abilities.length === 1}
              >
                Remove Ability
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={addAbilityField}
        >
          Add Ability
        </button>
      </div>
      <p className="field-row">
        <label>Current Image</label>
        {formState.imageUrl ? (
          <span className="card-current-image-preview">
            <CardImage
              src={formState.imageUrl}
              alt={formState.name}
              width={120}
              height={180}
              className="card-current-image"
            />
          </span>
        ) : (
          <span className="form-message">No image available.</span>
        )}
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
    </form>
  );
}
