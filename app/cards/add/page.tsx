import AddCardButton from "../../add-card-button";

export default function AddCardPage() {
  return (
    <section className="add-card-panel">
      <AddCardButton successRedirectTo="/cards" />
    </section>
  );
}
