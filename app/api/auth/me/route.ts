import { NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/firebase-server-auth";

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUserFromRequest(request);

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(authUser);
  } catch (error) {
    console.error("Failed to resolve auth user", error);
    return NextResponse.json(
      { error: "Failed to resolve auth user" },
      { status: 500 },
    );
  }
}
