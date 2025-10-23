import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import mongoose from "mongoose";
import Tournament from "./models/Tournament.js";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = 4000;
app.listen(PORT, () => console.log(`✅ Server backend in ascolto su porta ${PORT}`));
// 🔗 Connessione MongoDB
mongoose
  .connect("mongodb+srv://filippomorellimorelli_db_user:ffe1Qk7RKX0tAkB1@cluster0.oipegrc.mongodb.net/mklbot?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => console.log("✅ MongoDB connesso"))
  .catch((err) => console.error("❌ Errore connessione MongoDB:", err));

/* -------------------------- API TORNEI -------------------------- */

// ➕ Creare un nuovo torneo
app.post("/api/tournament", async (req, res) => {
  try {
    const { code, name, date, totalPlayers, stations } = req.body;

    const existing = await Tournament.findOne({ code });
    if (existing) {
      return res.status(400).json({ error: "Codice torneo già esistente" });
    }

    const newTournament = await Tournament.create({
      code,
      name,
      date,
      totalPlayers,
      stations,
      participants: [],
    });

    res.json(newTournament);
  } catch (err) {
    console.error("Errore creazione torneo:", err);
    res.status(500).json({ error: "Errore durante la creazione del torneo" });
  }
});

// 🔍 Ottenere un torneo
app.get("/api/tournament/:code", async (req, res) => {
  try {
    const t = await Tournament.findOne({ code: req.params.code });
    if (!t) return res.status(404).json({ error: "Torneo non trovato" });
    res.json(t);
  } catch (err) {
    res.status(500).json({ error: "Errore durante la ricerca del torneo" });
  }
});

// 🔍 Ottenere i partecipanti
app.get("/api/tournament/:code/players", async (req, res) => {
  try {
    const t = await Tournament.findOne({ code: req.params.code });
    res.json(t ? t.participants : []);
  } catch (err) {
    res.status(500).json({ error: "Errore durante il recupero dei partecipanti" });
  }
});

// ➕ Aggiungere un partecipante

// Aggiungi partecipante
app.post("/api/tournament/:code/join", async (req, res) => {
  const { nickname, name } = req.body;
  const t = await Tournament.findOne({ code: req.params.code });
  if (!t) return res.status(404).json({ error: "Torneo non trovato" });

  const newParticipant = { id: Date.now(), nickname:nickname, name:name };
  t.participants.push(newParticipant);
  await t.save();

  res.json(t.participants); // ritorna lista aggiornata
});

// Rimuovi partecipante
app.post("/api/tournament/:code/leave", async (req, res) => {
  const { nickname } = req.body;
  const t = await Tournament.findOne({ code: req.params.code });
  if (!t) return res.status(404).json({ error: "Torneo non trovato" });

  t.participants = t.participants.filter(p => p.nickname !== nickname);
  await t.save();

  res.json(t.participants); // ritorna lista aggiornata
});

// 🔍 Ottenere la lista di tutti i tornei
app.get("/api/tournaments", async (req, res) => {
  try {
    const tournaments = await Tournament.find({}, "-__v"); // esclude il campo __v di Mongoose
    res.json(tournaments);
  } catch (err) {
    console.error("Errore ottenimento lista tornei:", err);
    res.status(500).json({ error: "Errore durante il recupero dei tornei" });
  }
});


// 🔍 Ottenere i dati del torneo in corso
app.get("/api/tournaments", async (req, res) => {
  try {
    const tournaments = await Tournament.find({}, "-__v"); // esclude il campo __v di Mongoose
    res.json(tournaments);
  } catch (err) {
    console.error("Errore ottenimento lista tornei:", err);
    res.status(500).json({ error: "Errore durante il recupero dei tornei" });
  }
});

// 🔍 Ottenere i dati di un torneo specifico dal codice
app.get("/api/tournament/:code", async (req, res) => {
  try {
    const code = req.params.code;
    const tournament = await Tournament.findOne({ code });

    if (!tournament) return res.status(404).json({ error: "Torneo non trovato" });

    res.json(tournament);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ❌ Eliminare un torneo
app.delete("/api/tournament/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const deleted = await Tournament.findOneAndDelete({ code });

    if (!deleted) {
      return res.status(404).json({ error: "Torneo non trovato" });
    }

    res.json({ message: `Torneo '${code}' eliminato con successo.` });
  } catch (err) {
    console.error("Errore eliminazione torneo:", err);
    res.status(500).json({ error: "Errore durante l'eliminazione del torneo" });
  }
});

// Cancella tutti i tornei
app.delete("/api/tournament", async (req, res) => {
  try {
    await Tournament.deleteMany({});
    res.json({ message: "Tutti i tornei sono stati cancellati" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`✅ Server avviato su http://localhost:${PORT}`));
