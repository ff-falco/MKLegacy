// models/Tournament.js
import mongoose from "mongoose";
import { type } from "os";

const ResultSchema = new mongoose.Schema({
  serie: Number,
  station: Number,
  position: Number,
  nextposition: Number,
  nextserie: Number,
  points: Number,
});

const TemporaryResultSchema = new mongoose.Schema({
  nickname: String,
  serie: Number,
  position: Number,
  nextposition: Number,
  nextserie: Number,
  beer: { type: Boolean, default: true },
  points: Number,
});

const ParticipantSchema = new mongoose.Schema({
  id: Number,
  name: String,
  nickname: String,
  chatId: Number,
  hasPhone: { type: Boolean, default: false },
  seeding: { type: Number, default: null },
  results: { type: [ResultSchema], default: [] },
  nextserie: { type: Number, default: 1 },
  nextposition: { type: Number, default: 1 },
  points: { type: Number, default: 0 },
});

const TournamentSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  date: { type: String, required: true },
  totalPlayers: { type: Number, required: true }, // <-- deve esserci
  stations: { type: Number, required: true },
  participants: { type: [ParticipantSchema], default: [] },
  started: { type: Boolean, default: false },
  reviewed: { type: Boolean, default: false },
  race: { type: Number, default: 1 },
  bannedmaps: { type: [String], default: [] },
  temporaryResults: { type: [TemporaryResultSchema], default: [] },
  stationsPositions:{type: [Number], default: []},
  seriesCount: { type: Number, default: 0 },
  seriesIncrement:{ type: Number, default: 0 },
  seriesThreshold:{ type: Number, default: 0 },
  maxraces: { type: Number, default: 2 },
  finaleincrement: { type: [Number], default: [] },
});

export default mongoose.model("Tournament", TournamentSchema);
