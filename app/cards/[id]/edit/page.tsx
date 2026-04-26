import { notFound } from "next/navigation";
import Link from "next/link";
import CardActions from "../../../card-actions";
import { getCardById, getCardNavigation } from "../../_lib";

type EditCardPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCardPage({ params }: EditCardPageProps) {
  const { id } = await params;
  const card = await getCardById(id);

  if (!card) {
    notFound();
  }

  const navigation = await getCardNavigation(card.id);
  const previousEditHref = navigation.previousId
    ? `/cards/${navigation.previousId}/edit`
    : `/cards/${card.id}/edit`;
  const nextEditHref = navigation.nextId
    ? `/cards/${navigation.nextId}/edit`
    : `/cards/${card.id}/edit`;

  return (
    <section className="cards-section">
      <div className="section-header">
        <h2>Edit Card</h2>
        <div className="card-item-actions">
          <Link
            href={previousEditHref}
            className="btn btn-secondary"
            aria-disabled={!navigation.previousId}
          >
            Prev
          </Link>
          <Link
            href={nextEditHref}
            className="btn btn-secondary"
            aria-disabled={!navigation.nextId}
          >
            Next
          </Link>
          <Link href={`/cards/${card.id}/view`} className="btn btn-secondary">
            View
          </Link>
          <Link href="/cards" className="btn btn-primary">
            Back to Cards
          </Link>
        </div>
      </div>
      <CardActions card={card} deleteRedirectTo="/cards" />
    </section>
  );
}
