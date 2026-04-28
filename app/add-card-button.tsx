"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
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

type CardFormState = ClassificationState & {
  name: string;
  pitch: PitchInputValue;
  cost: string;
  color: "" | CardColor;
  power: string;
  defense: string;
  intellect: string;
  life: string;
  rarity: CardRarity;
  abilities: string[];
  traits: CardTrait[];
  useNoTraits: boolean;
  imageUrl: string;
};

const INITIAL_FORM_STATE: CardFormState = {
  name: "",
  pitch: "0",
  cost: "0",
  color: "",
  power: "0",
  defense: "0",
  intellect: "0",
  life: "0",
  rarity: "Common",
  types: ["Action"],
  functionalSubtypes: [],
  useNoFunctionalSubtypes: true,
  nonFunctionalSubtypes: [],
  useNoNonFunctionalSubtypes: true,
  talent: [],
  useNoTalent: true,
  class: ["Generic"],
  abilities: [""],
  traits: [],
  useNoTraits: true,
  imageUrl: "",
};

type AddCardButtonProps = {
  successRedirectTo?: string;
  initialCard?: Partial<Card> & { id: string; name: string };
};

export default function AddCardButton({
  successRedirectTo,
  initialCard,
}: AddCardButtonProps) {
  const { idToken, isAdmin, loading } = useAuthSession();
  const [formState, setFormState] = useState<CardFormState>(
    // Seed the form from the duplicated card when present.
    initialCard ? buildFormStateFromCard(initialCard) : INITIAL_FORM_STATE,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  if (!loading && !isAdmin) {
    return <p className="form-message">Only admins can add cards.</p>;
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

  function buildFormStateFromCard(
    card: Partial<Card> & { id: string; name: string },
  ): CardFormState {
    // Copy the source card into a draft so the user can tweak and submit it.
    return {
      name: card.name,
      pitch: card.pitch != null ? (String(card.pitch) as PitchInputValue) : "0",
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
      abilities:
        (card.abilities ?? []).length > 0 ? (card.abilities ?? []) : [""],
      traits: card.traits ?? [],
      useNoTraits: !card.traits || card.traits.length === 0,
      imageUrl: card.imageUrl ?? "",
    };
  }

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

    if (!isAdmin) {
      setMessage("Only admins can add cards.");
      return;
    }

    if (!idToken) {
      setMessage("Sign in again to continue.");
      return;
    }

    if (!formState.name.trim()) {
      setMessage("Card name is required.");
      return;
    }

    if (formState.types.length === 0) {
      setMessage("Select at least one type.");
      return;
    }

    if (!imageFile && !formState.imageUrl) {
      setMessage("Image upload is required.");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    let uploadedImageUrl = formState.imageUrl;

    if (imageFile) {
      try {
        uploadedImageUrl = await uploadImageToS3(imageFile);
      } catch (error) {
        console.error("Failed to upload image", error);
        setMessage("Unable to upload image. Please try again.");
        setIsSubmitting(false);
        return;
      }
    }

    const payload: Card = {
      id: crypto.randomUUID(),
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
      imageUrl: uploadedImageUrl,
      abilities: formState.abilities
        .map((ability) => ability.trim())
        .filter(Boolean),
    };

    try {
      const response = await fetch("/api/cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      setMessage("Card added.");
      setFormState(INITIAL_FORM_STATE);
      setImageFile(null);
      router.replace(successRedirectTo ?? `/cards/${payload.id}/view`);
    } catch (error) {
      console.error("Failed to add card", error);
      setMessage("Unable to add card. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleAddCard} className="card-form" autoComplete="off">
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
          <option value="0">0</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
        </select>
      </p>

      <p className="field-row">
        <label htmlFor="cost">Cost </label>
        <input
          id="cost"
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

      <p className="field-row">
        <label htmlFor="rarity">Rarity </label>
        <select
          id="rarity"
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
        idPrefix="add"
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
        <label htmlFor="traits">Trait</label>
        <select
          id="traits"
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

      <div className="field-row">
        <label>Abilities</label>
        <div className="abilities-list">
          {formState.abilities.map((ability, index) => (
            <div key={`ability-${index}`} className="abilities-item">
              <textarea
                id={`ability-${index}`}
                value={ability}
                onChange={(event) => updateAbility(index, event.target.value)}
                placeholder={`Ability ${index + 1}`}
                rows={3}
              />
              <button
                type="button"
                className="btn btn-primary"
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
          className="btn btn-primary"
          onClick={addAbilityField}
        >
          Add Ability
        </button>
      </div>

      <p className="field-row">
        <label htmlFor="imageFile">Upload Image To S3 </label>
        <input
          id="imageFile"
          type="file"
          accept="image/*"
          onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
          required={!formState.imageUrl}
        />
        {formState.imageUrl ? (
          <span className="form-message">
            Duplicated image will be reused unless you choose a new upload.
          </span>
        ) : null}
      </p>

      <button type="submit" disabled={isSubmitting} className="btn btn-primary">
        {isSubmitting ? "Adding..." : "Add Card"}
      </button>
      {message ? <p className="form-message">{message}</p> : null}
    </form>
  );
}
