// const Discord = require('discord.js');
// const client = new Discord.Client();
import { CommandoClient } from "discord.js-commando";
import { join } from "path";

import { prefix, ownerid, token } from "../config.json";

const client = new CommandoClient({
  commandPrefix: prefix,
  owner: ownerid,
});

client.registry
  .registerDefaultTypes()
  .registerDefaultGroups()
  .registerGroups([["general", "General commands"]])
  .registerDefaultCommands()
  .registerCommandsIn(join(__dirname, "commands"));

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}! (${client.user.id})`);
  client.user.setPresence({
    activity: { name: "for help", type: "WATCHING" },
    status: "online",
  });
});

client.on("error", console.error);

client.login(token);
