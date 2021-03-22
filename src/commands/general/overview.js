import { Command } from "discord.js-commando";
import { logger } from "../../index";
import { error } from "../../utils/printError";
import {
  getMoleBet,
  getRemainingPoints,
  getScore,
  getUserBets,
  getWeek,
} from "../../database/mongo";
import { MessageEmbed } from "discord.js";

export default class LeaderboardCommand extends Command {
  constructor(client) {
    super(client, {
      name: "overview",
      aliases: ["o"],
      group: "general",
      memberName: "overview",
      description: "See a personlised overview of the current week.",
    });
  }

  async run(message) {
    const userId = message.author.id;
    const guildId = message.guild.id;

    logger.log(
      "info",
      `${message.author.username} (${message.author.id}) has used overview.`
    );

    const remainingPoints = await getRemainingPoints(userId, guildId);
    const score = await getScore(userId, guildId);
    const week = await getWeek();

    const betsRaw = await getUserBets(userId, guildId, week);
    const bets = betsRaw.map((bet) => `${bet.candidate.name}: ${bet.amount}`);

    const moleBet = await getMoleBet(userId, guildId);

    const embed = new MessageEmbed()
      .setTitle(`${message.author.username}'s overzicht voor deze week`)
      .setDescription(
        `Huidige score: ${
          score ? score : 0
        }\nAantal punten nog uit te geven: ${remainingPoints}`
      )
      .addField(
        "Gemaakte bets",
        bets.length ? bets : "Nog geen geplaatste bets",
        true
      )
      .addField(
        "Jouw mol",
        moleBet ? moleBet.mole.name : "Nog niet gestemd wie de mol is",
        true
      );

    message.embed(embed);
  }

  onError(err, message) {
    error(err, message);
  }
}
