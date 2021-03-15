import { Command } from "discord.js-commando";
import { logger } from "../../index";
import { error } from "../../utils/printError";
import { getAllScores } from "../../database/mongo";

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

    const leaderboard = await getAllScores(message.guild.id);
    // console.log(leaderboard);
  }

  onError(err, message) {
    error(err, message);
  }
}
