import type {
  CardTrait,
  CardFunctionalSubtype,
  CardNonFunctionalSubtype,
  CardClass,
  CardTalent,
  CardRarity,
  CardType,
} from "./api/cards/types/card";

export type CardSubtype = CardFunctionalSubtype | CardNonFunctionalSubtype;

export type PitchInputValue = "0" | "1" | "2" | "3";

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

export const CARD_FUNCTIONAL_SUBTYPE_OPTIONS: CardFunctionalSubtype[] = [
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
];

export const CARD_NON_FUNCTIONAL_SUBTYPE_OPTIONS: CardNonFunctionalSubtype[] = [
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

export const CARD_TALENT_OPTIONS: CardTalent[] = [
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

export const CARD_CLASS_OPTIONS: CardClass[] = [
  "Generic",
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
