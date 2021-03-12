import mongoose from "mongoose";

// Newtypes
const reqString = {
  type: String,
  required: true,
};

const week = {
  type: Number,
  required: true,
  min: 1,
};

// Schemas
const candidateSchema = mongoose.Schema({
  name: { type: String, unique: true, required: true, enum: [] },
  inGame: { type: Boolean, required: true },
  emoji: reqString,
});

const userSchema = mongoose.Schema({
  guildId: reqString,
  userId: reqString,
  remainingPoints: { type: Number, min: 0, max: 1000 },
});
userSchema.index({ guilId: 1, userId: 1 }, { unique: true });

const betSchema = mongoose.Schema({
  week: week,
  amount: { type: Number, required: true, min: 1, max: 1000 },
  user: { type: mongoose.Schema.ObjectId, ref: "user", required: true },
  candidate: {
    type: mongoose.Schema.ObjectId,
    ref: "candidate",
    required: true,
  },
});
betSchema.index({ week: 1, user: 1, candidate: 1 }, { unique: true });

const moleBetSchema = mongoose.Schema({
  user: { type: mongoose.Schema.ObjectId, ref: "user", required: true },
  week: week,
  mole: { type: mongoose.Schema.ObjectId, ref: "candidate", required: true },
});
moleBetSchema.index({ user: 1, week: 1 }, { unique: true });

const User = mongoose.model("user", userSchema);
const Bet = mongoose.model("bet", betSchema);
const MoleBet = mongoose.model("molebet", moleBetSchema);
const Candidate = mongoose.model("candidate", candidateSchema);

module.exports = {
  User: User,
  Bet: Bet,
  MoleBet: MoleBet,
  Candidate: Candidate,
};
