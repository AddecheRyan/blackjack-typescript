"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, GamePhase } from "@blackjack/shared"
import { useGameSocket } from "@/hooks/useGameSocket"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const PHASE_LABELS: Record<GamePhase, string> = {
    "waiting": "Waiting for players…",
    "betting": "Place your bets",
    "playing": "Round in progress",
    "dealer-turn": "Dealer is playing",
    "settlement": "Round over",
}

const RANK_NAMES: Record<string, string> = {
    J: "jack",
    Q: "queen",
    K: "king",
    A: "ace",
}

const SUIT_NAMES: Record<string, string> = {
    s: "spades",
    h: "hearts",
    d: "diamonds",
    c: "clubs",
}

function cardImageSrc(card: Card): string {
    const rank = RANK_NAMES[card.rank] ?? card.rank
    const suit = SUIT_NAMES[card.suit]
    return `/SVG-cards-1.3/${rank}_of_${suit}.svg`
}

function renderCards(cards: Card[]) {
    if (cards.length === 0) {
        return <span className="text-sm text-muted-foreground">No cards</span>
    }

    return cards.map((card, index) =>
        card.rank === "?" ? (
            <img
                key={`back-${index}`}
                src="/SVG-cards-1.3/back.svg"
                alt="Face-down card"
                className="h-24 w-16 rounded-md shadow-sm"
            />
        ) : (
            <img
                key={`${card.rank}-${card.suit}-${index}`}
                src={cardImageSrc(card)}
                alt={`${card.rank} of ${SUIT_NAMES[card.suit]}`}
                className="h-24 w-16 rounded-md shadow-sm"
            />
        )
    )
}

function Gameroom() {
    const searchParams = useSearchParams()
    const roomId = searchParams.get("room") ?? "room-1"

    const {
        connected,
        playerId,
        roomState,
        roundResults,
        error,
        placeBet,
        hit,
        stand,
        doubleDown,
    } = useGameSocket(roomId)

    const [betInput, setBetInput] = useState("")

    const me = roomState?.players.find((p) => p.id === playerId) ?? null
    const isMyTurn = roomState?.currentPlayerId === playerId
    const phase = roomState?.phase ?? "waiting"
    const myResult = roundResults?.find((r) => r.playerId === playerId) ?? null

    function handleBet(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const amount = Number(betInput)
        if (Number.isInteger(amount) && amount > 0) {
            placeBet(amount)
            setBetInput("")
        }
    }

    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
            {/* Status banner */}
            <div className="flex w-1/2 items-center justify-between">
                <span className="text-sm font-medium">
                    {roomId} ·{" "}
                    {connected ? PHASE_LABELS[phase] : "Connecting…"}
                </span>
                {me && (
                    <span className="text-sm text-muted-foreground">
                        {me.name} · Chips: {me.chips}
                    </span>
                )}
            </div>

            {error && (
                <div className="w-1/2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                </div>
            )}

            {phase === "settlement" && myResult && (
                <div className="w-1/2 rounded-md border bg-accent/40 px-3 py-2 text-sm">
                    {myResult.net > 0
                        ? `You won ${myResult.net} chips!`
                        : myResult.net < 0
                        ? `You lost ${-myResult.net} chips.`
                        : "Push - your bet was returned."}{" "}
                    Next round starts shortly…
                </div>
            )}

            {/* Table */}
            <div className="flex h-[66vh] w-1/2 flex-col justify-between rounded-xl border bg-muted/30 p-6 shadow-lg">
                {/* Dealer section */}
                <div className="flex flex-col items-center gap-3">
                    <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Dealer
                    </span>

                    <div className="flex min-h-24 items-center justify-center gap-2">
                        {renderCards(roomState?.dealerCards ?? [])}
                    </div>
                    <span className="text-xs text-muted-foreground">
                        Score: {roomState?.dealerScore ?? 0}
                    </span>
                </div>

                {/* Players section */}
                <div className="flex items-end justify-center gap-6 overflow-x-auto">
                    {!roomState || roomState.players.length === 0 ? (
                        <div className="flex flex-col items-center gap-3">
                            <div className="flex min-h-24 items-center justify-center gap-2">
                                {renderCards([])}
                            </div>
                            <span className="text-sm text-muted-foreground">
                                Waiting for players…
                            </span>
                        </div>
                    ) : (
                        roomState.players.map((player) => (
                            <div
                                key={player.id}
                                className={`flex flex-col items-center gap-3 rounded-lg p-3 ${
                                    player.isActive ? "bg-accent/50" : ""
                                }`}
                            >
                                <div className="flex min-h-24 items-center justify-center gap-2">
                                    {renderCards(player.cards)}
                                </div>
                                <span className="text-sm font-medium">
                                    {player.name}
                                    {player.id === playerId ? " (you)" : ""}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    Score: {player.score} · Bet:{" "}
                                    {player.hasBet ? player.bet : "—"} · Chips:{" "}
                                    {player.chips}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Action bar */}
            <div className="flex w-1/2 min-h-10 items-center justify-center gap-3">
                {phase === "betting" && me && !me.hasBet && (
                    <form onSubmit={handleBet} className="flex items-center gap-2">
                        <Input
                            type="number"
                            min={1}
                            max={me.chips}
                            step={1}
                            placeholder={`Bet (1-${me.chips})`}
                            value={betInput}
                            onChange={(e) => setBetInput(e.target.value)}
                            className="w-36"
                        />
                        <Button type="submit" disabled={!connected}>
                            Place bet
                        </Button>
                    </form>
                )}

                {phase === "betting" && me?.hasBet && (
                    <span className="text-sm text-muted-foreground">
                        Bet placed. Waiting for the other players…
                    </span>
                )}

                {phase === "playing" && (
                    <>
                        <Button onClick={hit} disabled={!isMyTurn}>
                            Hit
                        </Button>
                        <Button onClick={stand} disabled={!isMyTurn} variant="secondary">
                            Stand
                        </Button>
                        <Button
                            onClick={doubleDown}
                            disabled={
                                !isMyTurn ||
                                !me ||
                                me.cards.length !== 2 ||
                                me.chips < me.bet * 2
                            }
                            variant="outline"
                        >
                            Double down
                        </Button>
                        {!isMyTurn && (
                            <span className="text-sm text-muted-foreground">
                                {me && !me.hasBet
                                    ? "You'll join at the next round."
                                    : "Waiting for your turn…"}
                            </span>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default function GameroomPage() {
    return (
        <Suspense fallback={null}>
            <Gameroom />
        </Suspense>
    )
}
