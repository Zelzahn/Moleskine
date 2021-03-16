import { Schema, model } from "mongoose";

const configSchema = Schema({
  name: { type: String, required: true },
  value: { type: Schema.Types.Mixed, required: true },
});

const channelSchema = Schema({
  guildId: { type: String, required: true },
  channelId: { type: String, required: true }
});

channelSchema.index({ guildId: 1, channelId: 1 }, { unqiue: true });
export const Config = model("config", configSchema);
export const Channel = model("channel", channelSchema);

