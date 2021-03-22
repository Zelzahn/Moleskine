import { Command } from "discord.js-commando";
import { logger } from "../../index";
import { error } from "../../utils/printError";
import { getAllScores } from "../../database/mongo";
import { MessageEmbed } from "discord.js";

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

    const embed = new MessageEmbed().setTitle("Leaderboard");

    let description = "";

   //  await leaderboard.forEach(async (user, index) => {
   //    const expandedUser = await this.client.users.fetch(user.userId);
   //    description += `\n\`${index + 1}.${
   //      index + 1 < 10 ? " " : ""
   //    }\` ${expandedUser}:\t**${user.score} ${
   //      user.score == 1 ? "punt" : "punten"
   //    }**`;
   //  });
   for(const [user, index] of leaderboard) {
            const expandedUser = await this.client.users.fetch(user.userId);
            description += `\n\`${index + 1}.${
        	    index + 1 < 10 ? " " : ""
            }\` ${expandedUser}:\t**${user.score} ${
        	    user.score == 1 ? "punt" : "punten"
            }**`;
   }
    console.log("desc: ", description);
    embed.setDescription(description);

    message.say(embed);
  }

  onError(err, message) {
    error(err, message);
  }
}
