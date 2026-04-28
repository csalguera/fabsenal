"use client";

import Link from "next/link";
import { useAuthSession } from "@/app/auth/session-provider";

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
  const { isAdmin } = useAuthSession();

  return (
    <div className="card-item-actions">
      <Link
        href={previousViewHref}
        className="btn btn-primary"
        aria-disabled={!hasPrevious}
      >
        Prev
      </Link>
      <Link
        href={nextViewHref}
        className="btn btn-primary"
        aria-disabled={!hasNext}
      >
        Next
      </Link>
      {isAdmin ? (
        <>
          <Link href={`/cards/${cardId}/edit`} className="btn btn-primary">
            Edit
          </Link>
          {/* Duplicate sends the admin to a prefilled add-card draft. */}
          <Link
            href={`/cards/add?duplicateFrom=${encodeURIComponent(cardId)}`}
            className="btn btn-primary"
          >
            Duplicate
          </Link>
        </>
      ) : null}
    </div>
  );
}
