import { CommandoClient } from "discord.js-commando";
import { join } from "path";
import winston, { format } from "winston";
import { prefix, ownerid, token } from "../config.json";

// Logging levels used: error, warn, info
export const logger = winston.createLogger({
  transports: [new winston.transports.File({ filename: "moleskine.log" })],
  format: format.combine(
    format.timestamp(),
    format.align(),
    format.printf((log) => `${log.timestamp} : [${log.level}] ${log.message}`)
  ),
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: format.combine(
        format.timestamp(),
        format.align(),
        format.colorize(),
        format.printf(
          (log) => `${log.timestamp} : [${log.level}] ${log.message}`
        )
      ),
    })
  );
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
  logger.log("info", `Logged in as ${client.user.tag}! (${client.user.id})`);
  client.user.setPresence({
    activity: { name: "for help", type: "WATCHING" },
    status: "online",
  });
});

client.on("warn", (m) => logger.log("warn", m));
client.on("error", (m) => logger.log("error", m));

process.on("uncaughtException", (error) => logger.log("error", error));

client.login(token);
