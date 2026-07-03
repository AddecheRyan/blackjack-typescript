import { Card } from "@blackjack/shared";

const cardValues: Record<string, number> = {};
cardValues['2'] = 2;
cardValues['3'] = 3;
cardValues['4'] = 4;
cardValues['5'] = 5;
cardValues['6'] = 6;
cardValues['7'] = 7;
cardValues['8'] = 8;
cardValues['9'] = 9;
cardValues['10'] = 10;
cardValues['J'] = 10;
cardValues['Q'] = 10;
cardValues['K'] = 10;
cardValues['A'] = 11;

export function draw(deck: Card[]): Card | null {

    if (deck == null || deck.length <= 0) {
        console.log("invalid usage of draw()")
        return null;
    }

    if (deck.length <= 0) {
        console.log("ERROR: draw(player, deck) in game_logic.js called when deck is empty!");
        return null;
    }

    return deck.pop() ?? null;
}

export function hand_value(hand: Card[]): number {
    let total = 0;
    let aces = 0;

    for (let card of hand) {
        let value = cardValues[card.rank];
        total += value; // get value from map at the top of the js file.
        if (card.rank === 'A') aces++;
    }

    while (total > 21 && aces > 0) {
        total -= 10; // revert aces to 1 incrementally if were over.
        aces--;
    }

    return total;
}

export function is_bust(hand_value: number): boolean {
    return hand_value > 21;
}

export function is_win(hand_value: number): boolean {
    return hand_value === 21
}

// Hit = take another card from the deck

// Stand= end your turn without taking more card. Your current hand total is final.

// Double Down = at the start of your turn (after the first 2 cards).
// double your bet and draw exactly one more card

// atomic for each individual player between the dealer.
export function resolve_hand(
    player_hand: Card[],
    dealer_hand: Card[],
    bet: number,
    double_down: boolean = false,
): number {

    let result_mult = 0

    let double_down_multiplier = double_down ? 2 : 1;  // double down doubles bet

    let player_hand_value = hand_value(player_hand);
    let player_busted = is_bust(player_hand_value);

    // special dealer win.
    if (player_busted) { // dealer has an advantage in that if the player busted, they win automatically regardless.
        result_mult = -1
        console.log("player busted, they lose!")
        return bet * result_mult * double_down_multiplier;
    }

    let dealer_hand_value = hand_value(dealer_hand);
    let dealer_busted = is_bust(dealer_hand_value);

    // special blackjack victory condition.
    if (player_hand_value === 21 && player_hand.length === 2 && dealer_hand_value !== 21) {
        result_mult = 1.5
        console.log("player got a nat blackjack, they win big!")
        return bet * result_mult * double_down_multiplier;
    }

    if (dealer_busted) { // if the dealer busted, grant victory to the player.
        console.log("player wins, dealer busted!")
        result_mult = 1
    } else { // compare deck values to determine winner
        console.log("win decided by bigger hand!")
        result_mult = player_hand_value > dealer_hand_value ? 1 //players got a bigger hand
            : player_hand_value < dealer_hand_value ? -1 // player has smaller hand
            : 0; // tie
    }

    return bet * result_mult * double_down_multiplier;
}