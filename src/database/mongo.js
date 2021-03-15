import mongoose from "mongoose";
import { mongoDB } from "../../config.json";
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
  const user = await User.findOne({ guildId: guildId, userId: userId }, "_id");
  if (user === null)
    return await User.create({ guildId: guildId, userId: userId });
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
  return await Candidate.find({ inGame: true });
};

export const eliminateCandidate = async (candidate) => {
  Candidate.updateOne({ name: candidate }, { inGame: false });
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
    throw new Error(err);
  });

  await removePoints(userId, guildId, amount);
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

export const removePoints = async (userId, guildId, amount) => {
  await User.updateOne(
    { guildId: guildId, userId: userId },
    { $inc: { remainingPoints: -amount } }
  );
};

export const getPoints = async (userId, guildId) => {
  await User.findOne({ userId: userId, guildId: guildId }, "remainingPoints");
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

export const getMoleBet = async (userId, guildId, week) => {
  const user = getUserId(userId, guildId);
  return await MoleBet.findOne({ user: user, week: week });
};

export const getWeekMoleBets = async (week) => {
  return await MoleBet.findAll({ week: week });
};

export const getAllMoleBets = async () => {
  return await MoleBet.findAll();
};
