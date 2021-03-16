import { Command } from "discord.js-commando";

import { MessageEmbed } from "discord.js";
import {
  getWeek,
  getCurrentCandidates,
  getCandidates,
} from "../../database/mongo";

export default class PlayerCommand extends Command {
  constructor(client) {
    super(client, {
      name: "players",
      aliases: ["candidates", "spelers", "kandidaten"],
      description: "Shows the current players",
      group: "general",
      memberName: "players",
    });
  }

  async run(message) {
    const week = await getWeek();
    let embed = new MessageEmbed().setTitle(`Huidige kandidaten week ${week}`);
    const candidats = await getCurrentCandidates();
    let left = "";
    let right = "";
    for (let index = 0; index < candidats.length; index++) {
      const participant = candidats[index].name;

      if (index > candidats.length / 2) right += `\n\n${participant}`;
      else left += `\n\n${participant}`;
    }

    if (candidats.length < 3) {
      const players = await getCandidates();
      embed.setDescription(
        `Het seizoen is geëindigd, ${
          players.filter((player) => player.lastWeek === week)[0].name
        } was de mol en ${
          players.filter((player) => player.lastWeek === week - 1)[0].name
        } heeft gewonnen`
      );
    } else {
      embed.addField("\u200B", left, true);
      embed.addField("\u200B", right, true);
    }
    message.embed(embed);
  }
}
