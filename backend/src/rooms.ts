import { WebSocket } from "ws";
import { RoomSummary, RoundResult, ServerMessage } from "@blackjack/shared";
import { ActionResult, BlackjackGame, parse_move } from "./blackjack/engine.js";

const ROOM_IDS = ["room-1", "room-2", "room-3"];
const NEW_ROUND_DELAY_MS = 5000;

export class Room {
    id: string;
    game: BlackjackGame;
    sockets: Map<string, WebSocket>;
    private new_round_timer: NodeJS.Timeout | null = null;

    constructor(id: string) {
        this.id = id;
        this.game = new BlackjackGame();
        this.sockets = new Map();
    }

    player_count(): number {
        return this.sockets.size;
    }

    join(playerId: string, ws: WebSocket) {
        // if the same user reconnects, close the stale socket and take its seat
        const existing = this.sockets.get(playerId);
        if (existing && existing !== ws && existing.readyState === WebSocket.OPEN) {
            existing.close();
        }

        this.sockets.set(playerId, ws);
        this.game.add_player(playerId, playerId);

        this.send(ws, { type: "joined", playerId, roomId: this.id });
        this.broadcast_state();
    }

    leave(playerId: string) {
        if (!this.sockets.has(playerId)) return;

        this.sockets.delete(playerId);
        const result = this.game.remove_player(playerId);
        this.after_action(result);
        this.broadcast_state();
    }

    place_bet(playerId: string, amount: number) {
        const result = this.game.place_bet(playerId, amount);
        this.report(playerId, result);
    }

    player_action(playerId: string, moveName: string) {
        const move = parse_move(moveName);
        if (move === null) {
            this.send_error(playerId, `invalid move: ${moveName}`);
            return;
        }
        const result = this.game.player_action(playerId, move);
        this.report(playerId, result);
    }

    private report(playerId: string, result: ActionResult) {
        if (!result.ok) {
            this.send_error(playerId, result.error ?? "invalid action");
            return;
        }
        this.after_action(result);
        this.broadcast_state();
    }

    // if the action ended the round, announce results and schedule the next round.
    private after_action(result: ActionResult) {
        if (!result.round_results) return;

        this.broadcast({ type: "round_result", results: result.round_results });
        this.schedule_new_round();
    }

    private schedule_new_round() {
        if (this.new_round_timer !== null) return;

        this.new_round_timer = setTimeout(() => {
            this.new_round_timer = null;
            this.game.start_new_round();
            this.broadcast_state();
        }, NEW_ROUND_DELAY_MS);
    }

    broadcast_state() {
        this.broadcast({ type: "room_state", state: this.game.to_room_state(this.id) });
    }

    private broadcast(message: ServerMessage) {
        const payload = JSON.stringify(message);
        for (const socket of this.sockets.values()) {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(payload);
            }
        }
    }

    private send_error(playerId: string, message: string) {
        const socket = this.sockets.get(playerId);
        if (socket) this.send(socket, { type: "error", message });
    }

    private send(ws: WebSocket, message: ServerMessage) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }
}

export class RoomManager {
    rooms: Map<string, Room>;

    constructor() {
        this.rooms = new Map(ROOM_IDS.map(id => [id, new Room(id)]));
    }

    get_room(id: string): Room | null {
        return this.rooms.get(id) ?? null;
    }

    summaries(): RoomSummary[] {
        return [...this.rooms.values()].map(room => ({
            roomId: room.id,
            playerCount: room.player_count(),
        }));
    }
}
