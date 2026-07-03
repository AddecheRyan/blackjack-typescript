import { Card } from "@blackjack/shared";
import create_deck from "./deck.js";
import { draw, hand_value, is_bust, resolve_hand } from "./scoring.js";

const player_moves = Object.freeze({
    HIT: 0,
    STAND: 1,
    DOUBLE_DOWN: 2,
});

type PlayerMove = (typeof player_moves)[keyof typeof player_moves];

function parse_move(input: string): PlayerMove | null {
    input = input.trim().toUpperCase();

    switch(input) {
        case "HIT": return player_moves.HIT;
        case "STAND": return player_moves.STAND;
        case "DOUBLE_DOWN": return player_moves.DOUBLE_DOWN;
        default: return null; // invalid move
    }
}


// idea: make all user actions atomic so the server can handle each one independently easier.
class mock_user {
    name: string;
    hand: Card[];
    chips: number;
    bet: number;
    ready_to_flip: boolean;
    double_down: boolean;
    has_gone: boolean;

    constructor(name: string) {
        this.name = name;
        this.hand = [];
        this.chips = 500;
        this.bet = 0;
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

    player_has_played() {
        this.has_gone = true;
    }

    can_play_this_turn(){
        return !this.has_gone;
    }



    // return false if invalid move, return true if valid move.
    make_move(deck: Card[], move_type: PlayerMove): boolean {

        //Validate mov
        const allowedMoves = Object.values(player_moves);
        if (!allowedMoves.includes(move_type)) {
            console.log(`Invalid move: ${move_type}`);
            return false;
        }

        //execute desired move
        switch (move_type) {

            case player_moves.HIT: {
                this.give_card(deck);

                let value = hand_value(this.hand)
                console.log(`${this.name} hits and now has ${value}`);

                if (is_bust(hand_value(this.hand))) this.flip_cards(); // bust ends user's run

                this.has_gone = true; // user has had a turn

                if (is_bust(value)) { // cannot do anything after bustin
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

                this.double_down=true

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

class dealer {
    hand: Card[];
    ready_to_flip: boolean;

    constructor() {
        this.hand = [];
        this.ready_to_flip = false;
    }

    has_busted() {
        return hand_value(this.hand) > 21;
    }

    dealer_decision(deck: Card[]): PlayerMove {
        const value = hand_value(this.hand);
        if (value < 17) {
            console.log(`dealer draws}`);
            this.give_card(deck);
            return player_moves.HIT;
        } else {
            console.log(`dealer does not draw}`);
            this.ready_to_flip = true;
            return player_moves.STAND;
        }
    }

    reset() {
        this.hand = [];
    }

    give_card(deck: Card[]){
        let drawn_card = draw(deck);
        if (drawn_card == null) {
            throw new Error("invalid card drawn!")
        }
        this.hand.push(drawn_card);
    }

}

class blackjack_game {
    dealer: dealer;
    deck: Card[];
    turn_queue: mock_user[];
    round_over: boolean;

    constructor(){
        this.dealer = new dealer();
        this.deck = create_deck();
        this.turn_queue = [];
        this.round_over = false;
    }

    add_player(player: mock_user) {
        if (!this.turn_queue.includes(player)) {
            this.turn_queue.push(player);
        }
    }

    remove_player(player: mock_user) {
        // remove a player from the queue
        this.turn_queue = this.turn_queue.filter(p => p !== player);
    }

    current_player(): mock_user | null {
        // find a player who hasn't gone or flipped, if none are found just return null
        let result = this.turn_queue.find(player => !player.is_ready_to_flip() && player.can_play_this_turn()) || null;
        return result;
    }

    execute_move(moveType: string): boolean {
        const player = this.current_player();
        if (player === null) {
            console.log("no player available to make a move");
            return false;
        }
        let move = parse_move(moveType)
        if (move === null) {
            console.log(`invalid move: ${moveType}`);
            return false;
        }
        return player.make_move(this.deck, move);
    }

    prepare_new_turn() {
        this.turn_queue.forEach((player) => {
            player.allow_new_turn();
        });
    }

    reset_game() {
        this.turn_queue.forEach((player) => {
            player.reset();
        });
        this.deck = create_deck();
        this.dealer.reset();
    }


    deal_initial_cards() {
        //Give 2 cards to players
        this.turn_queue.forEach(player => {
            player.give_card(this.deck);
            player.give_card(this.deck);
        });
        // Give 2 to dealer
        this.dealer.give_card(this.deck);
        this.dealer.give_card(this.deck);
    }

    // game logic:
    // all players play then the dealer draws.
    // players can stand before others are done
    play_round(){

        let game_over = false

        this.turn_queue.forEach(player => {
            // temporary
            // let bet = readlineSync.question(`${player.name}, what is your bet:`);
            //player.set_bet(bet);
            // console.log(`${player.name} bet: ${bet}`);
            //temp
        });

        // dealing of first two cards
        this.deal_initial_cards();

        while (game_over === false) {

            // players take actions.
            while (this.current_player() !== null) { // while there are players who haven't taken a turn, keep going.
                let player = this.current_player();
                if (player === null) break;

                // temporary for debug.
                // console.log(`${player.name} current player: ${player.name}'s hand is worth: ${hand_value(player.hand)}`);

                // let move = readlineSync.question(`${player.name}, choose your move (HIT/STAND/DOUBLE_DOWN):`);
                // temporary

                //let valid = this.execute_move(move);

                player.player_has_played();

                // console.log(`${player.name} executed (Valid?: ${valid}) move: ${move}`);
            }

            // dealer makes a decision.
            while(this.dealer.dealer_decision(this.deck) !== player_moves.STAND) { // dealer can repeatedly draw.
                console.log(`dealer's hand is worth: ${hand_value(this.dealer.hand)}`)
            }
            // dealer AI has to forfeit if it ends up busting after the players go.
            if (this.dealer.has_busted()) {
                console.log("Dealer has busted! ending game!")
                game_over = true;
                break;
            }

            this.turn_queue.forEach(player => {
                player.allow_new_turn();
            });

            if (this.dealer.ready_to_flip === true && this.current_player() === null) {
                console.log("No turns remaining, checking results....")
                break;
            }

        }

        // resolve bets
        this.turn_queue.forEach(player => {
            let result = resolve_hand(player.hand, this.dealer.hand, player.bet, player.double_down);
            player.adjust_chips(result);
            console.log(`${player.name} chips net: ${result}`);
        });

        this.reset_game();


    }


}