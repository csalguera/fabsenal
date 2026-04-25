import DeckBuilder from "../../deck-builder";

type EditDeckPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditDeckPage({ params }: EditDeckPageProps) {
  const { id } = await params;
  return <DeckBuilder deckId={id} />;
}
