import { Command } from "discord.js-commando";
import { setSetting } from "../../database/mongo"

export default class SettingCommand extends Command {
    constructor(client) {
        super(client, {
            name: "setting",
            aliases: ["sets"],
            group: "management",
            description: "Edit or add a setting",
            args: [{
                key: "setting",
                prompt: "Please provide a setting to edit",
                type: "string"
            },
            {
                key: "value",
                prompt: "Please provide a value for the setting you want to edit",
                type: "integer|string"
            }],
            memberName: "setting"
        })
    }

    async run(message, { setting, value }) {
        if (message.author.id === "131121315242311680" || message.author.id === "223837254118801408") {
            if (setting.toLowerCase() === "week") {
                setSetting("week", Number(value))
            } else {
                setSetting(setting, value)
            }
        }
    }
}