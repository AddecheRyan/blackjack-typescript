import { Card } from "@blackjack/shared";

export default function create_deck(): Card[] {

    // in cards, there are 4 "suits"
    const suits = ['s', 'h', 'd', 'c'];

    // in cards, there are 13 values
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

    // NOTE:
    // aces are special in this game in that they are either 11 or 1, whichever works in your favor
    // staying under 21

    let deck: Card[] = [];

    // make all possible cards
    for (let suit of suits) {
        for (let rank of ranks) {
            const card: Card = { rank, suit };
            deck.push(card);
        }
    }

    //https://www.programiz.com/javascript/examples/shuffle-card
    // shuffle the deck
    // https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
    // 0-51 (52 cards)
    for (let i = 51; i > 0; i--) {
        let j = Math.floor(Math.random()* i);
        let temp: Card = deck[i];
        deck[i] = deck[j];
        deck[j] = temp;
    }

    return deck;

}