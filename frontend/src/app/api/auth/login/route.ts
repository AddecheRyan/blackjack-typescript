import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { createSession } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("blackjack");
    const { username, password } = await request.json();

    const user = await db.collection("users").findOne({ username, password });
    console.log(user, "user found");
    if (user) {
      await createSession(username);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json({ success: false, message: 'Invalid username or password' }, { status: 401 });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}