import { Command } from "discord.js-commando";
import { setChannel } from '../../database/mongo';
export default class StartCommand extends Command {
    constructor(client) {
        super(client, {
            name: "start",
            group: "general",
            description: "Starts the betting in the current channel and sets up notifications",
            memberName: "start"
        });

    }

    async run(message) {
        if (message.member.hasPermission("ADMINISTRATOR")) {
            await setChannel(message.guild.id, message.channel.id);
            message.react("✅");
        }
    }


}