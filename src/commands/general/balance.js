import { Command } from "discord.js-commando";

import { getRemainingPoints } from "../../database/mongo";

export default class PlayerCommand extends Command {
  constructor(client) {
    super(client, {
      name: "balance",
      aliases: ["bal"],
      description: "Shows your current balance",
      group: "general",
      memberName: "balance",
    });
  }

  async run(message) {
    const remainingPoints = await getRemainingPoints(
      message.author.id,
      message.guild.id
    );
    message.reply(
      ` je hebt nog ${remainingPoints} ${
        remainingPoints === 1 ? "punt" : "punten"
      } over voor deze week.`
    );
  }
}
