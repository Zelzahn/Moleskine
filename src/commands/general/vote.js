import { Command } from "discord.js-commando";
import { MessageEmbed } from "discord.js";
import { logger } from "../../index";
import { error } from "../../utils/printError";
import {
  getPoints,
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
    });

    this.waitingTime = 5000;
    this.deleteTime = 10000;
  }

  async run(message) {
    const userId = message.author.id;
    const guildId = message.guild.id;

    logger.log(
      "info",
      `${message.author.username} (${message.author.id}) has used vote.`
    );

    const survivorEmbed = await message.embed({
      title: "Wie denk je dat er allemaal de aflevering zal overleven?",
      description:
        "Syntax: [naam]:[bedrag]\nVoorbeeld: Alice:200 Bob:600 Carol:200",
    });

    const filter = (m) => m.author.id === message.author.id;
    let collected = await message.channel
      .awaitMessages(filter, {
        max: 1,
        time: this.waitingTime,
        errors: ["time"],
      })
      .catch(() => {
        message.delete();
        survivorEmbed.delete();
        throw new Error("Timeout: You waited too long to respond.");
      });

    // survivorEmbed.delete();

    let persons = collected
      .first()
      .content.split(" ")
      .map((person) => person.split(":"))
      .map(([p, v]) => [p.toLowerCase(), Number(v)]);

    const participants = await getCurrentCandidates();
    const selectedParticipants = participants.filter((p) =>
      persons.some(([person, _]) => p.name.toLowerCase() == person)
    );

    if (selectedParticipants.length == 0)
      throw new Error("No valid participants given.");

    if (persons.some(([_, val]) => val < 0))
      throw new Error("You can not give negative points.");

    const score = persons.reduce((a, [_, b]) => a + b, 0);
    const current_score = await getPoints(userId, guildId);
    if (score > current_score)
      throw new Error(
        `You can not spend more points than you currently have. (You have: ${current_score})`
      );

    for (const [p, val] of persons) {
      await placeBet(userId, guildId, p, val).catch(() => {
        collected.first().react("❌");
        throw new Error(`You have already voted for ${p}.`);
      });
    }

    this.succesfullyProcessed(collected.first());

    if (await existsMoleBet(userId, guildId)) {
      const said = await message.say(
        "You already selected who you think the mole is for this week."
      );
      said.delete({ timeout: this.deleteTime });
      return;
    }

    let moleEmbded = new MessageEmbed().setTitle(
      "Wie is de mol? (volgens jou)"
    );

    if (participants.length > 6) {
      let left = "";
      let right = "";
      for (let index = 0; index < participants.length; index++) {
        const participant = participants[index];

        if (index > participants.length / 2)
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
        throw new Error("Timeout: You waited too long to respond.");
      });

    const collectedArr = Array.from(collected);
    let ctr = 0;
    while (participants[ctr].emoji != collectedArr[ctr][0]) ctr++;

    if (ctr < participants.length && collectedArr[ctr][1].count > 1)
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
