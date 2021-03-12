import mongoose from "mongoose";

const reqString = {
  type: String,
  required: true,
};

const candidatSchema = mongoose.Schema({
  name: { type: String, required: true, enum: [] },
  inGame: { type: Boolean, required: true },
  emoji: reqString,
});

const week = {
  type: Number,
  required: true,
  min: 1,
};

const userSchema = mongoose.Schema({
  guildId: reqString,
  userId: reqString,
  remainingPoints: { type: Number, min: 0, max: 1000 },
});

const betSchema = mongoose.Schema({
  week: week,
  amount: { type: Number, required: true, min: 1, max: 1000 },
  user: { type: Schema.ObjectId, ref: "user", required: true },
  candidat: { type: Schema.ObjectId, ref: "candidat", required: true },
});

const molBetSchema = mongoose.Schema({
  user: { type: Schema.ObjectId, ref: "user", required: true },
  week: week,
  mol: { type: Schema.ObjectId, ref: "candidat", required: true },
});
molBetSchema.index({ user: 1, week: 1 }, { unique: true });

const User = mongoose.model("user", userSchema);
const Bet = mongoose.model("bet", betSchema);
const MolBet = mongoose.model("molbet", molBetSchema);
const Candidat = mongoose.model("candidat", candidatSchema);

module.exports = {
  User: User,
  Bet: Bet,
  MolBet: MolBet,
  Candidat: Candidat,
};
