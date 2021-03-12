import { Command } from "discord.js-commando";
import { participants } from "../../../config.json";
import { MessageEmbed } from "discord.js";
import { logger } from "../../index";

export default class VoteCommand extends Command {
  constructor(client) {
    super(client, {
      name: "vote",
      aliases: ["stem", "v"],
      group: "general",
      memberName: "vote",
      description: "Cast your weekly vote",
    });
  }

  async run(message) {
    logger.log("info", `${message.author.username} has used vote.`);

    const filter = (m) => m.author.id === message.author.id;

    await message.embed({
      title: "Wie denk je dat er allemaal de aflevering zal overleven?",
      description:
        "Syntax: [naam]:[bedrag] herhaal dit voor iedere persoon\nVoorbeeld: Alice:200 Bob:600 Carol:200",
    });

    let collected = await message.channel
      .awaitMessages(filter, {
        max: 1,
        time: 30000,
      })
      .catch(() => {
        throw new Error("Timeout: You waited too long to respond.");
      });

    const persons = collected
      .first()
      .content.split(" ")
      .map((person) => person.split(":"));

    if (!persons.every((p) => participants.includes(p[0])))
      throw new Error("Not every person is a participant");

    collected.first().react("✅");

    const moleEmbded = new MessageEmbed({ title: "Wie is de mol?" });
    for (let [index, person] of participants.entries()) {
      moleEmbded.addField(index, person);
    }
    message.embed(moleEmbded);

    collected = await message.channel
      .awaitMessages(filter, {
        max: 1,
        time: 30000,
        errors: ["time"],
      })
      .catch(() => {
        throw new Error("Timeout: You waited too long to respond.");
      });

    collected.first().react("✅");

    logger.log(collected.first().content);
  }

  onError(err, message) {
    message.embed({
      title: "Error",
      description: err.message,
      color: "#FF2400",
    });
  }
}
