"use client";

import Link from "next/link";
import { useAuthSession } from "@/app/auth/session-provider";

export default function CardsAdminLink() {
  const { isAdmin, loading } = useAuthSession();

  if (loading || !isAdmin) {
    return null;
  }

  return (
    <Link href="/cards/add" className="btn btn-primary">
      Add a Card
    </Link>
  );
}
