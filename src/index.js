import { CommandoClient } from "discord.js-commando";
import { join } from "path";
import winston, { format } from "winston";
import { token } from "../config";
import { getSetting } from "./database/mongo";

export const logger = winston.createLogger({ exitOnError: false });

if (process.env.NODE_ENV !== "development") {
  logger.add(
    new winston.transports.File({
      filename: "moleskine.log",
      format: format.combine(
        format.timestamp(),
        format.align(),
        format.printf(
          (log) => `${log.timestamp} : [${log.level}] ${log.message}`
        )
      ),
    })
  );
}

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: format.combine(
        format.align(),
        format.colorize(),
        format.printf((log) => {
          const stringifiedRest = JSON.stringify(
            Object.assign({}, log, {
              level: undefined,
              message: undefined,
              splat: undefined,
            })
          );

          if (stringifiedRest !== "{}")
            return `[${log.level}] ${stringifiedRest}`;
          else return `[${log.level}] ${log.message}`;
        })
      ),
    })
  );
}

(async () => {
  const prefix = await getSetting("prefix");
  const owners = await getSetting("owners");

  const client = new CommandoClient({
    commandPrefix: prefix,
    owner: owners,
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
})().catch((e) => {
  logger.log("error", e);
});
