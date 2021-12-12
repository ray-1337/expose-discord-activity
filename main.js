const WebSocket = require("ws");
const config = require("./config");
const Redis = require("redis");
const ws = new WebSocket(`wss://gateway.discord.gg/?v=${config.Gateway.v}&encoding=json`);
require("dotenv").config();

const identification = {
  token: process.env.SECRET, // your bot token.
  v: config.Gateway.v,
  intents: 1 << 0 | 1 << 8 | 1 << 1 | 1 << 9, // https://abal.moe/Eris/docs/0.16.1/reference
  properties: {
    "$os": process.platform,
    "$browser": "EXPOSE_ACTIVITIES",
    "$device": "13373333"
  }
};

// ======================================== REMOVE THIS SECTION BELOW IF UNNEEEDED.
const redis = Redis.createClient({
  socket: {
    host: process.env["REDISENDPOINT"],
    port: Number(process.env["REDISPORT"]),
  },
  password: process.env["REDISPASS"]
});

redis
.on("ready", () => console.log("Redis: Ready."))
.on("error", (err) => console.error(`Redis (Error): ${err}`))
.on("warning", (x) => console.warn(`Redis (Warning): ${x}`))
.connect();
// ======================================== REMOVE THIS SECTION ABOVE IF UNNEEEDED.

let seq = 12; // what?

ws.on("open", () => {
  let identifyRequest = JSON.stringify({op: config.OP.identify, d: identification});
  let heartbeat = JSON.stringify({op: config.OP.heartbeat, d: seq}); // i'll figure it out.

  // identification
  ws.send(identifyRequest, (err) => console.error(err));

  // heartbeat, stay connected (?)
  setInterval(() => ws.send(heartbeat), config.Constants.heartbeatTimeout);
});

ws.on("message", (raw) => {
  // rawWS is made out of Buffer. so you have to convert it into JSON. devhuman-readable.
  let data = JSON.parse(Buffer.from(raw).toString("utf-8"));

  // its your choice.
  // my strategy is to store my own activity on Redis. but you can do your own.
  // like store it on some API, i dont know.
  if (data.t === "PRESENCE_UPDATE" && data.op === config.OP.dispatch) {
    return redis.set("activity.ray1337", JSON.stringify(data.d)).catch(console.error);
  };
});

ws.on("error", console.error);
ws.on("close", console.log);