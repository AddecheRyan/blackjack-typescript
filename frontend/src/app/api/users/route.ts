import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { Users2Icon } from "lucide-react";

// Get all users
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("blackjack");
    const users = await db
      .collection("users")
      .find({})
      .toArray();

    return NextResponse.json(users);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}


// Create a new user
export async function POST(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("blackjack");
    const body = await request.json();
    const users = await db.collection("users").insertOne(body);
    return NextResponse.json(users, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

