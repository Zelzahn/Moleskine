// const Discord = require('discord.js');
// const client = new Discord.Client();
const { CommandoClient } = require("discord.js-commando");
const path = require("path");

const config = require("./config.json");

const client = new CommandoClient({
  commandPrefix: config.prefix,
  owner: config.ownerid,
});

client.registry
  .registerDefaultTypes()
  .registerDefaultGroups()
  .registerGroups([["general", "General commands"]])
  .registerDefaultCommands()
  .registerCommandsIn(path.join(__dirname, "commands"));

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}! (${client.user.id})`);
  client.user.setPresence({
    activity: { name: "for help", type: "WATCHING" },
    status: "online",
  });
});

client.on("error", console.error);

client.login(config.token);
