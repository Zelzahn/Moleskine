const mongoose = require("mongoose");

const reqString = {
  type: String,
  required: true,
};

const userSchema = mongoose.Schema({
  gulidId: reqString,
  userId: reqString,
  points: Number,
  bets: Array,
});

module.exports = mongoose.model("user", userSchema);
