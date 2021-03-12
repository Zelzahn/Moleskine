import { Command } from "discord.js-commando";
import { logger } from "../../index";
import { error } from "../../utils/printError";

export default class LeaderboardCommand extends Command {
  constructor(client) {
    super(client, {
      name: "leaderboard",
      aliases: ["l"],
      group: "general",
      memberName: "leaderboard",
      description: "See the ranking of everyone",
    });
  }

  async run(message) {
    logger.log(
      "info",
      `${message.author.username} (${message.author.id}) has used leaderboard.`
    );

    message.react("✅");

    // TODO: API call naar de BE voor de leaderbord op te halen
  }

  onError(err, message) {
    error(err, message);
  }
}
