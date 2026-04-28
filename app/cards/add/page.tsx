import AddCardButton from "../../add-card-button";
import { getCardById } from "../_lib";

type AddCardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function AddCardPage({ searchParams }: AddCardPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const duplicateFromId = getSingleParam(resolvedSearchParams.duplicateFrom);
  // Load the source card so the add form can start as a duplicate draft.
  const duplicateCard = duplicateFromId
    ? await getCardById(duplicateFromId)
    : null;

  return (
    <section className="add-card-panel">
      <AddCardButton initialCard={duplicateCard ?? undefined} />
    </section>
  );
}
