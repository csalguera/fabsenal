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
        className="btn btn-secondary"
        aria-disabled={!hasPrevious}
      >
        Prev
      </Link>
      <Link
        href={nextViewHref}
        className="btn btn-secondary"
        aria-disabled={!hasNext}
      >
        Next
      </Link>
      {isAdmin ? (
        <>
          <Link href={`/cards/${cardId}/edit`} className="btn btn-secondary">
            Edit
          </Link>
          <Link href="/cards/add" className="btn btn-primary">
            Add a Card
          </Link>
        </>
      ) : null}
    </div>
  );
}
