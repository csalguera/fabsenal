import { Card } from "@/app/api/cards/types/card";

export const cards: Card[] = [
  {
    id: "1",
    name: "Example Card",
    pitch: 2,
    color: "yellow",
    power: 3,
    defense: 3,
    intellect: null,
    life: null,
    types: ["Action"],
    subtypes: ["Attack"],
    supertypes: "Generic",
    traits: null,
    textBox: "This is an example card.",
    abilities: ["Example Ability"],
    imageUrl: "https://example.com/card-image.jpg",
  },
];