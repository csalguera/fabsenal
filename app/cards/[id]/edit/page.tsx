import { notFound } from "next/navigation";
import CardActions from "../../../card-actions";
import { getCardById } from "../../_lib";

type EditCardPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCardPage({ params }: EditCardPageProps) {
  const { id } = await params;
  const card = await getCardById(id);

  if (!card) {
    notFound();
  }

  return (
    <section className="cards-section">
      <CardActions card={card} deleteRedirectTo="/cards" />
    </section>
  );
}
