import { Schema, model } from "mongoose";
import { participants } from "../../../config";

// Newtypes
const reqString = {
  type: String,
  required: true,
};

const week = {
  type: Number,
  required: true,
  min: 1,
  default: 1,
};

// Schemas
const candidateSchema = Schema({
  name: { type: String, unique: true, required: true, enum: participants },
  lastWeek: week,
  emoji: reqString,
});

const userSchema = Schema({
  guildId: reqString,
  userId: reqString,
  remainingPoints: {
    type: Number,
    min: 0,
    max: 1000,
    default: 1000,
    required: true,
  },
  score: { type: Number, min: 0, default: 0, required: true },
});
userSchema.index({ guildId: 1, userId: 1 }, { unique: true });

const betSchema = Schema({
  week: week,
  amount: { type: Number, required: true, min: 1, max: 1000 },
  user: { type: Schema.ObjectId, ref: "user", required: true },
  candidate: {
    type: Schema.ObjectId,
    ref: "candidate",
    required: true,
  },
});
betSchema.index({ week: 1, user: 1, candidate: 1 }, { unique: true });

const moleBetSchema = Schema({
  user: { type: Schema.ObjectId, ref: "user", required: true },
  week: week,
  mole: { type: Schema.ObjectId, ref: "candidate", required: true },
});
moleBetSchema.index({ user: 1, week: 1 }, { unique: true });

export const User = model("user", userSchema);
export const Bet = model("bet", betSchema);
export const MoleBet = model("molebet", moleBetSchema);
export const Candidate = model("candidate", candidateSchema);
