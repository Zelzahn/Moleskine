import { Command } from "discord.js-commando";
import { error } from "../../utils/printError";

export default class HelpCommand extends Command {
  constructor(client) {
    super(client, {
      name: "help",
      group: "general",
      memberName: "help",
      aliases: ["commands"],
      description:
        "Displays a list of available commands, or detailed information for a specified command.",
      details: `
				The command may be part of a command name or a whole command name.
				If it isn't specified, all available commands will be listed.
			`,
      examples: ["help", "help prefix"],
      args: [
        {
          key: "command",
          prompt: "Which command would you like to view the help for?",
          type: "string",
          default: "",
        },
      ],
    });
  }

  async run(msg, args) {
    const groups = this.client.registry.groups;
    const commands = this.client.registry.findCommands(
      args.command,
      false,
      msg
    );
    const showAll = args.command && args.command.toLowerCase() === "all";
    if (args.command && !showAll) {
      if (commands.length === 1) {
        let help = `${`__Command **${commands[0].name}**:__ ${commands[0].description}`}
**Format:** ${msg.anyUsage(
          `${commands[0].name}${
            commands[0].format ? ` ${commands[0].format}` : ""
          }`
        )}`;

        if (commands[0].aliases.length > 0)
          help += `\n**Aliases:** ${commands[0].aliases.join(", ")}`;
        help += `\n`;
        if (commands[0].details) help += `**Details:** ${commands[0].details}`;
        if (commands[0].examples)
          help += `**Examples:**\n${commands[0].examples.join("\n")}`;

        return [await msg.say(help)];
      } else if (commands.length > 15) {
        return msg.reply("Multiple commands found. Please be more specific.");
      } else if (commands.length > 1) {
        return msg.say(disambiguation(commands, "commands"));
      } else {
        return msg.say(
          `Unable to identify command. Use ${msg.usage(
            null,
            undefined,
            undefined
          )} to view the list of all commands.`
        );
      }
    } else {
      const messages = [];
      messages.push(
        await msg.say(
          `${`To run a command in ${
            msg.guild ? msg.guild.name : "any server"
          }, use ${Command.usage(
            "command",
            msg.guild ? msg.guild.commandPrefix : null,
            this.client.user
          )}.
For example, ${Command.usage(
            "prefix",
            msg.guild ? msg.guild.commandPrefix : null,
            this.client.user
          )}.`}
Use ${Command.usage(
            msg.guild.commandPrefix + "help <command>",
            null,
            null
          )} to view detailed information about a specific command.

__**Available commands**__
${groups
  .filter((grp) =>
    grp.commands.some((cmd) => !cmd.hidden && (showAll || cmd.isUsable(msg)))
  )
  .map(
    (grp) =>
      `${grp.commands
        .filter((cmd) => !cmd.hidden && (showAll || cmd.isUsable(msg)))
        .map(
          (cmd) =>
            `**${msg.guild.commandPrefix}${cmd.name}**: ${cmd.description}`
        )
        .join("\n")}`
  )}`,
          { split: true }
        )
      );

      return messages;
    }
  }

  onError(err, message) {
    error(err, message);
  }
}
