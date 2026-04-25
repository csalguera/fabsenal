import type {
  CardTrait,
  CardSubtype,
  CardSupertype,
  CardRarity,
  CardType,
} from "./api/cards/types/card";

export type PitchInputValue = "" | "1" | "2" | "3";

export const DEFAULT_CARD_IMAGE_URL = "/file.svg";

export const CARD_TYPE_OPTIONS: CardType[] = [
  "Action",
  "Attack Reaction",
  "Block",
  "Companion",
  "Defense Reaction",
  "Demi-Hero",
  "Equipment",
  "Hero",
  "Instant",
  "Macro",
  "Mentor",
  "Resource",
  "Token",
  "Weapon",
];

export const CARD_SUBTYPE_OPTIONS: CardSubtype[] = [
  "(1H)",
  "(2H)",
  "Affliction",
  "Ally",
  "Arrow",
  "Ash",
  "Attack",
  "Aura",
  "Construct",
  "Figment",
  "Invocation",
  "Item",
  "Landmark",
  "Off-Hand",
  "Quiver",
  "Angel",
  "Arms",
  "Axe",
  "Base",
  "Book",
  "Bow",
  "Brush",
  "Cannon",
  "Chest",
  "Chi",
  "Claw",
  "Club",
  "Cog",
  "Dagger",
  "Demon",
  "Dragon",
  "Evo",
  "Fiddle",
  "Flail",
  "Gem",
  "Gun",
  "Hammer",
  "Head",
  "Legs",
  "Lute",
  "Mercenary",
  "Orb",
  "Pistol",
  "Pit-Fighter",
  "Polearm",
  "Rock",
  "Scepter",
  "Scroll",
  "Scythe",
  "Shuriken",
  "Song",
  "Staff",
  "Sword",
  "Trap",
  "Wrench",
  "Young",
];

export const CARD_SUPERTYPE_OPTIONS: CardSupertype[] = [
  "Adjudicator",
  "Assassin",
  "Bard",
  "Brute",
  "Guardian",
  "Illusionist",
  "Mechanologist",
  "Merchant",
  "Necromancer",
  "Ninja",
  "Pirate",
  "Ranger",
  "Runeblade",
  "Shapeshifter",
  "Thief",
  "Warrior",
  "Wizard",
  "Chaos",
  "Draconic",
  "Earth",
  "Elemental",
  "Ice",
  "Light",
  "Lightning",
  "Mystic",
  "Revered",
  "Reviled",
  "Royal",
  "Shadow",
];

export const CARD_TRAIT_OPTIONS: CardTrait[] = ["Agent of Chaos"];

export const CARD_RARITY_OPTIONS: CardRarity[] = [
  "Common",
  "Basic",
  "Promo",
  "Token",
  "Rare",
  "Super Rare",
  "Majestic",
  "Legendary",
];

export function parseCommaSeparatedList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseNullableCommaSeparatedList(value: string) {
  const values = parseCommaSeparatedList(value);
  return values.length > 0 ? values : null;
}

export function getMultiSelectValues(
  event: React.ChangeEvent<HTMLSelectElement>,
) {
  return Array.from(event.target.selectedOptions).map((option) => option.value);
}
