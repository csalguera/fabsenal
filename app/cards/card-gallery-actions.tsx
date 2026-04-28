"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, PencilLine, Trash2, Copy } from "lucide-react";
import { useAuthSession } from "@/app/auth/session-provider";

type CardGalleryActionsProps = {
  id: string;
};

export default function CardGalleryActions({ id }: CardGalleryActionsProps) {
  const router = useRouter();
  const { idToken, isAdmin } = useAuthSession();
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
        headers: idToken ? { Authorization: `Bearer ${idToken}` } : undefined,
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
      <Link
        href={`/cards/${id}/view`}
        className="btn btn-primary btn-icon"
        aria-label="View card"
        title="View card"
      >
        <Eye aria-hidden="true" focusable="false" />
      </Link>
      {isAdmin ? (
        <>
          <Link
            href={`/cards/${id}/edit`}
            className="btn btn-primary btn-icon"
            aria-label="Edit card"
            title="Edit card"
          >
            <PencilLine aria-hidden="true" focusable="false" />
          </Link>
          {/* Duplicate sends the admin to a prefilled add-card draft. */}
          <Link
            href={`/cards/add?duplicateFrom=${encodeURIComponent(id)}`}
            className="btn btn-primary btn-icon"
            aria-label="Duplicate card"
            title="Duplicate card"
          >
            <Copy aria-hidden="true" focusable="false" />
          </Link>
          <button
            type="button"
            className="btn btn-danger btn-icon"
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label={isDeleting ? "Deleting card" : "Delete card"}
            title={isDeleting ? "Deleting card" : "Delete card"}
          >
            {isDeleting ? (
              <span aria-hidden="true">…</span>
            ) : (
              <Trash2 aria-hidden="true" focusable="false" />
            )}
          </button>
        </>
      ) : null}
    </div>
  );
}
