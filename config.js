require("dotenv").config();

module.exports = {
  OP: {
    // i only store the important opcodes only.
    // https://discord.com/developers/docs/topics/opcodes-and-status-codes
    dispatch: 0,
    heartbeat: 1,
    identify: 2,
    resume: 6
  },

  Constants: {
    // i still have no idea.
    // dont change this unless you know what you're doing.
    seq: 1337,
    heartbeatTimeout: 1000 * 30,

    // https://www.remote.tools/remote-work/how-to-find-discord-id
    userMonitoredID: "331265944363991042"
  }
};

module.exports.Identification = {
  token: process.env.SECRET, // your bot token.
  v: 9, // https://discord.com/developers/docs/topics/gateway#gateways-gateway-versions
  intents: 1 << 0 | 1 << 1 | 1 << 8 | 1 << 9, // https://discord.com/developers/docs/topics/gateway#list-of-intents
  properties: {
    "$os": process.platform,
    "$browser": "EXPOSE_ACTIVITIES",
    "$device": "13373333"
  }
}