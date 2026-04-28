"use client";

import { useId } from "react";

type DeleteConfirmModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeleteConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  isSubmitting = false,
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  if (!open) {
    return null;
  }

  return (
    <div
      className="deck-card-modal-backdrop"
      role="presentation"
      onClick={onCancel}
    >
      <div
        className="deck-card-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="deck-card-modal-header">
          <h3 id={titleId}>{title}</h3>
        </div>
        <p id={descriptionId} className="empty-state">
          {description}
        </p>
        <div className="filters-dialog-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
