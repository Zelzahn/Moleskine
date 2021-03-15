import { Command } from "discord.js-commando";
import { MessageEmbed } from "discord.js";
import { logger } from "../../index";
import { error } from "../../utils/printError";
import {
  getPoints,
  getCurrentCandidates,
  placeBet,
  getSetting,
  placeMoleBet,
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

    this.waitingTime = 30000;
    this.deleteTime = 3000;
  }

  async run(message) {
    message.delete({ timeout: this.deleteTime * 2 });

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

    survivorEmbed.delete({ timeout: this.deleteTime });

    const filter = (m) => m.author.id === message.author.id;
    let collected = await message.channel
      .awaitMessages(filter, {
        max: 1,
        time: this.waitingTime,
        errors: ["time"],
      })
      .catch(() => {
        throw new Error("Timeout: You waited too long to respond.");
      });

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
    const current_score = (await getPoints(userId, guildId)) || 1000;
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

    let moleEmbded = new MessageEmbed().setTitle(
      "Wie is de mol? (volgens jou)"
    );

    // TODO: Split this up in 2 fields to make the message more compact
    let description = "";
    for (const participant of participants) {
      description += `\n\n${participant.emoji}: ${participant.name}`;
    }
    moleEmbded.setDescription(description);

    // This errors
    // for (const participant of participants) {
    //   moleEmbded.addField(" ", `${participant.emoji}: ${participant.name}`);
    // }

    // TODO: Skip this part if the user already placed a moleEmbet

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
  }

  onError(err, message) {
    error(err, message);
  }

  succesfullyProcessed(message) {
    message.react("✅");
    message.delete({ timeout: this.deleteTime });
  }
}
