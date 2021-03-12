import mongoose from "mongoose";
import { mongoDB } from "../../config.json";
import Config from "./Schematics/Config"
import { Candidate, User, MoleBet, Bet } from "./Schematics/User"
import { logger } from "../index";
mongoose.connect(mongoDB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
}).then(() => logger.log("info", "Connected to DB"))
  .catch(err => {
    logger.log("error", `Cannot connect to DB: ${err}`);
  });
module.exports.getSetting = async (setting) => {
  return await Config.findOne({ "name": setting })
}
module.exports.getWeek = async () => {
  return await Config.findOne({ "name": "week" })
}

module.exports.setSetting = async (setting, value) => {
  Config.update({ "name": setting }, { "value": value }, { upsert: true });
}
