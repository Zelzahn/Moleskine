import { Command } from "discord.js-commando";
import { MessageEmbed } from "discord.js";
import { logger } from "../../index";
import { error } from "../../utils/printError";
import {
  getRemainingPoints,
  getCurrentCandidates,
  placeBet,
  placeMoleBet,
  existsMoleBet,
} from "../../database/mongo";

export default class VoteCommand extends Command {
  constructor(client) {
    super(client, {
      name: "vote",
      aliases: ["stem", "v"],
      group: "general",
      memberName: "vote",
      description: "Cast your weekly vote",
      details:
        "Syntax: [naam]:[bedrag]\nVoorbeeld: Alice:200 Bob:600 Carol:200",
    });

    this.waitingTime = 60000;
    this.deleteTime = 10000;
  }

  async run(message, args) {
    const userId = message.author.id;
    const guildId = message.guild.id;
    const participants = await getCurrentCandidates();

    let personsArg;
    let collected;
    if (args) {
      personsArg = args;

      logger.log(
        "info",
        `${message.author.username} (${message.author.id}) has used vote, with arguments.`
      );
    } else {
      logger.log(
        "info",
        `${message.author.username} (${message.author.id}) has used vote, without arguments.`
      );

      let names = participants.map((p) => p.name);
      names = names.join(", ");
      const survivorEmbed = await message.embed({
        title: "Wie denk je dat er allemaal de aflevering zal overleven?",
        description: `Syntax: [naam]:[bedrag]\nVoorbeeld: Alice:200 Bob:600 Carol:200\nMogelijke deelnemers zijn: **${names}**`,
        footer: {
          text: `Gelieve in ${this.waitingTime / 1000
            } seconden te reageren. Of zeg 'cancelled' om te annuleren.`,
        },
      });

      collected = await message.channel
        .awaitMessages((user) => user.author.id == userId, {
          max: 1,
          time: this.waitingTime,
          errors: ["time"],
        })
        .catch(() => {
          message.delete();
          survivorEmbed.delete();
          throw new Error(
            `Timeout: ${message.author.toString()}, you waited too long to give your bets.`
          );
        });

      personsArg = collected.first().content;

      if (["cancelled", "c", "canceled"].includes(personsArg.toLowerCase())) {
        this.succesfullyProcessed(collected.first());
        logger.log(
          "info",
          `${message.author.username} (${message.author.id}) has cancelled their vote.`
        );
        return;
      }
    }

    // survivorEmbed.delete();

    let persons = personsArg
      .replace(/ *\: */g, ":")
      .split(" ")
      .map((person) => person.split(":"))
      .map(([p, v]) => [p.toLowerCase(), Number(v)]);

    const selectedParticipants = participants.filter((p) =>
      persons.some(([person, _]) => p.name.toLowerCase() == person)
    );

    if (selectedParticipants.length == 0)
      throw new Error("No valid participants given.");

    for (const [_, val] of persons) {
      if (val < 0) throw new Error("You can not give negative points.");

      if (val < 1) throw new Error("A bet should at least be 1.");

      if (!Number.isInteger(val))
        throw new Error(
          "Only numbers belonging to the strict natural numbers are allowed."
        );
    }

    const score = persons.reduce((a, [_, b]) => a + b, 0);
    const current_score = await getRemainingPoints(userId, guildId);
    if (score > current_score)
      throw new Error(
        `You can not spend more points than you currently have. (You have: ${current_score})`
      );

    for (const [p, val] of persons) {
      await placeBet(userId, guildId, p, val).catch((err) => {
        if (collected) collected.first().react("❌");
        else message.react("❌");

        if (err.message === "CastError")
          throw new Error("Have you forgotten to put the ':'?");

        throw new Error(err.message);
      });
    }

    this.succesfullyProcessed(collected ? collected.first() : message);

    if (await existsMoleBet(userId, guildId)) {
      // const said = await message.say(
      // );
      // said.delete({ timeout: this.deleteTime });
      // return;
      throw new Error(
        "You already selected who you think the mole is for this week."
      );
    }

    let moleEmbded = new MessageEmbed().setTitle(
      "Wie is de mol? (volgens jou)"
    );

    if (participants.length > 6) {
      let left = "";
      let right = "";
      for (let index = 0; index < participants.length; index++) {
        const participant = participants[index];

        if (index >= participants.length / 2)
          right += `\n\n${participant.emoji}: ${participant.name}`;
        else left += `\n\n${participant.emoji}: ${participant.name}`;
      }

      moleEmbded.addField("\u200B", left, true);
      moleEmbded.addField("\u200B", right, true);
    } else {
      let description = "";
      for (const participant of participants) {
        description += `\n\n${participant.emoji}: ${participant.name}`;
      }
      moleEmbded.setDescription(description);
    }

    // This errors
    // for (const participant of participants) {
    //   moleEmbded.addField(" ", `${participant.emoji}: ${participant.name}`);
    // }

    moleEmbded = await message.embed(moleEmbded);
    participants.forEach(async ({ emoji }) => await moleEmbded.react(emoji));

    collected = await moleEmbded
      .awaitReactions((_, user) => user.id == userId, {
        max: 1,
        time: this.waitingTime,
        errors: ["time"],
      })
      .catch(() => {
        throw new Error("You waited too long to respond. (Timeout)");
      });

    const collectedArr = Array.from(collected).filter((c) => c[1].count > 1);

    let ctr = 0;
    while (
      ctr < participants.length &&
      participants[ctr].emoji !== collectedArr[0][0]
    )
      ctr++;

    if (ctr < participants.length)
      await placeMoleBet(userId, guildId, participants[ctr]).catch((error) => {
        moleEmbded.react("❌");
        throw new Error(error);
      });
    else
      throw new Error(
        "Couldn't find the participant linked with the selected emoji."
      );

    this.succesfullyProcessed(moleEmbded);

    // message.delete();
  }

  onError(err, message) {
    error(err, message);
  }

  succesfullyProcessed(message) {
    message.react("✅");
    // message.delete({ timeout: this.deleteTime });
  }
}
