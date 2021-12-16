const WebSocket = require("ws");
const config = require("./config");

// supported non-browser (for Server-side) only.
const ws = new WebSocket(`wss://gateway.discord.gg/?v=${config.Identification.v}&encoding=json`);

// ========================================================== REMOVE THIS SECTION BELOW IF UNNEEDED.
const redis = require("redis").createClient({
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
// ========================================================== REMOVE THIS SECTION ABOVE IF UNNEEDED.

let identifyRequest = JSON.stringify({op: config.OP.identify, d: config.Identification});
let heartbeat = JSON.stringify({op: config.OP.heartbeat, d: config.Constants.seq});

ws.on("open", () => {
  // identification
  ws.send(identifyRequest);

  // heartbeat, to stay connected.
  config.Constants.heartbeatInterval = setInterval(() => ws.send(heartbeat), config.Constants.heartbeatTimeout);
});

ws.on("message", (raw) => {
  // raw Websocket data is made out of Buffer. so you have to convert it into JSON. devhuman-readable.
  let data;
  try {
    data = JSON.parse(Buffer.from(raw).toString("utf-8"));
  } catch (err) {
    data = null;
    return console.error(err);
  };

  // failed parsing the JSON, well just break it.
  if (!data) return;
  // console.log(data);

  switch(data.op) {
    case config.OP.dispatch:
      if (data.t === "READY") {
        config.Constants.sessionID = data.d.session_id;
        console.log("ready.");
      };
      break;

    case config.OP.heartbeat:
      console.log("heartbeat.");
      ws.send(heartbeat);
      break;
    
    case config.OP.invalidSession:
      console.warn("invalid session, identifying.");
      config.Constants.seq = 0;
      config.Constants.sessionID = null;
      ws.send(identifyRequest);
      break;

    case config.OP.reconnect:
      if (!ws) return;

      clearInterval(config.Constants.heartbeatInterval);
      config.Constants.heartbeatInterval = null;

      if (ws.readyState !== ws.CLOSED /*&& ws.readyState !== ws.CLOSING*/) {
        try {
          if (config.Constants.sessionID) {
            if (ws.readyState === ws.OPEN) ws.close(4901, "reconnect.");
            else ws.terminate();
          } else ws.close(1000, "continue.");
        } catch (error) {
          console.error(error);
        };
      };

      ws = null;
      break;

    case config.OP.HELLO:
      if (data.d.heartbeat_interval > 0) {
        if (config.Constants.heartbeatInterval) clearInterval(config.Constants.heartbeatInterval);
        config.Constants.heartbeatInterval = setInterval(() => ws.send(heartbeat), data.d.heartbeat_interval);
      };

      if (config.Constants.sessionID) {
        console.log("resuming the connection.");
        ws.send(JSON.stringify({
          op: config.OP.resume,
          d: {
            token: config.Identification.token,
            session_id: config.Constants.sessionID,
            seq: config.Constants.seq
          }
        }));
      } else {
        ws.send(identifyRequest);
        ws.send(heartbeat);
      };
      break;
    
    default:
      console.log(data);
      break;
  };

  /* 
    its your choice.
    my strategy here is to store my own activity on Redis. but you can do your own.
    like store it to your API, database on MongoDB, i dont know.
  */

  if (
    data.t === "PRESENCE_UPDATE" &&
    data.d.user.id === config.Constants.userMonitoredID &&
    data.op === config.OP.dispatch
    ) {
      // for lurking
      // console.log(require("util").inspect(data, false, null, false));

      let result = JSON.stringify(data.d);

      return redis.set("activity.ray1337", result)
      .catch(console.error);
  };
});

ws.on("error", console.error);

ws.on("close", (code, reason) => {
  console.log(code, Buffer.from(reason).toString());
});