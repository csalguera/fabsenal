import { headers } from "next/headers";

async function getCards() {
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") ?? "http";

  if (!host) {
    throw new Error("Missing host header for API request");
  }

  const response = await fetch(`${protocol}://${host}/api/cards`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch cards");
  }
  return response.json();
}

const Home = async () => {
  const cards = await getCards();
  return (
    <>
      <h1>Fabsenal</h1>
      <p>Flesh and Blood deckbuilding application</p>
      <h2>Cards</h2>
      <ul>
        {cards.map((card: any) => (
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
            <img src={card.imageUrl} alt={card.name} />
          </li>
        ))}
      </ul>
    </>
  );
};

export default Home;
