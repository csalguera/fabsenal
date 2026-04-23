import { headers } from "next/headers";
import { Card } from "./api/cards/types/card";
import Image from "next/image";

async function getCards() {
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") ?? "http";

  if (!host) {
    return [] as Card[];
  }

  try {
    const response = await fetch(`${protocol}://${host}/api/cards`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return [] as Card[];
    }

    return (await response.json()) as Card[];
  } catch (error) {
    console.error("Cards fetch failed", error);
    return [] as Card[];
  }
}

const Home = async () => {
  const cards = await getCards();

  if (cards.length === 0) {
    return (
      <>
        <h1>Fabsenal</h1>
        <p>Flesh and Blood deckbuilding application</p>
        <h2>Cards</h2>
        <p>No cards found yet. Add a card to get started.</p>
      </>
    );
  }

  return (
    <>
      <h1>Fabsenal</h1>
      <p>Flesh and Blood deckbuilding application</p>
      <h2>Cards</h2>
      <ul>
        {cards.map((card: Card) => (
          <li key={card.id}>
            <h3>{card.name}</h3>
            <p>Pitch: {card.pitch}</p>
            <p>Color: {card.color}</p>
            <p>Power: {card.power}</p>
            <p>Defense: {card.defense}</p>
            <p>Intellect: {card.intellect}</p>
            <p>Life: {card.life}</p>
            <p>Types: {card.types.join(", ")}</p>
            <p>Subtypes: {card.subtypes.join(", ")}</p>
            <p>
              Supertypes:{" "}
              {Array.isArray(card.supertypes)
                ? card.supertypes.join(", ")
                : card.supertypes}
            </p>
            <p>Traits: {card.traits ? card.traits.join(", ") : "None"}</p>
            <p>Text Box: {card.textBox}</p>
            <p>Abilities: {card.abilities.join(", ")}</p>
            <Image
              src={card.imageUrl}
              alt={card.name}
              width={200}
              height={300}
            />
          </li>
        ))}
      </ul>
    </>
  );
};

export default Home;
