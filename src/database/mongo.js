import mongoose from "mongoose";
import { mongoDB } from "../../config.json";
import Config from "./Schematics/Config";
import { Candidate, User, MoleBet, Bet } from "./Schematics/User";
import { logger } from "../index";
mongoose.connect(mongoDB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
}).then(() => logger.log("info", "Connected to DB"))
  .catch(err => {
    logger.log("error", `Cannot connect to DB: ${err}`);
  });
// Config calls
module.exports.getSetting = async (setting) => {
  return await Config.findOne({ "name": setting });
};
module.exports.getWeek = async () => {
  return await Config.findOne({ "name": "week" });
};

module.exports.setSetting = async (setting, value) => {
  await Config.updateOne({ "name": setting }, { "value": value }, { upsert: true });
};

// Help Functions
async function getUserId(userId, guildId) {
  return await User.findOne({ "guildId": guildId, "userId": userId }, "_id");

}

async function getCandidateId(candidate) {
  return await Candidate.findOne({ name: candidate }, "_id");
}

async function getBetInfo(userId, guildId, candidate) {
  const week = await getWeek();
  const user = await getUserId(userId, guildId);
  const player = await getCandidateId(candidate);
  return { week: week, user: user, candidate: player };
}


// Candidate Calls
module.exports.getCurrentCandidates = async () => {
  return await Candidate.find({ "inGame": true });
};

module.exports.eliminateCandidate = async (candidate) => {
  Candidate.updateOne({ "name": candidate }, { "inGame": false });
};

// Betting Calls
module.exports.placeBet = async (userId, guildId, candidate, amount) => {
  const info = await getBetInfo(userId, guildId, candidate);
  const bet = new Bet({
    "week": info.week,
    "amount": amount,
    "user": info.user,
    "candidate": info.candidate
  });
  bet.save();
};

module.exports.getBet = async (userId, guildId, week, candidate) => {
  const user = await getUserId(userId, guildId);
  const candidateId = await getCandidateId(candidate);
  return await Bet.findOne({ "user": user, "week": week, "candidate": candidateId });
};

module.exports.getUserBets = async (userId, guildId, week) => {
  const user = await getUserId(userId, guildId);
  return await Bet.findAll({ "user": user, "week": week });
};

module.exports.getWeekBets = async (week) => {
  return await Bet.findAll({ "week": week });
};

module.exports.getAllBets = async () => {
  return await Bet.findAll();
};

// User Calls

module.exports.removePoints = async (userId, guildId, amount) => {
  User.updateOne({ "guildId": guildId, "userId": userId }, { "$inc": { "remainingPoints": -amount } });
};

module.exports.getPoints = async (userId, guildId) => {
  return await User.findOne({ "userId": userId, "guildId": guildId }, "remainingPoints");
};

// Mole Bet Calls
module.exports.placeMoleBet = async (userId, guildId, candidate) => {
  const info = await getBetInfo(userId, guildId, candidate);
  const moleBet = new MoleBet({
    "user": info.user,
    "week": info.week,
    "mole": info.candidate
  });
  moleBet.save();
};

module.exports.getMoleBet = async (userId, guildId, week) => {
  const user = getUserId(userId, guildId);
  return await MoleBet.findOne({ "user": user, "week": week });
};

module.exports.getWeekMoleBets = async (week) => {
  return await MoleBet.findAll({ "week": week });
};

module.exports.getAllMoleBets = async () => {
  return await MoleBet.findAll();
};


