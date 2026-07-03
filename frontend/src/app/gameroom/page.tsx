"use client"

import { useRef, useState } from "react"
import { Card, Player, Suit, GameStatus } from "@blackjack/shared"

export default function GameroomPage() {
    const [dealerCards, setDealerCards] = useState<Card[]>([])
    const [dealerScore, setDealerScore] = useState<number>(0)

    const [players, setPlayers] = useState<Player[]>([])
    const [currentPlayerId, setCurrentPlayerId] = useState<string>("")

    const [status, setStatus] = useState<GameStatus>("idle")
    const [deck, setDeck] = useState<Card[]>([])
    const [pot, setPot] = useState<number>(0)

    const tableRef = useRef<HTMLDivElement>(null)

    function renderCards(cards: Card[]) {
        if (cards.length === 0) {
            return <span className="text-sm text-muted-foreground">No cards</span>
        }

        return cards.map((card, index) => (
            <div
                key={`${card.rank}-${card.suit}-${index}`}
                className="flex h-24 w-16 items-center justify-center rounded-md border bg-card text-card-foreground shadow-sm"
            >
                <span className="text-sm font-medium">
                    {card.rank} {card.suit}
                </span>
            </div>
        ))
    }

    return (
        <div className="flex flex-1 items-center justify-center p-4">
            {/* Dealer section */}
            <div
                ref={tableRef}
                className="flex h-[66vh] w-1/2 flex-col justify-between rounded-xl border bg-muted/30 p-6 shadow-lg"
            >
                <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                            Dealer
                        </span>
                    </div>

                    <div className="flex min-h-24 items-center justify-center gap-2">
                        {renderCards(dealerCards)}
                    </div>
                    <span className="text-xs text-muted-foreground">
                        Score: {dealerScore}
                    </span>
                </div>

                {/* Players section */}
                <div className="flex items-end justify-center gap-6 overflow-x-auto">
                    {players.length === 0 ? (
                        <div className="flex flex-col items-center gap-3">
                            <div className="flex min-h-24 items-center justify-center gap-2">
                                {renderCards([])}
                            </div>
                            <span className="text-sm text-muted-foreground">
                                Waiting for players…
                            </span>
                        </div>
                    ) : (
                        players.map((player) => (
                            <div
                                key={player.id}
                                className={`flex flex-col items-center gap-3 rounded-lg p-3 ${
                                    player.id === currentPlayerId
                                        ? "bg-accent/50"
                                        : ""
                                }`}
                            >
                                {/* Player's cards */}
                                <div className="flex min-h-24 items-center justify-center gap-2">
                                    {renderCards(player.cards)}
                                </div>
                                <span className="text-sm font-medium">
                                    {player.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    Score: {player.score} · Bet: {player.bet}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
