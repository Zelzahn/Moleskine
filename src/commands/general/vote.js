import { Command } from "discord.js-commando";
import { participants } from "../../../config.json";
import { MessageEmbed } from "discord.js";
import { logger } from "../../index";
import { error } from "../../utils/printError";

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
    logger.log(
      "info",
      `${message.author.username} (${message.author.id}) has used vote.`
    );

    await message.embed({
      title: "Wie denk je dat er allemaal de aflevering zal overleven?",
      description:
        "Syntax: [naam]:[bedrag]\nVoorbeeld: Alice:200 Bob:600 Carol:200",
    });

    const filter = (m) => m.author.id === message.author.id;
    let collected = await message.channel
      .awaitMessages(filter, {
        max: 1,
        time: 30000,
        errors: ["time"],
      })
      .catch(() => {
        throw new Error("Timeout: You waited too long to respond.");
      });

    let persons = collected
      .first()
      .content.split(" ")
      .map((person) => person.split(":"));

    if (!persons.every(([p, _]) => participants.includes(p.toLowerCase())))
      throw new Error("Not every person is a participant");

    persons = persons.map(([person, val]) => {
      return [person, Number(val)];
    });

    if (persons.some(([_, val]) => val < 0))
      throw new Error("You can not give negative points.");

    const score = persons.reduce((a, [_, b]) => a + b, 0);
    // TODO: Checken of dat de score niet hoger dan huidig resterende saldo is
    if (score > 1000)
      throw new Error(
        "The total amount of points you give out should be lower than 1000."
      );

    // TODO: API-call voor de bedragen te bevestigen

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
    error(err, message);
  }
}
