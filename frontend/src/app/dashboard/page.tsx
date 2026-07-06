"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { RoomSummary } from "@blackjack/shared"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
const REFRESH_INTERVAL_MS = 5000

export default function DashboardPage() {
    const [rooms, setRooms] = useState<RoomSummary[]>([])
    const [loadError, setLoadError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false

        async function loadRooms() {
            try {
                const res = await fetch(`${API_URL}/rooms`)
                const data = await res.json()
                if (!cancelled) {
                    setRooms(data.rooms)
                    setLoadError(null)
                }
            } catch {
                if (!cancelled) {
                    setLoadError("Could not reach the game server.")
                }
            }
        }

        loadRooms()
        const interval = setInterval(loadRooms, REFRESH_INTERVAL_MS)

        return () => {
            cancelled = true
            clearInterval(interval)
        }
    }, [])

    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-4">
            <div className="flex flex-col items-center gap-1">
                <h1 className="text-2xl font-semibold">Blackjack Rooms</h1>
                <p className="text-sm text-muted-foreground">
                    Pick a table to join. Everyone in a room plays the same game.
                </p>
            </div>

            {loadError && (
                <p className="text-sm text-destructive">{loadError}</p>
            )}

            <div className="flex flex-wrap items-stretch justify-center gap-4">
                {(rooms.length > 0
                    ? rooms
                    : [1, 2, 3].map((n) => ({ roomId: `room-${n}`, playerCount: 0 }))
                ).map((room, index) => (
                    <Card key={room.roomId} className="w-56">
                        <CardHeader>
                            <CardTitle>Table {index + 1}</CardTitle>
                            <CardDescription>
                                {room.playerCount === 1
                                    ? "1 player seated"
                                    : `${room.playerCount} players seated`}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">
                                Public table · no join code needed
                            </p>
                        </CardContent>
                        <CardFooter>
                            <Button asChild className="w-full">
                                <Link href={`/gameroom?room=${room.roomId}`}>
                                    Join table
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}
