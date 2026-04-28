"use client";

import Link from "next/link";
import { ArrowBigLeft, ArrowBigRight, Copy, PencilLine } from "lucide-react";
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
        </>
      ) : null}
    </div>
  );
}
