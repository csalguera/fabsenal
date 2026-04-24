"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type CardGalleryActionsProps = {
  id: string;
};

export default function CardGalleryActions({ id }: CardGalleryActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm("Delete this card?");
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/cards?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      router.refresh();
    } catch (error) {
      console.error("Failed to delete card", error);
      setIsDeleting(false);
    }
  };

  return (
    <div className="card-item-actions">
      <Link href={`/cards/${id}/view`} className="btn btn-secondary">
        View
      </Link>
      <Link href={`/cards/${id}/edit`} className="btn btn-secondary">
        Edit
      </Link>
      <button
        type="button"
        className="btn btn-danger"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? "Deleting..." : "Delete"}
      </button>
    </div>
  );
}
