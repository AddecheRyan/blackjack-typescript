import express from "express";
import { createServer, IncomingMessage } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { jwtVerify } from "jose";
import { ClientMessage } from "@blackjack/shared";
import { Room, RoomManager } from "./rooms.js";

try {
  process.loadEnvFile();
} catch {
  // no .env file; rely on environment variables set elsewhere
}

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET is not set - it must match the frontend's session secret");
}
const encodedKey = new TextEncoder().encode(sessionSecret);

const manager = new RoomManager();

const app = express();
app.use(express.json());

// the Next.js frontend runs on a different port, so allow cross-origin reads
app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/rooms", (_req, res) => {
  res.json({ rooms: manager.summaries() });
});

const server = createServer(app);
const wss = new WebSocketServer({ noServer: true });

function parse_cookies(header: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;

  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    const name = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    cookies[name] = decodeURIComponent(value);
  }
  return cookies;
}

async function authenticate(req: IncomingMessage): Promise<string | null> {
  const token = parse_cookies(req.headers.cookie)["session"];
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, encodedKey, { algorithms: ["HS256"] });
    const username = payload.username;
    return typeof username === "string" && username.length > 0 ? username : null;
  } catch {
    return null;
  }
}

server.on("upgrade", async (req, socket, head) => {
  const username = await authenticate(req);
  if (username === null) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req, username);
  });
});

wss.on("connection", (ws: WebSocket, _req: IncomingMessage, username: string) => {
  console.log(`client connected: ${username}`);

  let currentRoom: Room | null = null;

  ws.on("message", (data) => {
    let message: ClientMessage;
    try {
      message = JSON.parse(data.toString());
    } catch {
      ws.send(JSON.stringify({ type: "error", message: "invalid JSON" }));
      return;
    }

    switch (message.type) {
      case "join_room": {
        const room = manager.get_room(message.roomId);
        if (room === null) {
          ws.send(JSON.stringify({ type: "error", message: `unknown room: ${message.roomId}` }));
          return;
        }
        if (currentRoom !== null && currentRoom !== room) {
          currentRoom.leave(username);
        }
        currentRoom = room;
        room.join(username, ws);
        break;
      }
      case "place_bet":
        currentRoom?.place_bet(username, message.amount);
        break;
      case "hit":
        currentRoom?.player_action(username, "HIT");
        break;
      case "stand":
        currentRoom?.player_action(username, "STAND");
        break;
      case "double_down":
        currentRoom?.player_action(username, "DOUBLE_DOWN");
        break;
      case "leave_room":
        currentRoom?.leave(username);
        currentRoom = null;
        break;
      default:
        ws.send(JSON.stringify({ type: "error", message: "unknown message type" }));
    }
  });

  ws.on("close", () => {
    console.log(`client disconnected: ${username}`);
    // only remove the player if this socket is still the one registered for
    // them (a reconnect replaces the socket, and the old close must not kick them)
    if (currentRoom !== null && currentRoom.sockets.get(username) === ws) {
      currentRoom.leave(username);
    }
  });
});

const PORT = process.env.PORT ?? 4000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
