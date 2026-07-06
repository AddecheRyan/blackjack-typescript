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
    chips: number
    hasBet: boolean
    isActive: boolean
}


export type GamePhase = "waiting" | "betting" | "playing" | "dealer-turn" | "settlement"

export type RoomState = {
    roomId: string
    phase: GamePhase
    players: Player[]
    dealerCards: Card[]
    dealerScore: number
    currentPlayerId: string | null
}

export type RoomSummary = {
    roomId: string
    playerCount: number
}

export type RoundResult = {
    playerId: string
    net: number
    chips: number
}

export type ClientMessage =
    | { type: "join_room"; roomId: string }
    | { type: "place_bet"; amount: number }
    | { type: "hit" }
    | { type: "stand" }
    | { type: "double_down" }
    | { type: "leave_room" }

export type ServerMessage =
    | { type: "joined"; playerId: string; roomId: string }
    | { type: "room_state"; state: RoomState }
    | { type: "round_result"; results: RoundResult[] }
    | { type: "error"; message: string }
    | { type: "rooms_list"; rooms: RoomSummary[] }
