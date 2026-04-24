export type CardColor = "red" | "yellow" | "blue";
export type PitchValue = 1 | 2 | 3;
export type CardType =
  | "Action"
  | "Attack Reaction"
  | "Block"
  | "Companion"
  | "Defense Reaction"
  | "Demi-Hero"
  | "Equipment"
  | "Hero"
  | "Instant"
  | "Macro"
  | "Mentor"
  | "Resource"
  | "Token"
  | "Weapon";
export type CardSubtype =
  | "(1H)"
  | "(2H)"
  | "Affliction"
  | "Ally"
  | "Arrow"
  | "Ash"
  | "Attack"
  | "Aura"
  | "Construct"
  | "Figment"
  | "Invocation"
  | "Item"
  | "Landmark"
  | "Off-Hand"
  | "Quiver"
  | "Angel"
  | "Arms"
  | "Axe"
  | "Base"
  | "Book"
  | "Bow"
  | "Brush"
  | "Cannon"
  | "Chest"
  | "Chi"
  | "Claw"
  | "Club"
  | "Cog"
  | "Dagger"
  | "Demon"
  | "Dragon"
  | "Evo"
  | "Fiddle"
  | "Flail"
  | "Gem"
  | "Gun"
  | "Hammer"
  | "Head"
  | "Legs"
  | "Lute"
  | "Mercenary"
  | "Orb"
  | "Pistol"
  | "Pit-Fighter"
  | "Polearm"
  | "Rock"
  | "Scepter"
  | "Scroll"
  | "Scythe"
  | "Shuriken"
  | "Song"
  | "Staff"
  | "Sword"
  | "Trap"
  | "Wrench"
  | "Young";
export type CardSupertype =
  | "Adjudicator"
  | "Assassin"
  | "Bard"
  | "Brute"
  | "Guardian"
  | "Illusionist"
  | "Mechanologist"
  | "Merchant"
  | "Necromancer"
  | "Ninja"
  | "Pirate"
  | "Ranger"
  | "Runeblade"
  | "Shapeshifter"
  | "Thief"
  | "Warrior"
  | "Wizard"
  | "Chaos"
  | "Draconic"
  | "Earth"
  | "Elemental"
  | "Ice"
  | "Light"
  | "Lightning"
  | "Mystic"
  | "Revered"
  | "Reviled"
  | "Royal"
  | "Shadow";
export type CardTrait = "Agent of Chaos";

export interface Card {
  id: string;
  name: string;
  pitch: PitchValue | null;
  color: CardColor | null;
  power: number | null;
  defense: number | null;
  intellect: number | null;
  life: number | null;
  types: CardType[];
  subtypes: CardSubtype[] | null;
  supertypes: CardSupertype[] | "Generic";
  traits: CardTrait[] | null;
  textBox: string;
  abilities: string[];
  imageUrl: string;
}
