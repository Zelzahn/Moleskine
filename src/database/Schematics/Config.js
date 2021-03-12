import { Schema, model } from "mongoose";

const configSchema = Schema({
  name: { type: String, required: true },
  value: { type: Schema.Types.Mixed, required: true },
});

export default model("config", configSchema);
