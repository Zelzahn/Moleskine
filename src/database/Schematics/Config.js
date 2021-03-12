import mongoose from "mongoose";

const configSchema = mongoose.Schema({
  name: { type: String, required: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
});

module.exports = mongoose.model("config", configSchema);
