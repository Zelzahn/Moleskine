// const Discord = require('discord.js');
// const client = new Discord.Client();
import { CommandoClient } from "discord.js-commando";
import { join } from "path";

import { prefix, ownerid, token } from "../config.json";

const logger = winston.createLogger({
  transports: [
    // new winston.transports.Console(),
    new winston.transports.File({ filename: "log" }),
  ],
  format: winston.format.printf(
    (log) => `[${log.level.toUpperCase()}] - ${log.message}`
  ),
});

if (process.env.NODE_ENV !== "production") {
  logger.add(new winston.transports.Console());
}

const client = new CommandoClient({
  commandPrefix: prefix,
  owner: ownerid,
});

client.registry
  .registerDefaultTypes()
  .registerDefaultGroups()
  .registerGroups([["general", "General commands"]])
  .registerGroups([["management", "Commands to manage the bot"]])
  .registerDefaultCommands()
  .registerCommandsIn(join(__dirname, "commands"));

client.once("ready", () => {
  logger.log(`Logged in as ${client.user.tag}! (${client.user.id})`);
  client.user.setPresence({
    activity: { name: "for help", type: "WATCHING" },
    status: "online",
  });
});

client.on("warn", (m) => logger.log("warn", m));
client.on("error", (m) => logger.log("error", m));

process.on("uncaughtException", (error) => logger.log("error", error));

client.login(token);
