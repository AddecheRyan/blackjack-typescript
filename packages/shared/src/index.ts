export type Suit = "s" | "h" | "d" | "c"

export type Card = {
    rank: string
    suit: string
}

export type Player = {
    id: string
    name: string
    cards: Card[]
    score: number
    bet: number
    isActive: boolean
}

export type GameStatus = "idle" | "betting" | "playing" | "dealer-turn" | "finished"