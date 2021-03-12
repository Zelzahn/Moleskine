import mongoose from "mongoose";
import { mongoDB } from "./../config.json";

module.exports = async () => {
  await mongoose.connect(mongoDB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  return mongoose;
};
