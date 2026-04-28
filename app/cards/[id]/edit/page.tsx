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
      <div className="section-header">
        <h2 className="section-title" style={{ marginBottom: "8px" }}>
          Edit Card
        </h2>
      </div>
      <CardActions card={card} deleteRedirectTo="/cards" />
    </section>
  );
}
