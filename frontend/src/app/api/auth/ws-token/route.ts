import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { decrypt } from "@/lib/session"

// the session cookie is httpOnly, so the browser can't read it directly.
// this route hands the verified token to the client so it can authenticate
// the WebSocket connection to the game server (which may be on another domain).
export async function GET() {
    const token = (await cookies()).get("session")?.value
    const session = await decrypt(token)

    if (!session?.username) {
        return NextResponse.json({ error: "not authenticated" }, { status: 401 })
    }

    return NextResponse.json({ token })
}
