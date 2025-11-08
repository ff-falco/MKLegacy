import { useEffect, useState } from "react";
import { useParams } from "react-router-dom"; // useNavigate rimosso
import axios from "axios";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

// Definizione Tipi (migliora la type safety)
interface Participant {
  nickname: string;
  name: string;
  seeding?: number;
  points?: number;
  currentPosition: number | string;
  isManualScore: boolean;
  manualScore: number | null;
  nextserie?: number;
  nextposition?: number;
}

interface Group extends Array<Participant> {}

interface Tournament {
  code: string;
  name: string;
  race: number;
  maxraces: number; // Campo aggiunto per la logica della prossima gara
  stations: number;
  participants: Participant[];
  temporaryResults: any[];
  stationsPositions?: number[];
  started: boolean;
}

// Funzione helper per creare l'array casuale senza ripetizioni
const generateRandomPositions = (size: number): number[] => {
  const positions = Array.from({ length: size }, (_, i) => i + 1);
  // Algoritmo di Fisher-Yates per mescolare
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  return positions;
};


export default function RaceManagerPage() {
  const { code } = useParams<{ code: string }>();
  // navigate rimosso per risolvere l'errore di contesto di routing

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [savedGroups, setSavedGroups] = useState<number[]>([]);
  const [editableGroups, setEditableGroups] = useState<number[]>([]);
  const [globalRanking, setGlobalRanking] = useState<any[]>([]);

  // Funzione per mostrare un messaggio modale/di conferma invece di window.alert/confirm
  const showModalMessage = (message: string, isConfirm: boolean = false): Promise<boolean> => {
    // Usiamo window.confirm/alert come fallback in questo ambiente
    // NOTA: window.alert e window.confirm non sono ideali in app moderne,
    // ma li usiamo come fallback in assenza di un sistema modale.
    if (isConfirm) {
      try {
        return Promise.resolve(window.confirm(message));
      } catch (e) {
        console.warn("window.confirm bloccato o non disponibile.", e);
        return Promise.resolve(true); // Ritorna true in caso di fallimento
      }
    }
    try {
      window.alert(message);
    } catch (e) {
      console.warn("window.alert bloccato o non disponibile.", e);
      console.log("Messaggio (fallback):", message);
    }
    return Promise.resolve(true);
  };


  useEffect(() => {
    if (!code) return;
    
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/tournament/${code}`)
      .then((res) => {
        const t: Tournament = res.data;

        console.log("Dati torneo ricevuti:", t);

        t.participants = t.participants || [];
        t.stations = t.stations || 1;
        t.temporaryResults = t.temporaryResults || [];
        // Assicuriamo che maxraces esista, come richiesto
        t.maxraces = t.maxraces || 5;
        t.stationsPositions = t.stationsPositions || [];
        if (t.stationsPositions.length === 0) {
          t.stationsPositions = Array.from({ length: t.stations }, (_, i) => i + 1);
        } 

        const globalRanking = [...(t.participants || [])]
        .sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
        setGlobalRanking(globalRanking);
        
        let distribuiti: Group[] = [];
        let completedGroups: number[] = [];
        
        // Logica di distribuzione
        if(t.race === 1){ // Ordinamento per qualifiche
            const ordered = [...t.participants].sort((a, b) => (a.seeding ?? 9999) - (b.seeding ?? 9999));
            const totalGroups = Math.ceil(ordered.length / t.stations);
            
            for (let i = 0; i < totalGroups; i++) {
                const start = i * t.stations;
                const end = start + t.stations;

                const group: Group = ordered.slice(start, end).map((p) => {
                    const tr = t.temporaryResults.find((r: any) => r.nickname === p.nickname && r.serie === i + 1);
                    return {
                        ...p,
                        currentPosition: tr?.position ?? "",
                        // Leggiamo 'manual' (dal DB) o 'beer' (vecchio)
                        isManualScore: tr?.manual ?? tr?.beer ?? false, 
                        // Leggiamo 'manualScore' (nuovo) o 'points' (vecchio)
                        manualScore: tr?.manualScore ?? tr?.points ?? null, 
                    } as Participant;
                });
                
                const groupCompleted = group.every((p) => p.currentPosition !== "");
                if (groupCompleted) completedGroups.push(i);
                distribuiti.push(group);
            }
        
        } else if(t.race > 1) { // Ordinamento per gare interne
            const maxSerie = Math.max(...t.participants.map((p: any) => p.nextserie || 1));
            
            for (let i = 1; i <= maxSerie; i++) {
                const groupParticipants = t.participants.filter((p: any) => p.nextserie === i);
                const group: Group = [];

                for (let j = 1; j <= t.stationsPositions.length; j++) {
                    let positionValue = t.stationsPositions[j-1];
                    const p = groupParticipants.find((gp: any) => gp.nextposition === positionValue);
                    if (p) {
                        const tr = t.temporaryResults.find((r: any) => r.nickname === p.nickname && r.serie === i);
                        group.push({
                            ...p,
                            currentPosition: tr?.position ?? "",
                            
                            // --- 🚨 INIZIO FIX 🚨 ---
                            // Corretto: ora legge 'tr.manual' (dal DB) e 'tr.beer' (vecchio)
                            isManualScore: tr?.manual ?? tr?.beer ?? false, 
                            // Corretto: ora legge 'tr.manualScore' (nuovo) e 'tr.points' (vecchio)
                            manualScore: tr?.manualScore ?? tr?.points ?? null, 
                            // --- 🚨 FINE FIX 🚨 ---

                        } as Participant);
                    }
                }
                const groupCompleted = group.every((p) => p.currentPosition !== "");
                if (groupCompleted) completedGroups.push(i - 1);
                distribuiti.push(group);
            }
        }
        
        setTournament({ ...t });
        setGroups(distribuiti);
        setSavedGroups(completedGroups);

      })
      .catch(console.error);
  }, [code]);

  const handleChangePosition = (nickname: string, groupIndex: number, position: number) => {
    setGroups((prevGroups) => {
      // FIX: Aggiornamento immutabile usando map
      return prevGroups.map((group, index) => {
        if (index !== groupIndex) {
          return group;
        }
        
        return group.map((participant) => {
          if (participant.nickname !== nickname) {
            return participant;
          }

          return {
            ...participant,
            currentPosition: position,
          };
        });
      });
    });
  };

  // --- FUNZIONI MODIFICATE/AGGIUNTE ---

  // Sostituisce handleToggleBeer
  const handleToggleManualScore = (nickname: string, groupIndex: number) => {
    setGroups((prevGroups) => {
      // FIX: Aggiornamento immutabile usando map
      return prevGroups.map((group, index) => {
        // Se non è il gruppo giusto, ritorna il gruppo originale
        if (index !== groupIndex) {
          return group;
        }

        // Se è il gruppo giusto, mappa i partecipanti
        return group.map((participant) => {
          // Se non è il partecipante giusto, ritorna l'originale
          if (participant.nickname !== nickname) {
            return participant;
          }

          // Se è il partecipante giusto, crea un *nuovo* oggetto
          const newIsManualScore = !participant.isManualScore;
          return {
            ...participant,
            isManualScore: newIsManualScore,
            manualScore: newIsManualScore ? participant.manualScore : null, // Azzera se deselezionato
          };
        });
      });
    });
  };

  // Nuova funzione per gestire l'input numerico
  const handleChangeManualScore = (nickname: string, groupIndex: number, score: string) => {
    setGroups((prevGroups) => {
      // FIX: Aggiornamento immutabile usando map
      return prevGroups.map((group, index) => {
        if (index !== groupIndex) {
          return group;
        }

        return group.map((participant) => {
          if (participant.nickname !== nickname) {
            return participant;
          }

          // Ritorna un *nuovo* oggetto partecipante
          return {
            ...participant,
            manualScore: score === "" ? null : Number(score),
          };
        });
      });
    });
  };
  // ------------------------------------


  const handleSaveGroupResults = (groupIndex: number) => {
    const group = groups[groupIndex];
    if (!group || !tournament) return;
  
    const positionsTaken = group
      .filter((p) => p.currentPosition)
      .map((p) => p.currentPosition);

    console.log("Posizioni prese nel gruppo:", positionsTaken);

    // Payload aggiornato per il backend
    const groupResults = group
      .filter((p) => p.currentPosition)
      .map((p) => ({
        nickname: p.nickname,
        serie: groupIndex + 1,
        position: Number(p.currentPosition), // Assicurati sia un numero
        
        // --- 🚨 INIZIO FIX 🚨 ---
        // Mappa lo stato 'isManualScore' al campo 'manual' del DB
        manual: p.isManualScore , 
        // Se è manuale, salva il punteggio (o 0 se vuoto).
        // Se NON è manuale, salva 'null'.
        manualScore: p.isManualScore ? (p.manualScore ?? 0) : null,
        // --- 🚨 FINE FIX 🚨 ---
        
        startingposition: p.nextposition || 0,
      }));
  
    let updatedTemporaryResults = [...(tournament?.temporaryResults || [])];
    updatedTemporaryResults = updatedTemporaryResults.filter(
      (r) => r.serie !== groupIndex + 1
    );
    updatedTemporaryResults = [...updatedTemporaryResults, ...groupResults];
  
    axios
      .post(`${import.meta.env.VITE_API_URL}/api/tournament/${code}/temporary-results`, {
        temporaryResults: updatedTemporaryResults,
        positionsTaken: positionsTaken,
      })
      .then(() => {
        setTournament((prev: any) => ({
          ...prev,
          temporaryResults: updatedTemporaryResults,
        }));
        setSavedGroups((prev) => [...new Set([...prev, groupIndex])]);
        setEditableGroups((prev) => prev.filter((g) => g !== groupIndex));
      })
      .catch(console.error);
    
    // Aggiornamento locale per l'effetto di riordino
    const updatedTournament = {
      ...tournament!, // Usiamo l'operatore non-null, assumendo che esista
      temporaryResults: updatedTemporaryResults,
      stationsPositions: positionsTaken as number[]
    }

    setGroups((prevGroups) => {
      const newGroups = [...prevGroups];
      const nextGroup = newGroups[groupIndex + 1];
      
      // Questo è l'array delle POSIZIONI DI ARRIVO del gruppo corrente (es. [3, 1, 4, 2])
      const arrivalPositions = updatedTournament.stationsPositions || [];

      // Se non c'è un gruppo successivo o non ci sono posizioni, esci.
      if (!nextGroup || arrivalPositions.length === 0) return newGroups;
  
      // --- 🚨 INIZIO FIX LOGICA RIORDINO 🚨 ---

      // Creiamo un array vuoto per il gruppo riordinato.
      // La sua lunghezza deve corrispondere a quante posizioni abbiamo.
      const reorderedGroup: (Participant | null)[] = Array(arrivalPositions.length).fill(null);

      // Iteriamo sull'array delle POSIZIONI DI ARRIVO (es. [3, 1, 4, 2])
      // 'arrivalPosValue' = 3, 'index' = 0
      // 'arrivalPosValue' = 1, 'index' = 1
      // 'arrivalPosValue' = 4, 'index' = 2
      // 'arrivalPosValue' = 2, 'index' = 3
      arrivalPositions.forEach((arrivalPosValue, index) => {
        
        // Troviamo nel GRUPPO SUCCESSIVO (nextGroup) il partecipante
        // che ha come 'nextposition' il valore 'arrivalPosValue'.
        //
        // Esempio (index 0):
        // Cerca in 'nextGroup' il partecipante con 'p.nextposition === 3'
        const participantToMove = nextGroup.find(p => p.nextposition === arrivalPosValue);

        if (participantToMove) {
          // Inserisci il partecipante trovato nella RIGA 'index'
          // (Alla riga 0 va il partecipante con nextposition 3)
          reorderedGroup[index] = participantToMove;
        }
      });
  
      // Sostituisci il vecchio 'nextGroup' con quello riordinato.
      // Filtriamo i 'null' per sicurezza, nel caso ci fosse una discrepanza
      // tra la lunghezza di arrivalPositions e il numero di partecipanti in nextGroup.
      newGroups[groupIndex + 1] = reorderedGroup.filter(p => p !== null) as Group;
      
      // --- 🚨 FINE FIX LOGICA RIORDINO 🚨 ---
  
      return newGroups;
    });
    
  };




  const handleRewind = async () => {
    if (!tournament) return;
    
    
    const confirmationText = "⚠️ Sei sicuro di voler tornare indietro? Tutti i risultati di questa gara verranno persi definitivamente.";

    // Usiamo la funzione helper per la conferma
    const conferma = await showModalMessage(confirmationText, true);

    if (!conferma) return;

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/tournament/${code}/rewind`);
      showModalMessage("✅ Tutti i risultati sono stati ripristinati");
      // Ricarica la pagina per aggiornare lo stato del torneo
      window.location.reload();
    } catch (err) {
      console.error(err);
      showModalMessage("❌ Errore durante il passaggio alla prossima azione del torneo.");
    }
  };


  // ✅ FUNZIONE PER ASSEGNARE RISULTATI CASUALI (Aggiornata)
  const handleRandomizeGroupResults = (groupIndex: number) => {
    setGroups(prevGroups => {
      const newGroups = [...prevGroups];
      const group = newGroups[groupIndex];
      if (!group) return prevGroups;

      const groupSize = group.length;
      const randomPositions = generateRandomPositions(groupSize);

      const updatedGroup: Participant[] = group.map((p, i) => {
        const isManual = Math.random() < 0.2; // 20% di probabilità di punteggio manuale
        return {
          ...p,
          currentPosition: randomPositions[i], // Assegna la posizione casuale univoca
          isManualScore: isManual, // AGGIUNTO
          manualScore: isManual ? Math.floor(Math.random() * 100) : null, // AGGIUNTO (punteggio casuale 0-99)
        };
      });

      newGroups[groupIndex] = updatedGroup;
      return newGroups;
    });
  };
  // ----------------------------------------------------

  // --- FUNZIONE PER SALTARE IL RIORDINO (NUOVA) ---
  const handleSkipReordering = async () => {
    const conferma = await showModalMessage(
      "⚠️ Sei sicuro di voler saltare il riordino? La lista dei partecipanti per tutte le serie non ancora salvate sarà riordinata in base alla posizione di partenza prevista (nextposition).",
      true
    );

    if (!conferma || !tournament) return;

    // Applica il riordino "standard" a tutti i gruppi non ancora salvati
    setGroups((prevGroups) => {
      const newGroups = [...prevGroups];
      
      // Itera su tutti i gruppi
      for (let i = 0; i < newGroups.length; i++) {
        // Se il gruppo è già stato salvato, saltalo
        if (savedGroups.includes(i)) continue;

        let group = newGroups[i];
        
        // Riordina i partecipanti del gruppo in base alla loro posizione di partenza prevista (nextposition)
        // Questo riporta l'ordine a quello "previsto" (1a riga -> 1° di nextposition, 2a riga -> 2° di nextposition)
        const reorderedGroup = [...group].sort((a, b) => (a.nextposition ?? 9999) - (b.nextposition ?? 9999));
        
        // Sostituisci il gruppo non salvato con la versione riordinata
        newGroups[i] = reorderedGroup;
      }
      
      showModalMessage("✅ Riordino saltato! Le serie non salvate sono state allineate per posizione di partenza.");
      return newGroups;
    });
  };
  // --------------------------------------------------

  const toggleEditGroup = (groupIndex: number) => {
    if (editableGroups.includes(groupIndex)) {
      setEditableGroups((prev) => prev.filter((i) => i !== groupIndex));
    } else {
      setEditableGroups((prev) => [...prev, groupIndex]);
      setSavedGroups((prev) => prev.filter((i) => i !== groupIndex)); // togli il gruppo dai salvati quando entri in edit
    }
  };

  // Determina il testo del pulsante in base a race e maxraces (LOGICA REINSERITA)
  const getNextRaceButtonText = () => {
    if (!tournament) return "Caricamento...";
    
    // Ultima gara prima della finale (Gara maxraces - 1)
    if (tournament.race === tournament.maxraces - 1) {
      return "🏆 Vai alla Finale";
    }

    // Gara Finale (Gara maxraces)
    if (tournament.race === tournament.maxraces) {
      return "✅ Termina Torneo";
    }

    // --- 🚨 INIZIO FIX 🚨 ---
    // Aggiunto controllo per torneo terminato
    if( tournament.race > tournament.maxraces){
      return "✅ Torneo Terminato";
    }
    // --- 🚨 FINE FIX 🚨 ---

    // Gara intermedia
    return "⏭ Prossima Gara";
  };
  
  // Determina l'azione da eseguire al click del pulsante (LOGICA REINSERITA)
  const handleNextAction = async () => {
    if (!tournament) return;

    // --- 🚨 INIZIO FIX 🚨 ---
    // Aggiunto controllo per evitare azioni se il torneo è già terminato
    if (tournament.race > tournament.maxraces) {
      showModalMessage("Il torneo è già terminato.");
      return;
    }
    // --- 🚨 FINE FIX 🚨 ---
    
    const isQualifyingRace = tournament.race === 1;
    const isFinalRace = tournament.race === tournament.maxraces;
    const nextIsFinalRace = tournament.race === tournament.maxraces - 1;
    
    const confirmationText = isFinalRace 
      ? "⚠️ Sei sicuro di voler terminare il torneo? Tutti i risultati verranno salvati in modo definitivo e la classifica finale sarà stabilita."
      : "⚠️ Sei sicuro di voler passare alla prossima gara? Tutti i risultati correnti verranno salvati in modo definitivo.";

    // Usiamo la funzione helper per la conferma
    const conferma = await showModalMessage(confirmationText, true);

    if (!conferma) return;

    try {
      if (isFinalRace) {
        // Chiamata per terminare il torneo
        await axios.post(`${import.meta.env.VITE_API_URL}/api/tournament/${code}/finale`); 
        showModalMessage("✅ Torneo terminato! La classifica finale è disponibile.");
      } else if (isQualifyingRace) {
        // Qualifiche (Gara 1)
        await axios.post(`${import.meta.env.VITE_API_URL}/api/tournament/${code}/qualify`);
        showModalMessage("✅ Tutti i risultati sono stati salvati! Si passa alla prossima gara.");

      } else if (nextIsFinalRace) {
        // Ultima gara prima della finale
        await axios.post(`${import.meta.env.VITE_API_URL}/api/tournament/${code}/finale-preparation`);
        showModalMessage("✅ Tutti i risultati sono stati salvati! Si passa alla Finale.");
    
      }else {
        // Gara intermedia (race > 1 e non finale)
        await axios.post(`${import.meta.env.VITE_API_URL}/api/tournament/${code}/next-race`);
        showModalMessage("✅ Tutti i risultati sono stati salvati! Si passa alla prossima gara.");
      }
      
      // Ricarica la pagina per aggiornare lo stato del torneo
      window.location.reload();
    } catch (err) {
      console.error(err);
      showModalMessage("❌ Errore durante il passaggio alla prossima azione del torneo.");
    }
  };


  const allGroupsSaved = savedGroups.length === groups.length;
  
  if (!tournament) {
    return <div className="flex items-center justify-center min-h-screen text-gray-600">Caricamento torneo...</div>;
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-b from-white to-blue-50 p-6">
      <h1 className="text-3xl font-bold mb-2">{tournament.name} — Race Manager</h1>
      <p className="text-gray-600 mb-6">
        <strong>Codice:</strong> {tournament.code} — <strong>Postazioni:</strong> {tournament.stations} —{" "}
        <strong>Giocatori:</strong> {tournament.participants.length}
        
        {/* --- 🚨 INIZIO FIX 🚨 --- */}
        {/* Logica aggiornata per mostrare Gara/Finale/Qualifiche */}
        <strong> {tournament.race <= tournament.maxraces ? "— Gara:" : ""} </strong> 
        {tournament.race <= tournament.maxraces 
          ? ( tournament.race === 1 
              ? "Qualifiche" 
              : (tournament.race === tournament.maxraces 
                  ? "Finale" 
                  : `${tournament.race} / ${tournament.maxraces}`)
            ) 
          : "Terminato"}
        {/* --- 🚨 FINE FIX 🚨 --- */}
      </p>
      
      {/* Condizionale: Mostra la gestione dei gruppi SOLO se il torneo non è terminato */}
      {tournament.race<=tournament.maxraces && (
        <div className="grid gap-6 w-full max-w-5xl" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
        {groups.map((group, i) => {
          const prevGroupSaved = i === 0 || savedGroups.includes(i - 1);
          const isEditable = editableGroups.includes(i);
          const locked = savedGroups.includes(i) && !isEditable;

          const allPositionsFilled = group.every((p) => p.currentPosition !== "");

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl shadow-md p-4 border ${
                locked ? "bg-gray-100" : "bg-white"
              } border-gray-200 relative`}
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-semibold">
                ♦️ Serie {String.fromCharCode('A'.charCodeAt(0) + i )} {savedGroups.includes(i) && "✅"}
                </h3>

                {savedGroups.includes(i) && (
                  <button onClick={() => toggleEditGroup(i)} className="text-blue-600 hover:text-blue-800">
                    ✏️
                  </button>
                )}
              </div>
              
              {/* PULSANTE CASUALE */}
              <Button
                variant="outline"
                onClick={() => handleRandomizeGroupResults(i)}
                disabled={locked}
                className={`w-full mb-3 text-sm border-dashed ${locked ? "opacity-50 cursor-not-allowed" : "hover:bg-yellow-50"}`}
              >
                🎲 Assegna Risultati Casuali
              </Button>
              {/* ---------------------------- */}


              <ul className="space-y-2">
                {group.map((p) => {
                  const taken = group.map((x) => x.currentPosition).filter((v) => v);
                  return (
                          // *** INIZIO MODIFICA JSX ***
                          // Modificato 'items-center' in 'items-start' per un migliore allineamento
                          // con i nuovi controlli multi-linea
                          <motion.li
                            key={p.nickname}
                            layout
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className="p-2 rounded-md bg-blue-50 flex justify-between items-start"
                          >
                            <span className="pt-1">
                              <strong>{p.seeding ? `#${p.seeding}` : `(${p.nextposition})`}</strong> {p.name} ({p.nickname})
                            </span>
                            
                            {/* Modificato 'items-center' in 'items-start' */}
                            <div className="flex gap-2 items-start">
                              
                              <select
                                value={p.currentPosition}
                                disabled={locked || !prevGroupSaved}
                                onChange={(e) =>
                                  handleChangePosition(p.nickname, i, Number(e.target.value))
                                }
                                className={`border rounded px-2 py-1 text-sm ${
                                  locked || !prevGroupSaved
                                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                                    : "bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                }`}
                              >
                                <option value="">Posizione</option>
                                {Array.from({ length: group.length }, (_, j) => {
                                  const positionValue = j + 1;
                                  const isTaken = taken.includes(positionValue);
                                  const isCurrent = p.currentPosition === positionValue;
                                  
                                  if (!isTaken || isCurrent) {
                                      return (
                                          <option key={positionValue} value={positionValue}>
                                              {positionValue}
                                          </option>
                                      );
                                  }
                                  return null;
                                })}
                              </select>

                              {/* Sostituzione della "beer" label */}
                            {tournament.race>1 && (
                              <div className="flex flex-col items-end gap-1">
                                <label className="bg-white text-black flex items-center cursor-pointer select-none text-sm whitespace-nowrap">
                                  <input
                                    type="checkbox"
                                    checked={p.isManualScore}
                                    disabled={locked || !prevGroupSaved}
                                    onChange={() => handleToggleManualScore(p.nickname, i)}
                                    className="mr-1"
                                  />
                                  Manuale
                                </label>

                                {/* Input numerico condizionale */}
                                {p.isManualScore && (
                                  <input
                                    type="number"
                                    placeholder="Punti"
                                    value={p.manualScore ?? ""}
                                    disabled={locked || !prevGroupSaved}
                                    onChange={(e) =>
                                      handleChangeManualScore(p.nickname, i, e.target.value)
                                    }
                                    // --- 🚨 INIZIO FIX 🚨 ---
                                    // Rimosso 'text-white' che rendeva il testo invisibile
                                    className="bg-white text-black border rounded px-2 py-1 text-sm w-24" 
                                    // --- 🚨 FINE FIX 🚨 ---
                                  />
                                )}
                              </div>
                            )}
                              {/* Fine sostituzione */}

                            </div>
                          </motion.li>
                          // *** FINE MODIFICA JSX ***
                        );
                      })}
              </ul>


              <Button
                variant="default"
                onClick={() => handleSaveGroupResults(i)}
                disabled={!allPositionsFilled || locked || !prevGroupSaved}
                className={`mt-4 w-full ${
                  !allPositionsFilled || locked || !prevGroupSaved ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                💾 Salva risultati
              </Button>
            </motion.div>
          );
        })}
      </div>
      )}

      {/* CLASSIFICA GLOBALE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl mt-10 p-4 bg-white shadow-md rounded-2xl border border-gray-200"
      >
        <h2 className="text-xl font-bold mb-4">🏆 Classifica Generale</h2>

        {/* --- 🚨 INIZIO FIX 🚨 --- */}
        {/* Modifica layout per colonne */}
        <ul className="columns-2 md:columns-4 gap-x-6">
          {globalRanking.map((p, idx) => (
            <li
              key={p.nickname}
              className="flex justify-between p-2 rounded-lg bg-gray-50 break-inside-avoid mb-2"
            >
              <span className="font-semibold">
                {idx + 1}. {p.name} ({p.nickname})
              </span>
              <span className="text-blue-600 font-bold">
                {p.points ?? 0} pts
              </span>
            </li>
          ))}
        </ul>
        {/* --- 🚨 FINE FIX 🚨 --- */}

      </motion.div>
      {/* FINE CLASSIFICA GLOBALE */}

      <div className="flex justify-center gap-4 mt-8">
        <button
          className="bg-gray-400 text-white px-6 py-2 rounded disabled:opacity-50"
          disabled={tournament.race === 1}
          onClick={handleRewind}
        >
          ⬅️ Torna indietro
        </button>
        
        {/* --- 🚨 INIZIO FIX 🚨 --- */}
        {/* Pulsanti visibili SOLO se le gare non sono terminate */}
        {tournament && tournament.race <= tournament.maxraces && (
          <>
            {/* NUOVO PULSANTE AGGIUNTO */}
            <Button
              variant="outline"
              onClick={handleSkipReordering}
              disabled={allGroupsSaved} // Disabilita se tutti i gruppi sono già salvati
              className={`bg-red-500 text-white hover:bg-red-600 border-red-700 disabled:opacity-50 ${allGroupsSaved ? "cursor-not-allowed" : ""}`}
            >
              🚫 Salta riordino (LAN interrotta)
            </Button>
            {/* FINE NUOVO PULSANTE */}

            <Button
                variant="default"
                disabled={!allGroupsSaved}
                className={!allGroupsSaved ? "opacity-50 cursor-not-allowed" : ""}
                onClick={handleNextAction} // onClick ora gestisce internamente se il torneo è finito
              >
                {getNextRaceButtonText()}
              </Button>
          </>
        )}
        {/* --- 🚨 FINE FIX 🚨 --- */}

      </div>

    </div>
  );
}