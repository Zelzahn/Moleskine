import { Command } from "discord.js-commando";
import { MessageEmbed } from "discord.js";
import {
  getSetting,
  getCurrentCandidates,
  eliminateCandidate,
  getAllUsers,
  getWeek,
  getUserBets,
  addScore,
  resetRemainingPoints,
  getAllChannels,
} from "../../database/mongo";
import { error } from "../../utils/printError";

export default class NextWeekCommand extends Command {
  constructor(client) {
    super(client, {
      name: "nextweek",
      aliases: ["next"],
      group: "management",
      description: "Eliminate a candidate and go to the next week",
      memberName: "nextweek",
      args: [
        {
          key: "candidate",
          prompt: "Please provide a candidate to eliminate",
          type: "string",
        },
      ],
    });
  }

  async run(message, { candidate }) {
    const owners = await getSetting("owners");

    if (owners.includes(message.author.id)) {
      const current = await getCurrentCandidates();
      if (
        current.filter((c) => c.name.toLowerCase() === candidate.toLowerCase())
          .length !== 0
      ) {
        const effectiveC = current.filter(
          (c) => c.name.toLowerCase() === candidate.toLowerCase()
        )[0];
        // Calculate all points
        const week = await getWeek();
        const users = await getAllUsers();
        users.forEach(async (user) => {
          const bets = await getUserBets(user.userId, user.guildId, week);
          let count = 0;
          for (let bet of bets) {
            if (!bet.candidate.equals(effectiveC._id)) {
              count += bet.amount;
            }
          }
          await addScore(user.userId, user.guildId, count);
          await resetRemainingPoints(user.userId, user.guildId);
        });
        // Update Week
        await eliminateCandidate(candidate.toLowerCase());
        message.react("✅");
        // Notify all servers ?
        const channels = await getAllChannels();
        channels.forEach(async (channel) => {
          ch = this.client.channels.get(channel.channelId);
          let embed = new MessageEmbed()
            .setTitle("De Mol: Nieuwe Week")
            .setDescription(
              `${candidate} was geëlimineerd en een nieuwe week is begonnen. Iedereen kan weer 1000 punten verdelen over de overige deelnemers.`
            );
          ch.embed(embed);
        });
      } else {
        throw new Error(
          `${candidate} is not a candidate or not in the game anymore`
        );
      }
    }
    await addScore(user.userId, user.guildId, count);
    await resetRemainingPoints(user.userId, user.guildId);
  }

  onError(err, message) {
    error(err, message);
  }
}
