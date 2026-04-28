"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowBigLeft,
  ArrowBigRight,
  Copy,
  PencilLine,
  Trash2,
} from "lucide-react";
import { useAuthSession } from "@/app/auth/session-provider";
import DeleteConfirmModal from "@/app/delete-confirm-modal";

type ViewCardActionsProps = {
  previousViewHref: string;
  nextViewHref: string;
  hasPrevious: boolean;
  hasNext: boolean;
  cardId: string;
};

export default function ViewCardActions({
  previousViewHref,
  nextViewHref,
  hasPrevious,
  hasNext,
  cardId,
}: ViewCardActionsProps) {
  const router = useRouter();
  const { idToken, isAdmin } = useAuthSession();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    setIsDeleteModalOpen(false);

    try {
      const response = await fetch(
        `/api/cards?id=${encodeURIComponent(cardId)}`,
        {
          method: "DELETE",
          headers: idToken ? { Authorization: `Bearer ${idToken}` } : undefined,
        },
      );

      if (!response.ok) {
        throw new Error("Request failed");
      }

      router.replace("/cards");
      router.refresh();
    } catch (error) {
      console.error("Failed to delete card", error);
      setIsDeleting(false);
    }
  };

  return (
    <div className="card-item-actions">
      <Link
        href={previousViewHref}
        className="btn btn-primary btn-icon"
        aria-disabled={!hasPrevious}
      >
        <ArrowBigLeft aria-hidden="true" focusable="false" />
      </Link>
      <Link
        href={nextViewHref}
        className="btn btn-primary btn-icon"
        aria-disabled={!hasNext}
      >
        <ArrowBigRight aria-hidden="true" focusable="false" />
      </Link>
      {isAdmin ? (
        <>
          <Link
            href={`/cards/${cardId}/edit`}
            className="btn btn-primary btn-icon"
            aria-label="Edit card"
            title="Edit card"
          >
            <PencilLine aria-hidden="true" focusable="false" />
          </Link>
          <Link
            href={`/cards/add?duplicateFrom=${encodeURIComponent(cardId)}`}
            className="btn btn-primary btn-icon"
            aria-label="Duplicate card"
            title="Duplicate card"
          >
            <Copy aria-hidden="true" focusable="false" />
          </Link>
          <button
            type="button"
            className="btn btn-danger btn-icon"
            onClick={() => setIsDeleteModalOpen(true)}
            disabled={isDeleting}
            aria-label={isDeleting ? "Deleting card" : "Delete card"}
            title={isDeleting ? "Deleting card" : "Delete card"}
          >
            {isDeleting ? (
              <span aria-hidden="true">...</span>
            ) : (
              <Trash2 aria-hidden="true" focusable="false" />
            )}
          </button>
        </>
      ) : null}

      <DeleteConfirmModal
        open={isDeleteModalOpen}
        title="Delete card?"
        description="This action cannot be undone."
        confirmLabel="Delete Card"
        isSubmitting={isDeleting}
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
