const RPC = require("discord-rpc");
const http = require("http");
const { Server } = require("socket.io");

const CLIENT_ID = "1420442078227333151";
const LARGE_IMAGE_KEY = "cloud2gether_logo";
const PORT = 5000;

if (!CLIENT_ID) {
  console.error("No DISCORD_CLIENT_ID set");
  process.exit(1);
}

const rpc = new RPC.Client({ transport: "ipc" });

function setListeningActivity({ title, artist} = {}) {
  rpc.setActivity({
    details: `Listening : ${title}`,
    state: artist ? `by ${artist}` : "",
    largeImageKey: LARGE_IMAGE_KEY,
    startTimestamp: Date.now()
  }).catch(e => console.error("setActivity error:", e.message));
}

rpc.on("ready", () => {
  console.log("Discord RPC connected");
  setListeningActivity({});
});

rpc.login({ clientId: CLIENT_ID }).catch(err => {
  console.error("RPC login failed:", err.message);
  console.log("Make sure Discord desktop client is running.");
});

// Local socket server
const server = http.createServer();
const io = new Server(server, {
  cors: { origin: "http://localhost:5173", credentials: false }
});

io.on("connection", socket => {
  console.log("RPC socket client:", socket.id);

  socket.on("updatePresence", data => {
    setListeningActivity(data);
    socket.emit("presenceAck", { ok: true });
  });

  socket.on("clearPresence", () => {
    setListeningActivity({});
  });
});

server.listen(PORT, () =>
  console.log(`RPC helper listening http://localhost:${PORT}`)
);

process.on("SIGINT", () => {
  console.log("Shutting down RPC helper...");
  rpc.destroy();
  process.exit(0);
});