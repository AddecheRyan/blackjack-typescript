import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const server = createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("client connected");

  ws.on("message", (data) => {
    const message = JSON.parse(data.toString());
    console.log("received:", message);
    // route to your game logic here
  });

  ws.on("close", () => {
    console.log("client disconnected");
  });
});

const PORT = process.env.PORT ?? 4000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});