// models/Tournament.js
import mongoose from "mongoose";

const ParticipantSchema = new mongoose.Schema({
  id: Number,
  name: String,
  nickname: String,
  chatId: Number,
  hasPhone: { type: Boolean, default: false },
  seeding: { type: Number, default: null },
});

const TournamentSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  date: { type: String, required: true },
  totalPlayers: { type: Number, required: true }, // <-- deve esserci
  stations: { type: Number, required: true },
  participants: { type: [ParticipantSchema], default: [] },
  started: { type: Boolean, default: false },
});

export default mongoose.model("Tournament", TournamentSchema);
