import { NextResponse } from "next/server";
import {cards} from "@/lib/data";
import type { Card } from "./types/card";

export async function GET() {
  return NextResponse.json(cards);
}

export async function POST(request: Request) {
  const newCard: Card = await request.json();
  cards.push(newCard);
  return NextResponse.json(newCard, { status: 201 });
}