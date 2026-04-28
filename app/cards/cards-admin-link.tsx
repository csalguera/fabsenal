"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useAuthSession } from "@/app/auth/session-provider";

export default function CardsAdminLink() {
  const { isAdmin, loading } = useAuthSession();

  if (loading || !isAdmin) {
    return null;
  }

  return (
    <Link
      href="/cards/add"
      className="btn btn-primary btn-icon"
      aria-label="Add a card"
      title="Add a card"
    >
      <Plus aria-hidden="true" focusable="false" />
    </Link>
  );
}
