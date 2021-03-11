const { Command } = require("discord.js-commando");

module.exports = class VoteCommand extends Command {
  constructor(client) {
    super(client, {
      name: "vote",
      aliases: ["stem", "v"],
      group: "general",
      memberName: "vote",
      description: "Cast your weekly vote",
    });
  }

  // Stuur "Wie denk je dat er allemaal de aflevering zal overleven?"
  // 1. naam:bedrag naam:bedrag etc.
  // Stuur "Wie is de mol?"
  // 2. naam
  async run(message) {
    // TODO: Logger deftig in een aparte file doen
    console.log(`${message.author.username} has used vote.`);

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
        message.say("Timeout: You waited too long to respond.");
      });

    collected.first().react("✅");

    const persons = collected.first().content.split(" ");
    console.log(persons);

    message.say("Wie is de mol?");

    collected = await message.channel
      .awaitMessages(filter, {
        max: 1,
        time: 30000,
        errors: ["time"],
      })
      .catch(() => {
        message.say("Timeout: You waited too long to respond.");
        // TODO: De log hieronder wordt lijk ook nog uitgevoerd?
      });

    collected.first().react("✅");

    console.log(collected.first().content);
  }
};
