"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
    ClientMessage,
    RoomState,
    RoundResult,
    ServerMessage,
} from "@blackjack/shared"

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:4000"
const RECONNECT_DELAY_MS = 2000

export function useGameSocket(roomId: string) {
    const [connected, setConnected] = useState(false)
    const [playerId, setPlayerId] = useState<string | null>(null)
    const [roomState, setRoomState] = useState<RoomState | null>(null)
    const [roundResults, setRoundResults] = useState<RoundResult[] | null>(null)
    const [error, setError] = useState<string | null>(null)

    const wsRef = useRef<WebSocket | null>(null)

    useEffect(() => {
        let cancelled = false
        let reconnectTimer: ReturnType<typeof setTimeout> | undefined

        function connect() {
            const ws = new WebSocket(WS_URL)
            wsRef.current = ws

            ws.onopen = () => {
                setConnected(true)
                setError(null)
                ws.send(JSON.stringify({ type: "join_room", roomId } satisfies ClientMessage))
            }

            ws.onmessage = (event) => {
                let message: ServerMessage
                try {
                    message = JSON.parse(event.data)
                } catch {
                    return
                }

                switch (message.type) {
                    case "joined":
                        setPlayerId(message.playerId)
                        break
                    case "room_state":
                        setRoomState(message.state)
                        setError(null)
                        // results from the last round are only relevant during settlement
                        if (message.state.phase === "betting" || message.state.phase === "playing") {
                            setRoundResults(null)
                        }
                        break
                    case "round_result":
                        setRoundResults(message.results)
                        break
                    case "error":
                        setError(message.message)
                        break
                }
            }

            ws.onclose = () => {
                setConnected(false)
                if (!cancelled) {
                    reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS)
                }
            }
        }

        connect()

        return () => {
            cancelled = true
            if (reconnectTimer !== undefined) clearTimeout(reconnectTimer)
            wsRef.current?.close()
            wsRef.current = null
        }
    }, [roomId])

    const send = useCallback((message: ClientMessage) => {
        const ws = wsRef.current
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message))
        }
    }, [])

    const placeBet = useCallback((amount: number) => send({ type: "place_bet", amount }), [send])
    const hit = useCallback(() => send({ type: "hit" }), [send])
    const stand = useCallback(() => send({ type: "stand" }), [send])
    const doubleDown = useCallback(() => send({ type: "double_down" }), [send])

    return {
        connected,
        playerId,
        roomState,
        roundResults,
        error,
        placeBet,
        hit,
        stand,
        doubleDown,
    }
}
