import mongoose from "mongoose";
import { mongoDB } from "../../config";
import Config from "./Schematics/Config";
import { Candidate, User, MoleBet, Bet } from "./Schematics/User";
import { logger } from "../index";

mongoose
  .connect(mongoDB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => logger.log("info", "Connected to DB"))
  .catch((err) => {
    logger.log("error", `Cannot connect to DB: ${err}`);
  });

// Config calls

function getConfigHelper({ value }) {
  return value;
}

export const getSetting = async (setting) => {
  return getConfigHelper(await Config.findOne({ name: setting }));
};
export const getWeek = async () => {
  return getConfigHelper(await Config.findOne({ name: "week" }));
};

export const setSetting = async (setting, value) => {
  logger.log("warn", `${setting} has been changed to ${value}`);
  await Config.updateOne({ name: setting }, { value: value }, { upsert: true });
};

// Help Functions

const getUserId = async (userId, guildId) => {
  const user = await User.findOne({ guildId, userId }, "_id");
  if (user === null) {
    return await User.create({ guildId, userId });
  }
  return user;
};

const getCandidateId = async (candidate) => {
  return await Candidate.findOne({ name: candidate }, "_id");
};

async function getBetInfoAll(userId, guildId, candidate) {
  const week = await getWeek();
  const user = await getUserId(userId, guildId);
  const player = await getCandidateId(candidate);
  return { week: week, user: user, candidate: player };
}

async function getBetInfo(userId, guildId) {
  const week = await getWeek();
  const user = await getUserId(userId, guildId);
  return { week: week, user: user };
}

// Candidate Calls

export const getCurrentCandidates = async () => {
  const week = await getWeek();
  return await Candidate.find({ lastWeek: week });
};

export const eliminateCandidate = async (candidate) => {
  const week = await getWeek();
  Candidate.updateOne(
    { name: candidate, lastWeek: week },
    { lastWeek: week + 1 }
  );
};

// Betting Calls

export const placeBet = async (userId, guildId, candidate, amount) => {
  const info = await getBetInfoAll(userId, guildId, candidate);

  await Bet.create({
    week: info.week,
    amount: amount,
    user: info.user,
    candidate: info.candidate,
  }).catch((err) => {
    // console.log(err);
    throw new Error(err);
  });

  await removeRemainingPoints(userId, guildId, amount);
};

export const getBet = async (userId, guildId, week, candidate) => {
  const user = await getUserId(userId, guildId);
  const candidateId = await getCandidateId(candidate);
  return await Bet.findOne({ user: user, week: week, candidate: candidateId });
};

export const getUserBets = async (userId, guildId, week) => {
  const user = await getUserId(userId, guildId);
  return await Bet.findAll({ user: user, week: week });
};

export const getWeekBets = async (week) => {
  return await Bet.findAll({ week: week });
};

export const getAllBets = async () => {
  return await Bet.findAll();
};

// User Calls

export const removeRemainingPoints = async (userId, guildId, amount) => {
  await User.updateOne(
    { guildId: guildId, userId: userId },
    { $inc: { remainingPoints: -amount } }
  );
};

export const getRemainingPoints = async (userId, guildId) => {
  const user = await User.findOne(
    { userId: userId, guildId: guildId },
    "remainingPoints"
  );
  if (user !== null) return user.remainingPoints;
  return 1000;
};

export const getScore = async (userId, guildId) => {
  const user = await User.findOne(
    { userId: userId, guildId: guildId },
    "score"
  );
  if (user) return user.points;
  return 0;
};

export const addScore = async (userId, guildId, amount) => {
  await User.updateOne(
    { guildId: guildId, userId: userId },
    { $inc: { score: amount } },
    { upsert: true, setDefaultsOnInsert: true }
  );
};

export const getAllScores = async (guildId) => {
  const users = await User.find({ guildId: guildId }).sort({ score: "desc" });
  return users.map((user) => ({ userId: user.userId, score: user.score }));
};

// Mole Bet Calls

export const placeMoleBet = async (userId, guildId, candidate) => {
  const info = await getBetInfo(userId, guildId);
  await MoleBet.create({
    user: info.user,
    week: info.week,
    mole: candidate,
  }).catch((error) => {
    throw new Error(error);
  });
};

export const existsMoleBet = async (userId, guildId) => {
  const user = await getUserId(userId, guildId);
  const week = await getWeek();
  return await MoleBet.exists({ user: user, week: week });
};

export const getMoleBet = async (userId, guildId) => {
  const user = await getUserId(userId, guildId);
  const week = await getWeek();
  return await MoleBet.findOne({ user: user, week: week });
};

export const getWeekMoleBets = async (week) => {
  return await MoleBet.findAll({ week: week });
};

export const getMoleBetsByCandidate = async (userId, guildId, candidate) => {
  const user = await getUserId(userId, guildId);
  const candidateExpanded = await getCandidateId(candidate);
  return await MoleBet.find({ user: user, mole: candidateExpanded });
};

export const getAllMoleBets = async () => {
  return await MoleBet.findAll();
};
