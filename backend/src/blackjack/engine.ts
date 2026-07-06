import { Card, GamePhase, RoomState, RoundResult } from "@blackjack/shared";
import create_deck from "./deck.js";
import { draw, hand_value, is_bust, resolve_hand } from "./scoring.js";

export const player_moves = Object.freeze({
    HIT: 0,
    STAND: 1,
    DOUBLE_DOWN: 2,
});

export type PlayerMove = (typeof player_moves)[keyof typeof player_moves];

export function parse_move(input: string): PlayerMove | null {
    input = input.trim().toUpperCase();

    switch(input) {
        case "HIT": return player_moves.HIT;
        case "STAND": return player_moves.STAND;
        case "DOUBLE_DOWN": return player_moves.DOUBLE_DOWN;
        default: return null;
    }
}

export type ActionResult = {
    ok: boolean;
    error?: string;
    // present when the action ended the round (dealer played and bets settled)
    round_results?: RoundResult[];
};

export class Player {
    id: string;
    name: string;
    hand: Card[];
    chips: number;
    bet: number;
    has_bet: boolean;
    ready_to_flip: boolean;
    double_down: boolean;
    has_gone: boolean;

    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
        this.hand = [];
        this.chips = 500;
        this.bet = 0;
        this.has_bet = false;
        this.ready_to_flip = false;
        this.double_down = false;
        this.has_gone = false;
    }

    flip_cards() {
        this.ready_to_flip = true;
    }

    reset() {
        this.ready_to_flip = false;
        this.double_down = false;
        this.has_gone = false;
        this.has_bet = false;
        this.bet = 0;
        this.hand = [];
    }

    give_card(deck: Card[]){
        let drawn_card = draw(deck);
        if (drawn_card == null) {
            throw new Error("invalid card drawn!")
        }
        this.hand.push(drawn_card);
    }

    set_bet(number: number | string){
        const bet = Number(number);
        if (!Number.isInteger(bet)) {
            throw new Error(`ERROR - adjust_chips expects integer | inputted: ${bet}`);
        }
        this.bet = bet;
    }

    adjust_chips(number: number) {
        this.chips += number;
    }

    is_ready_to_flip() {
        return this.ready_to_flip
    }

    allow_new_turn(){
        this.has_gone = false;
    }

    can_play_this_turn(){
        return !this.has_gone;
    }

    // return false if invalid move, return true if valid move.
    make_move(deck: Card[], move_type: PlayerMove): boolean {

        switch (move_type) {

            case player_moves.HIT: {
                this.give_card(deck);

                let value = hand_value(this.hand)
                console.log(`${this.name} hits and now has ${value}`);

                this.has_gone = true; // user has had a turn

                if (is_bust(value)) { // cannot do anything after busting
                    this.flip_cards();
                }

                return true;
            }

            case player_moves.STAND:
                this.flip_cards();

                console.log(`${this.name} stands at ${hand_value(this.hand)}`);

                this.has_gone = true; // user has had a turn

                return true;

            case player_moves.DOUBLE_DOWN:

                if (this.hand.length !== 2) {
                    console.log("user cannot double down, error")
                    return false;
                }

                this.double_down = true;

                this.give_card(deck);

                console.log(`${this.name} doubles down and now has ${hand_value(this.hand)}`);

                this.flip_cards(); // ends user's run

                this.has_gone = true; // user has had a turn.

                return true;

            default:
                throw new Error(`Invalid move: ${move_type}`);
        }

    }
}

export class Dealer {
    hand: Card[];
    ready_to_flip: boolean;

    constructor() {
        this.hand = [];
        this.ready_to_flip = false;
    }

    has_busted() {
        return hand_value(this.hand) > 21;
    }

    // draws while under 17, stands otherwise.
    // returns the move taken so callers can loop until STAND.
    dealer_decision(deck: Card[]): PlayerMove {
        const value = hand_value(this.hand);
        if (value < 17) {
            this.give_card(deck);
            return player_moves.HIT;
        } else {
            this.ready_to_flip = true;
            return player_moves.STAND;
        }
    }

    reset() {
        this.hand = [];
        this.ready_to_flip = false;
    }

    give_card(deck: Card[]){
        let drawn_card = draw(deck);
        if (drawn_card == null) {
            throw new Error("invalid card drawn!")
        }
        this.hand.push(drawn_card);
    }
}

// event-driven blackjack state machine.
// each client message maps to one method call (place_bet / player_action),
// and the game advances itself (dealer turn, settlement) when conditions are met.
export class BlackjackGame {
    phase: GamePhase;
    dealer: Dealer;
    deck: Card[];
    players: Player[];

    constructor(){
        this.phase = "waiting";
        this.dealer = new Dealer();
        this.deck = create_deck();
        this.players = [];
    }

    // players who are part of the current round (placed a bet before the deal)
    private in_round_players(): Player[] {
        return this.players.filter(p => p.has_bet);
    }

    get_player(id: string): Player | null {
        return this.players.find(p => p.id === id) ?? null;
    }

    add_player(id: string, name: string): Player {
        let existing = this.get_player(id);
        if (existing !== null) return existing;

        const player = new Player(id, name);
        this.players.push(player);

        if (this.phase === "waiting") {
            this.phase = "betting";
        }
        // if joining mid-round (playing/dealer-turn/settlement), the player
        // simply sits out: has_bet stays false so the turn queue skips them.
        return player;
    }

    // removes the player and advances the game if they were blocking it.
    remove_player(id: string): ActionResult {
        const player = this.get_player(id);
        if (player === null) return { ok: false, error: "player not in game" };

        this.players.splice(this.players.indexOf(player), 1);

        if (this.players.length === 0) {
            this.reset_game();
            this.phase = "waiting";
            return { ok: true };
        }

        if (this.phase === "betting") {
            this.maybe_deal();
            return { ok: true };
        }

        if (this.phase === "playing") {
            const results = this.advance_after_action();
            return { ok: true, round_results: results ?? undefined };
        }

        return { ok: true };
    }

    current_player(): Player | null {
        return this.players.find(p =>
            p.has_bet && !p.is_ready_to_flip() && p.can_play_this_turn()
        ) ?? null;
    }

    place_bet(id: string, amount: number): ActionResult {
        if (this.phase !== "betting") {
            return { ok: false, error: "bets can only be placed during the betting phase" };
        }

        const player = this.get_player(id);
        if (player === null) return { ok: false, error: "player not in game" };
        if (player.has_bet) return { ok: false, error: "bet already placed" };

        if (!Number.isInteger(amount) || amount <= 0) {
            return { ok: false, error: "bet must be a positive whole number" };
        }
        if (amount > player.chips) {
            return { ok: false, error: "bet exceeds available chips" };
        }

        player.set_bet(amount);
        player.has_bet = true;

        this.maybe_deal();
        return { ok: true };
    }

    // once every seated player has bet, deal and start play.
    private maybe_deal() {
        if (this.phase !== "betting") return;
        if (this.players.length === 0) return;
        if (!this.players.every(p => p.has_bet)) return;

        this.deal_initial_cards();
        this.phase = "playing";
    }

    player_action(id: string, move: PlayerMove): ActionResult {
        if (this.phase !== "playing") {
            return { ok: false, error: "no round in progress" };
        }

        const player = this.current_player();
        if (player === null || player.id !== id) {
            return { ok: false, error: "not your turn" };
        }

        if (move === player_moves.DOUBLE_DOWN && player.chips < player.bet * 2) {
            return { ok: false, error: "not enough chips to double down" };
        }

        const valid = player.make_move(this.deck, move);
        if (!valid) {
            return { ok: false, error: "invalid move" };
        }

        const results = this.advance_after_action();
        return { ok: true, round_results: results ?? undefined };
    }

    // after each action, either rotate to the next turn cycle or run the dealer
    // once every in-round player has finished (stood, busted, or doubled down).
    private advance_after_action(): RoundResult[] | null {
        if (this.phase !== "playing") return null;

        while (this.current_player() === null) {
            const still_playing = this.in_round_players().some(p => !p.is_ready_to_flip());
            if (!still_playing) {
                return this.run_dealer();
            }
            // give players who haven't finished another turn
            this.players.forEach(p => p.allow_new_turn());
        }
        return null;
    }

    // dealer draws to 17+, then all bets are settled.
    private run_dealer(): RoundResult[] {
        this.phase = "dealer-turn";

        while (this.dealer.dealer_decision(this.deck) !== player_moves.STAND) {
            console.log(`dealer draws, hand is worth ${hand_value(this.dealer.hand)}`);
        }

        const results: RoundResult[] = [];
        this.in_round_players().forEach(player => {
            const net = resolve_hand(player.hand, this.dealer.hand, player.bet, player.double_down);
            player.adjust_chips(net);
            results.push({ playerId: player.id, net, chips: player.chips });
        });

        this.phase = "settlement";
        return results;
    }

    // called (after a short delay) once settlement has been shown to players.
    start_new_round() {
        this.reset_game();
        this.phase = this.players.length > 0 ? "betting" : "waiting";
    }

    reset_game() {
        this.players.forEach(player => player.reset());
        this.deck = create_deck();
        this.dealer.reset();
    }

    deal_initial_cards() {
        this.in_round_players().forEach(player => {
            player.give_card(this.deck);
            player.give_card(this.deck);
        });
        this.dealer.give_card(this.deck);
        this.dealer.give_card(this.deck);
    }

    // serializable snapshot sent to clients. hides the dealer's hole card
    // until the dealer's turn, and never exposes the deck.
    to_room_state(roomId: string): RoomState {
        // a "current player" only makes sense while hands are being played
        const current = this.phase === "playing" ? this.current_player() : null;

        const hide_hole_card = this.phase === "playing" && this.dealer.hand.length >= 2;
        const visible_dealer_cards: Card[] = hide_hole_card
            ? [this.dealer.hand[0], { rank: "?", suit: "?" }]
            : [...this.dealer.hand];
        const dealer_score = hide_hole_card
            ? hand_value([this.dealer.hand[0]])
            : hand_value(this.dealer.hand);

        return {
            roomId,
            phase: this.phase,
            players: this.players.map(p => ({
                id: p.id,
                name: p.name,
                cards: p.hand,
                score: hand_value(p.hand),
                bet: p.bet,
                chips: p.chips,
                hasBet: p.has_bet,
                isActive: current !== null && current.id === p.id,
            })),
            dealerCards: visible_dealer_cards,
            dealerScore: dealer_score,
            currentPlayerId: current?.id ?? null,
        };
    }
}
