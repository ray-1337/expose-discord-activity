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

ws.on("open", () => {
  let identifyRequest = JSON.stringify({op: config.OP.identify, d: config.Identification});
  let heartbeat = JSON.stringify({op: config.OP.heartbeat, d: config.Constants.seq}); // i'll figure it out.

  // identification
  ws.send(identifyRequest, (err) => console.error(err));

  // heartbeat, to stay connected.
  setInterval(() => ws.send(heartbeat), config.Constants.heartbeatTimeout);
});

ws.on("message", (raw) => {
  // rawWS is made out of Buffer. so you have to convert it into JSON. devhuman-readable.
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

  // Ready
  if (data.t === "READY" && data.op === config.OP.dispatch) {
    config.Constants.sessionID = data.d.session_id;
    console.log("ready.");
  };

  // Resuming when Disconnection happens (WIP, may broke, because it's untested.)
  if (data.op === config.OP.resume) {
    console.log("resuming.");
    ws.send(JSON.stringify({
      op: config.OP.resume,
      d: {
        token: config.Identification.token,
        session_id: config.Constants.sessionID,
        seq: config.Constants.seq
      }
    }));
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

ws
.on("error", console.error)
.on("close", console.log);