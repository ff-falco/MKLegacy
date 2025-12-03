import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import mongoose from "mongoose";
import Tournament from "./models/Tournament.js"; // Assicurati che il path sia corretto, qui assumiamo che sia .js
import { m } from "framer-motion";
import { start } from "repl";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ----------------------------------------------------------------------
// 🚨 MODIFICA CRITICA QUI 🚨
// 1. Porta: Usa la variabile d'ambiente PORT (tipica per l'hosting) o 4000 come fallback.
const PORT = process.env.PORT || 4000;

// 2. Connessione MongoDB: Usa una variabile d'ambiente per la stringa di connessione.
// DEV: usa la connessione locale con Docker (mongodb://localhost:27017)
// PROD: usa la stringa di Atlas (o l'URL del tuo database deployato)

/* -------------------------- CONNESSIONE MONGODB LOCALE -------------------------- */
/*
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/mklbot";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connesso (URI:", MONGO_URI, ")"))
  .catch((err) => console.error("❌ Errore connessione MongoDB:", err));


app.listen(PORT, () => console.log(`✅ Server avviato su porta ${PORT}`));

*/

/* -------------------------- CONNESSIONE MONGODB ATLAS -------------------------- */

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://filippomorellimorelli_db_user:ffe1Qk7RKX0tAkB1@cluster0.oipegrc.mongodb.net/mklbot?retryWrites=true&w=majority&appName=Cluster0";

// 🔗 Connessione MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connesso")) // Log come da tua richiesta
  .catch((err) => console.error("❌ Errore connessione MongoDB:", err));
// ----------------------------------------------------------------------



/* -------------------------- API TORNEI -------------------------- */

// ➕ Creare un nuovo torneo
app.post("/api/tournament", async (req, res) => {
  try {
    const { code, name, date, totalPlayers, stations, tiercode, startingpositions, seriescount, maxraces, tierList } = req.body;
    console.log("Ricevuti dati torneo:", { code, name, date, totalPlayers, stations, tiercode, startingpositions, seriescount, maxraces, tierList });
    console.log("Creazione torneo con posizioni iniziali:", startingpositions);
    const existing = await Tournament.findOne({ code });
    if (existing) {
      return res.status(400).json({ error: "Codice torneo già esistente" });
    }
// RIESCIA A METTERE LE STATIONSPOSITIONS NEL PUNTO GIUSTO
    const newTournament = await Tournament.create({
      code,
      name,
      date,
      totalPlayers,
      stations,
      participants: [],
      stationsPositions: startingpositions || [],
      seriesCount: seriescount || 0,
      maxraces: maxraces || 3,
      tierList: tierList || [],
    });

    res.json(newTournament);
  } catch (err) {
    console.error("Errore creazione torneo:", err);
    res.status(500).json({ error: "Errore durante la creazione del torneo" });
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


// 🔍 Ottenere i dati di un torneo specifico dal codice
app.get("/api/tournament/:code", async (req, res) => {
  const { code } = req.params;
  try {
    const tournament = await Tournament.findOne({ code });
    if (!tournament) return res.status(404).send("Torneo non trovato");
    res.json(tournament);
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore interno");
  }
});

// Inizia review torneo

// PATCH /api/tournament/:code/start
app.patch("/api/tournament/:code/start", async (req, res) => {
  const { code } = req.params;
  try {
    const tournament = await Tournament.findOne({ code });
    if (!tournament) return res.status(404).send("Torneo non trovato");

    tournament.started = true;

    await tournament.save();

    res.status(200).json({ message: "Torneo avviato", started: true });
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore interno");
  }
});


// Inizia torneo
// PATCH /api/tournament/:code/review
app.patch("/api/tournament/:code/review", async (req, res) => {
  const { code } = req.params;
  const { groups, seriesIncrement, seriesThreshold, finaleincrement } = req.body;
  
  try {
    const tournament = await Tournament.findOne({ code });
    if (!tournament) return res.status(404).send("Torneo non trovato");

    tournament.reviewed = true;
    console.log("Gruppi ricevuti per la review:", groups);
    for (let i = 0; i < tournament.participants.length; i++) {
      const participant = tournament.participants[i];
      let rigaIndex = -1;
      let colonnaIndex = -1;

      // 1. Cerca l'indice della riga che contiene l'oggetto
      rigaIndex = groups.findIndex((riga) => 
        // 2. Usa 'some' per verificare se almeno un oggetto nella riga soddisfa la condizione
        riga.some((item) => item.nickname === participant.nickname)
      );

      // Se è stata trovata la riga (rigaIndex !== -1)
      if (rigaIndex !== -1) {
        const rigaTrovata = groups[rigaIndex];
        
        // 3. Cerca l'indice dell'oggetto all'interno della riga trovata
        colonnaIndex = rigaTrovata.findIndex((item) => item.nickname === participant.nickname);
      }
      participant.nextserie = rigaIndex + 1; // +1 perché le serie partono da 1
      participant.nextposition = colonnaIndex + 1; // +1 perché le posizioni partono da 1
      }
    tournament.seriesIncrement=seriesIncrement;
    tournament.seriesThreshold=seriesThreshold;
    tournament.finaleincrement=finaleincrement;
    await tournament.save();

    res.status(200).json({ message: "Torneo avviato", reviewed: true });
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore interno");
  }
});

app.post("/api/tournament/:code/temporary-results", async (req, res) => {
  const { code } = req.params;
  const { temporaryResults, positionsTaken } = req.body;
  
  console.log("📥 Ricevuto dal client:", temporaryResults); // 👈 Log importante
  try {
    const tournament = await Tournament.findOne({ code });
    if (!tournament) return res.status(404).send("Torneo non trovato");
    tournament.temporaryResults = temporaryResults;
    tournament.stationsPositions=positionsTaken;
    tournament.markModified("temporaryResults");
    await tournament.save();

    console.log("💾 Salvato su DB:", tournament.temporaryResults); // 👈 Log dopo il salvataggio
    console.log("💾 Posizioni prese salvate su DB:", tournament.stationsPositions); // 👈 Log dopo il salvataggio
    res.status(200).json({
      message: "Risultati temporanei aggiornati",
      temporaryResults: tournament.temporaryResults,
    });
  } catch (err) {
    console.error("❌ Errore durante il salvataggio dei risultati:", err);
    res.status(500).send("Errore interno");
  }
});

app.post("/api/tournament/:code/temporary-maps", async (req, res) => {
  const { code } = req.params;
  const { temporaryMaps } = req.body;

  console.log("📥 Ricevuto dal client (maps):", temporaryMaps); // 👈 Log importante
  try {
    const tournament = await Tournament.findOne({ code });
    if (!tournament) return res.status(404).send("Torneo non trovato");
    tournament.temporaryMaps = temporaryMaps;
    tournament.markModified("temporaryMaps");
    await tournament.save();

    console.log("💾 Mappe temporanee salvate su DB:", tournament.temporaryMaps); // 👈 Log dopo il salvatagg
    res.status(200).json({
      message: "Mappe temporanee aggiornate",
      temporaryMaps: tournament.temporaryMaps,
    });
  } catch (err) {
    console.error("❌ Errore durante il salvataggio delle mappe:", err);
    res.status(500).send("Errore interno");
  }
});

app.patch("/api/tournament/:code/temporary-map-name", async (req, res) => {
  const { code } = req.params;
  const { selectedMap } = req.body;
  try {
    console.log("📥 Ricevuto dal client (map index):", selectedMap); // 👈 Log importante
    const tournament = await Tournament.findOne({ code });
    if (!tournament) return res.status(404).send("Torneo non trovato");
    tournament.selectedMap = selectedMap;
    await tournament.save();
    res.status(200).json({
      message: "Indice mappa temporanea aggiornato",
      currentMapIndex: tournament.currentMapIndex,
    });
  } catch (err) {
    console.error("❌ Errore durante l'aggiornamento dell'indice mappa:", err);
    res.status(500).send("Errore interno");
  }
});


// Implementazione rewind (DA FINIRE)
app.post("/api/tournament/:code/rewind", async (req, res) => {
  const { code } = req.params;

  try {
    const tournament = await Tournament.findOne({ code });
    if (!tournament) return res.status(404).send("Torneo non trovato");

    const { temporaryResults, participants, race } = tournament;
    let newtemporaryResults=[];

    tournament.race--;

    
    //Salva i risultati della scorsa gara come temporaryresult in questo vettore
    for (let i = 0; i < tournament.participants.length; i++) {
      
      let temporary={};
      let lastresult=tournament.participants[i].results.pop()
      temporary.nickname=tournament.participants[i].nickname
      temporary.serie=lastresult.serie
      temporary.position=lastresult.position
      temporary.manualScore=lastresult.points
      temporary.nextposition=tournament.participants[i].nextposition
      temporary.nextserie=tournament.participants[i].nextserie
      temporary.manual= lastresult.manual

      temporary.startingposition=lastresult.startingposition

      newtemporaryResults.push(temporary)
      console.log("Last result for", tournament.participants[i].nickname, ":", lastresult)
      console.log("Temporary result to push:", temporary)
      console.log("Temporary result created:", lastresult.serie, lastresult.startingposition);
      tournament.participants[i].nextserie=lastresult.serie
      tournament.participants[i].nextposition=lastresult.startingposition
      tournament.participants[i].points-=lastresult.points
    }

  
    tournament.temporaryResults = newtemporaryResults;

    tournament.temporaryMaps = tournament.possibleMaps.pop();
    tournament.selectedMap = tournament.chosenMaps.pop();
    await tournament.save();

    res.status(200).json({
      message: "Rollback eseguito",
      race: tournament.race,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore interno");
  }
});





app.post("/api/tournament/:code/qualify", async (req, res) => {
  const { code, partecipants } = req.params;

  try {
    const tournament = await Tournament.findOne({ code });
    if (!tournament) return res.status(404).send("Torneo non trovato");

    const { temporaryResults, participants, race } = tournament;
    // Ordina i temporaryResults per posizione
    temporaryResults.sort((a, b) => a.position - b.position);

    // Metti in temporaryPositions le nextserie
    const avaiablepositions=[];
    for (let i = 0; i <= tournament.seriesCount; i++) 
      avaiablepositions.push(tournament.stations);

    for (let i = 0; i < temporaryResults.length; i++) {
      // Ritorna il primo indice di avaiablepositions che è maggiore o uguale a i+1
      const nextserie = avaiablepositions.findIndex(pos => pos > 0);
      temporaryResults[i].nextserie = nextserie + 1; // +1 perché le serie partono da 1
      temporaryResults[i].nextposition = avaiablepositions[nextserie] ; // Assegna la posizione disponibile (all'inizio sono casuali)
      avaiablepositions[nextserie]--;
    }

    

    temporaryResults.forEach(tr => {
      const p = participants.find(pp => pp.nickname === tr.nickname);
      if (p) {
        p.nextserie = tr.nextserie;
        p.nextposition = tr.nextposition;
        const result = {
          serie: tr.serie,
          station: tr.position,
          position: tr.position,
          nextposition: tr.nextposition,
          nextserie: tr.nextserie,
          points: 0,
          startingposition: tr.startingposition,
        };
        console.log("Risultato qualifiche per partecipante:", p.nickname, result);
        p.results.push(result);
      }
    });

    tournament.temporaryResults = [];
    tournament.race = race + 1;
    console.log("Posizioni prese dopo le qualifiche:", tournament.stationsPositions);

    tournament.chosenMaps.push(tournament.selectedMap);
    tournament.possibleMaps.push(tournament.temporaryMaps);
    tournament.temporaryMaps = [];
    tournament.selectedMap = "";

    await tournament.save();

    res.status(200).json({
      message: "Prossima gara avviata, risultati salvati",
      race: tournament.race,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore interno");
  }
});











// ➡️ Passa alla gara successiva
app.post("/api/tournament/:code/next-race", async (req, res) => {
  const { code, partecipants } = req.params;

  try {
    const tournament = await Tournament.findOne({ code });
    if (!tournament) return res.status(404).send("Torneo non trovato");

    const { temporaryResults, participants, race , seriesIncrement, seriesThreshold} = tournament;
    // Ordina i temporaryResults per posizione
    temporaryResults.sort((a, b) => a.position - b.position);

    // Metti in temporaryPositions le nextserie
    const avaiablepositions=[];
    for (let i = 0; i <= tournament.seriesCount; i++) 
      avaiablepositions.push(tournament.stations);

    for (let i = 0; i < temporaryResults.length; i++) {
      // Ritorna il primo indice di avaiablepositions che è maggiore o uguale a i+1
      const nextserie = avaiablepositions.findIndex(pos => pos > 0);
      temporaryResults[i].nextserie = nextserie + 1; // +1 perché le serie partono da 1
      temporaryResults[i].nextposition = avaiablepositions[nextserie] ; // Assegna la posizione disponibile (all'inizio sono casuali)
      avaiablepositions[nextserie]--;
    }

    

    temporaryResults.forEach(tr => {
      const p = participants.find(pp => pp.nickname === tr.nickname);
      console.log("Calcolo nuova serie per partecipante:", p.nickname, "Serie attuale:", p.nextserie, "Posizione attuale:", tr.position);
      // Calcolo nuova serie in base alla posizione
      let newserie;
      if(tr.position<=seriesThreshold && p.nextserie>1) //promozione
        newserie=p.nextserie-1;
      else if(tr.position>(tournament.stations-seriesThreshold) && p.nextserie<tournament.seriesCount) //retrocessione
        newserie=p.nextserie+1;
      else
        newserie=p.nextserie;

      //Calcolo nuova posizione
      let newposition;
    
      
      if (seriesThreshold>0) { // se c'è un incremento di serie
        if (p.nextserie==tournament.seriesCount-1 && newserie==tournament.seriesCount){// sei retrocesso nell'ultima serie (Momentum negativo)
          newposition=tr.position;
          }

        else if(p.nextserie==2 && newserie==1){ // sei promosso nella prima serie (Momentum positivo)
          newposition=tr.position;
        }
        else{
          newposition=tournament.stations - tr.position +1;
          }
      } else { // se non c'è incremento di serie
        newposition=tournament.stations - tr.position +1;
        ;
      }
      if (p) {
        let pointsearned = 0;

        // Controlla se il risultato è manuale (come inviato dal frontend)
        // tr.isManualScore === true && tr.manualScore !== null
        // (Controlliamo anche 'tr.beer' per retrocompatibilità, sebbene il front-end usi 'isManualScore')
        if ((tr.manual === true && tr.manualScore !== null)) {
          // Usa il punteggio manuale
          // Diamo priorità ai nuovi campi 'manualScore', fallback sui vecchi 'points'
          pointsearned = tr.manualScore ?? 0;
          console.log(`Punteggio MANUALE per ${p.nickname}: ${pointsearned}`);
        } else {
          // Altrimenti, usa la formula basata sulla posizione
          pointsearned = (tournament.stations - (tr.position) + 1) + (tournament.seriesCount - tr.serie) * tournament.seriesIncrement;
          console.log(`Punteggio automatico per ${p.nickname}: ${pointsearned}`);
        }
        const result = {
          serie: tr.serie,
          station: tr.position,
          position: tr.position,
          nextposition: newposition,
          nextserie: newserie,
          points: pointsearned,
          manual: tr.manual,
          startingposition: tr.startingposition,
        };
        console.log("Risultato qualifiche per partecipante:", p.nickname, result);

        p.nextserie = newserie;
        p.nextposition = newposition;
        p.results.push(result);
        p.points += pointsearned;
      }
      console.log("Nuova serie e posizione per partecipante:", p.nickname, "Nuova serie:", p.nextserie, "Nuova posizione:", p.nextposition);
    });

    tournament.temporaryResults = [];
    tournament.race = race + 1;

    tournament.chosenMaps.push(tournament.selectedMap);
    tournament.possibleMaps.push(tournament.temporaryMaps);

    tournament.temporaryMaps = [];
    tournament.selectedMap = "";

    console.log("Posizioni prese dopo le qualifiche:", tournament.stationsPositions);
    await tournament.save();

    res.status(200).json({
      message: "Prossima gara avviata, risultati salvati",
      race: tournament.race,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore interno");
  }
});











// ➡️ Passa alla gara successiva FINALE TO DO
app.post("/api/tournament/:code/finale-preparation", async (req, res) => {
  const { code, partecipants } = req.params;

  try {
    const tournament = await Tournament.findOne({ code });
    if (!tournament) return res.status(404).send("Torneo non trovato");

    const { temporaryResults, participants, race , seriesIncrement, seriesThreshold} = tournament;
    // Ordina i temporaryResults per posizione
    temporaryResults.sort((a, b) => a.position - b.position);

    // Metti in temporaryPositions le nextserie
    const avaiablepositions=[];
    for (let i = 0; i <= tournament.seriesCount; i++) 
      avaiablepositions.push(tournament.stations);

    for (let i = 0; i < temporaryResults.length; i++) {
      // Ritorna il primo indice di avaiablepositions che è maggiore o uguale a i+1
      const nextserie = avaiablepositions.findIndex(pos => pos > 0);
      temporaryResults[i].nextserie = nextserie + 1; // +1 perché le serie partono da 1
      temporaryResults[i].nextposition = avaiablepositions[nextserie] ; // Assegna la posizione disponibile (all'inizio sono casuali)
      avaiablepositions[nextserie]--;
    }

    

    temporaryResults.forEach(tr => {
      const p = participants.find(pp => pp.nickname === tr.nickname);
      console.log("Calcolo nuova serie per partecipante:", p.nickname, "Serie attuale:", p.nextserie, "Posizione attuale:", tr.position);
      // Calcolo nuova serie in base alla posizione
      let newserie;
      if(tr.position<=seriesThreshold && p.nextserie>1) //promozione
        newserie=p.nextserie-1;
      else if(tr.position>(tournament.stations-seriesThreshold) && p.nextserie<tournament.seriesCount) //retrocessione
        newserie=p.nextserie+1;
      else
        newserie=p.nextserie;

      //Calcolo nuova posizione
      let newposition;
    
      
      if (seriesThreshold>0) { // se c'è un incremento di serie
        if (p.nextserie==tournament.seriesCount-1 && newserie==tournament.seriesCount){// sei retrocesso nell'ultima serie (Momentum negativo)
          newposition=tr.position;
          }

        else if(p.nextserie==2 && newserie==1){ // sei promosso nella prima serie (Momentum positivo)
          newposition=tr.position;
        }
        else{
          newposition=tournament.stations - tr.position +1;
          }
      } else { // se non c'è incremento di serie
        newposition=tournament.stations - tr.position +1;
        ;
      }
      if (p) {
        const p = participants.find(pp => pp.nickname === tr.nickname);
        console.log("Calcolo nuova serie per partecipante:", p.nickname, "Serie attuale:", p.nextserie, "Posizione attuale:", tr.position);


        // Calcolo nuova serie in base alla posizione(se sei nei primi 50% vai nella serie 1, altrimenti serie 2)
        let newserie= Math.floor(temporaryResults.indexOf(tr)/tournament.stations) +1;
        let modulo=(temporaryResults.indexOf(tr))%tournament.stations;
        let newposition=tournament.stations - modulo;


        let pointsearned = 0;

        // Controlla se il risultato è manuale (come inviato dal frontend)
        // tr.isManualScore === true && tr.manualScore !== null
        // (Controlliamo anche 'tr.beer' per retrocompatibilità, sebbene il front-end usi 'isManualScore')
        if ((tr.manual === true && tr.manualScore !== null)) {
          // Usa il punteggio manuale
          // Diamo priorità ai nuovi campi 'manualScore', fallback sui vecchi 'points'
          pointsearned = tr.manualScore ?? 0;
          console.log(`Punteggio MANUALE per ${p.nickname}: ${pointsearned}`);
        } else {
          // Altrimenti, usa la formula basata sulla posizione
          pointsearned = (tournament.stations - (tr.position) + 1) + (tournament.seriesCount - tr.serie) * tournament.seriesIncrement;
          console.log(`Punteggio automatico per ${p.nickname}: ${pointsearned}`);
        }
        const result = {
          serie: tr.serie,
          station: tr.position,
          position: tr.position,
          nextposition: newposition,
          nextserie: newserie,
          points: pointsearned,
          manual: tr.manual,
          startingposition: tr.startingposition,
        };
        console.log("Risultato qualifiche per partecipante:", p.nickname, result);

        p.nextserie = newserie;
        p.nextposition = newposition;
        p.results.push(result);
        p.points += pointsearned;
      }
      console.log("Nuova serie e posizione per partecipante:", p.nickname, "Nuova serie:", p.nextserie, "Nuova posizione:", p.nextposition);
    });

    tournament.temporaryResults = [];
    tournament.race = race + 1;
    console.log("Posizioni prese dopo le qualifiche:", tournament.stationsPositions);

    tournament.chosenMaps.push(tournament.selectedMap);
    tournament.possibleMaps.push(tournament.temporaryMaps);

    tournament.temporaryMaps = [];
    tournament.selectedMap = "";

    await tournament.save();

    res.status(200).json({
      message: "Prossima gara avviata, risultati salvati",
      race: tournament.race,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore interno");
  }
});





app.post("/api/tournament/:code/finale", async (req, res) => {
  const { code, partecipants } = req.params;

  try {
    const tournament = await Tournament.findOne({ code });
    if (!tournament) return res.status(404).send("Torneo non trovato");

    const { temporaryResults, participants, race , seriesIncrement, seriesThreshold} = tournament;
    // Ordina i temporaryResults per posizione
    temporaryResults.sort((a, b) => a.position - b.position);

    temporaryResults.forEach(tr => {
      const p = participants.find(pp => pp.nickname === tr.nickname);
      if (p) {
        const p = participants.find(pp => pp.nickname === tr.nickname);
        console.log("Calcolo nuova serie per partecipante:", p.nickname, "Serie attuale:", p.nextserie, "Posizione attuale:", tr.position);


        // Calcolo nuova serie in base alla posizione(se sei nei primi 50% vai nella serie 1, altrimenti serie 2)
        let newserie= Math.floor(temporaryResults.indexOf(tr)/tournament.stations) +1;
        let modulo=(temporaryResults.indexOf(tr))%tournament.stations;
        let newposition=tournament.stations - modulo;


        
        let pointsearned = 0;
        if ((tr.manual === true && tr.manualScore !== null)) {
          // Usa il punteggio manuale
          // Diamo priorità ai nuovi campi 'manualScore', fallback sui vecchi 'points'
          pointsearned = tr.manualScore ?? 0;
          console.log(`Punteggio MANUALE per ${p.nickname}: ${pointsearned}`);
        } else {
          // Altrimenti, usa la formula basata sulla posizione
          pointsearned = (tournament.stations - (tr.position)+1) * tournament.finaleincrement[tr.serie -1];
          console.log(`Punteggio automatico per ${p.nickname}: ${pointsearned}`);
        }

        const result = {
          serie: tr.serie,
          station: tr.position,
          position: tr.position,
          nextposition: newposition,
          nextserie: newserie,
          points: pointsearned,
          manual: tr.manual,
          startingposition: tr.startingposition,
        };
        
        p.nextserie = 0;
        p.nextposition = 0;
        p.results.push(result);
        p.points += pointsearned;
      }
      console.log("Nuova serie e posizione per partecipante:", p.nickname, "Nuova serie:", p.nextserie, "Nuova posizione:", p.nextposition);
    });

    tournament.temporaryResults = [];
    tournament.race = race + 1;
    console.log("Posizioni prese dopo le qualifiche:", tournament.stationsPositions);
    tournament.chosenMaps.push(tournament.selectedMap);
    tournament.possibleMaps.push(tournament.temporaryMaps);

    tournament.temporaryMaps = [];
    tournament.selectedMap = "";



    await tournament.save();

    res.status(200).json({
      message: "Prossima gara avviata, risultati salvati",
      race: tournament.race,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore interno");
  }
});



/* -------------------------- API PARTECIPANTI -------------------------- */


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

  const newParticipant = { id: Date.now(), nickname:nickname, name:name, seeding:0 };
  t.participants.push(newParticipant);
  await t.save();

  res.json(t.participants); // ritorna lista aggiornata
});

// 🔀 Cambia seeding partecipant
app.post("/api/tournament/:code/seed", async (req, res) => {
  const { nickname, seeding } = req.body;
  const t = await Tournament.findOne({ code: req.params.code });
  if (!t) return res.status(404).json({ error: "Torneo non trovato" });

  const participant = t.participants.find(p => p.nickname === nickname);
  if (participant) {
    participant.seeding = seeding;
    await t.save();
    res.json(t.participants); // ritorna lista aggiornata
  } else {
    res.status(404).json({ error: "Partecipante non trovato" });
  }
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







app.listen(PORT, () => console.log(`✅ Server avviato su porta ${PORT}`));
