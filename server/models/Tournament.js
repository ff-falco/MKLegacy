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
  manual: {type: Boolean, default : false },
  startingposition: Number,
  mapName: String,
});

const TemporaryResultSchema = new mongoose.Schema({
  nickname: String,
  serie: Number,
  position: Number,
  nextposition: Number, // Questo campo non sembra essere inviato, ma lo teniamo per ora
  nextserie: Number, // Questo campo non sembra essere inviato, ma lo teniamo per ora
  
  // Sostituiamo 'beer' con 'isManualScore'
  manual: { type: Boolean, default: false }, 
  
  // Sostituiamo 'points' (che era ambiguo) con 'manualScore'
  // Usiamo 'null' come default per indicare "non impostato"
  manualScore: { type: Number, default: null }, 
  
  startingposition: Number,
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
  temporaryResults: { type: [TemporaryResultSchema], default: [] },
  stationsPositions:{type: [Number], default: []},
  seriesCount: { type: Number, default: 0 },
  seriesIncrement:{ type: Number, default: 0 },
  seriesThreshold:{ type: Number, default: 0 },
  maxraces: { type: Number, default: 2 },
  finaleincrement: { type: [Number], default: [] },
  tierList: [
    {
      tierName: { type: String, required: true },
      probQualifica: { type: Number, required: true },
      probInterna: { type: Number, required: true },
      probFinale: { type: Number, required: true },
      mapNames: { type: [String], default: [] }
    }
  ],
  tierCode: { type: String, default: "" },
  temporaryMaps: { type: [String], default: [] },
  selectedMap: { type: String, default: "" },
  chosenMaps: { type: [String], default: [] },
  possibleMaps: { type: [[String]], default: [[]] },
});

export default mongoose.model("Tournament", TournamentSchema);
