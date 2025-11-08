import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { Button } from "@/components/ui/button";

interface Participant {
  id: number;
  nickname: string;
  name: string;
  seeding?: number;
}

export default function TournamentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { code, fromCreate } = location.state as { code?: string; fromCreate?: boolean };

  const [tournament, setTournament] = useState<any>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newParticipant, setNewParticipant] = useState({ nickname: "", name: "" });
  const [showForm, setShowForm] = useState(false);

  // --- 🚨 1. FUNZIONE MODALE (AGGIUNTA) 🚨 ---
  // Aggiunta per sostituire alert/confirm
  const showModalMessage = (message: string, isConfirm: boolean = false): Promise<boolean> => {
    if (isConfirm) {
      try {
        return Promise.resolve(window.confirm(message));
      } catch (e) {
        console.warn("window.confirm bloccato.", e);
        return Promise.resolve(true); // Falla passare in caso di errore
      }
    }
    try {
      window.alert(message);
    } catch (e) {
      console.warn("window.alert bloccato.", e);
      console.log("Messaggio (fallback):", message);
    }
    return Promise.resolve(true);
  };
  // --- 🚨 FINE 🚨 ---


  useEffect(() => {
    if (fromCreate) {
      const stored = localStorage.getItem("tournamentData");
      if (stored) {
        const t = JSON.parse(stored);
        setTournament(t);
        setParticipants(t.participants ?? []);
      }
    } else if (code) {
      axios
        .get(`${import.meta.env.VITE_API_URL}/api/tournament/${code}`)
        .then((res) => {
          const t = res.data;
          setTournament(t);
          setParticipants(t.participants ?? []);
        })
        .catch((err) => console.error(err));
    }
  }, [code, fromCreate]);

  if (!tournament) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600">
        Torneo non trovato.
      </div>
    );
  }

  const totalPlayers = Number(tournament.totalPlayers);
  const slots = Array.from({ length: totalPlayers }, (_, i) => participants[i] ?? null);
  
  // --- 🚨 2. CONTROLLO TORNEO PIENO (AGGIUNTO) 🚨 ---
  const isFull = participants.length >= totalPlayers;
  // --- 🚨 FINE 🚨 ---


  // --- FUNZIONE CAMBIA SEEDING ---
  const handleChangeSeeding = (nickname: string, seeding: number) => {
    axios
      .post(`${import.meta.env.VITE_API_URL}/api/tournament/${tournament.code}/seed`, { nickname, seeding })
      .then(() => axios.get(`${import.meta.env.VITE_API_URL}/api/tournament/${tournament.code}`))
      .then((res) => setParticipants(res.data.participants ?? []))
      .catch((err) => console.error(err));
  };

  // --- FUNZIONE AGGIUNGI PARTECIPANTE (MODIFICATA CON TRIM) ---
  const handleAddParticipant = async () => {
    // --- 🚨 INIZIO FIX: TRIM 🚨 ---
    // 1. Pulisci gli input dagli spazi vuoti
    const trimmedName = newParticipant.name.trim();
    const trimmedNickname = newParticipant.nickname.trim();

    // 2. Controlla se (dopo il trim) sono vuoti
    if (!trimmedName || !trimmedNickname) {
      await showModalMessage("❌ Nome e Nickname non possono essere vuoti.");
      return;
    }
    // --- 🚨 FINE FIX: TRIM 🚨 ---

    // --- 🚨 CONTROLLI POSTI E NICKNAME 🚨 ---
    if (isFull) {
      await showModalMessage("❌ Il torneo è pieno. Non puoi aggiungere altri partecipanti.");
      return;
    }

    // --- 🚨 INIZIO FIX: TRIM 🚨 ---
    // 3. Controlla i duplicati usando i valori puliti (confronta trim vs trim)
    const nicknameExists = participants.some(
      (p) => p.nickname.trim().toLowerCase() === trimmedNickname.toLowerCase()
    );
    // --- 🚨 FINE FIX: TRIM 🚨 ---

    if (nicknameExists) {
      await showModalMessage("❌ Esiste già un partecipante con questo nickname. Scegline un altro.");
      return;
    }
    // --- 🚨 FINE 🚨 ---
  
    axios
      // --- 🚨 INIZIO FIX: TRIM 🚨 ---
      // 4. Invia i dati puliti (trimmed) al backend
      .post(`${import.meta.env.VITE_API_URL}/api/tournament/${tournament.code}/join`, {
        name: trimmedName,
        nickname: trimmedNickname
      })
      // --- 🚨 FINE FIX: TRIM 🚨 ---
      .then(() => {
        // GET per aggiornare i partecipanti
        return axios.get(`${import.meta.env.VITE_API_URL}/api/tournament/${tournament.code}`);
      })
      .then((res) => {
        const updated = res.data.participants ?? [];
        setParticipants(updated);
        setShowForm(false);
        setNewParticipant({ nickname: "", name: "" });
      })
      .catch((err) => console.error(err));
  };

  // --- FUNZIONE AGGIUNGI MOCK PARTECIPANTI (MODIFICATA) ---
  const handleAddMockParticipants = async () => {
    if (!tournament) return;

    const remainingSlots = Number(tournament.totalPlayers) - participants.length;
    if (remainingSlots <= 0) {
      await showModalMessage("Il torneo è già pieno!");
      return;
    }

    const mockParticipants = Array.from({ length: remainingSlots }, (_, i) => ({
      name: `Giocatore ${participants.length + i + 1}`,
      nickname: `nick${participants.length + i + 1}`,
      seeding: null, // Lasciamo che il seeding venga impostato dopo
    }));

    try {
      // Aggiungiamo in sequenza tutti i giocatori mock
      for (const p of mockParticipants) {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/tournament/${tournament.code}/join`, p);
      }

      // Poi aggiorniamo i partecipanti dal server
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/tournament/${tournament.code}`);
      setParticipants(res.data.participants ?? []);
      await showModalMessage("Giocatori mock aggiunti con successo!");
    } catch (err) {
      console.error(err);
    }
  };

  // --- FUNZIONE RIMUOVI PARTECIPANTE (MODIFICATA) ---
  const handleRemoveParticipant = async (nickname: String) => {
    // Aggiunta conferma
    const ok = await showModalMessage(`Sei sicuro di voler rimuovere ${nickname}?`, true);
    if (!ok) return;

    axios
      .post(`${import.meta.env.VITE_API_URL}/api/tournament/${tournament.code}/leave`, { nickname })
      .then(() => axios.get(`${import.meta.env.VITE_API_URL}/api/tournament/${tournament.code}`))
      .then((res) => {
        setParticipants(res.data.participants ?? []);
      })
      .catch((err) => console.error(err));
  };
  
  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center text-center max-h-[90vh] overflow-hidden">
        <h1 className="text-3xl font-bold mb-2">{tournament.name}</h1>
        <p className="text-gray-600 mb-4">
          <strong>Data:</strong> {tournament.date} —{" "}
          <strong>Giocatori previsti:</strong> {tournament.totalPlayers}
          <strong> — Numero Gare:</strong> {tournament.maxraces}
        </p>

        {/* --- 🚨 4. CODICE RESO EVIDENTE (MODIFICATO) 🚨 --- */}
        <div className="mb-6 text-center">
          <span className="text-sm font-medium text-gray-600 uppercase">Codice Torneo:</span>
          <span className="ml-2 inline-block bg-blue-100 text-blue-800 text-2xl font-bold px-4 py-1 rounded-full">
            {tournament.code}
          </span>
        </div>
        {/* --- 🚨 FINE 🚨 --- */}


        {/* Lista partecipanti */}
        <div className="w-full flex-1 overflow-y-auto border border-gray-200 rounded-xl p-4 mb-6 shadow-inner bg-gray-50">
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}
          >
            {slots.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`rounded-xl border p-4 shadow-sm min-h-[120px] flex flex-col justify-center items-center ${
                  p ? "bg-blue-100" : "bg-gray-100 text-gray-400"
                }`}
              >
                {p ? (
                  <>
                    <span className="font-semibold text-gray-800">{p.name}</span>
                    <span className="text-sm text-gray-500">{p.nickname}</span>
                    {/* Seeding Selector */}
                    <select
                      className="mt-2 border rounded-md px-2 py-1 text-sm bg-white text-black bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      value={p.seeding ? String(p.seeding) : ""}
                      onChange={(e) => handleChangeSeeding(p.nickname, Number(e.target.value))}
                    >
                      <option value="">Seeding</option>
                      {Array.from({ length: totalPlayers }, (_, j) => j + 1)
                        .filter(
                          (s) =>
                            !participants.some(
                              (other) => other.seeding === s && other.nickname !== p.nickname
                            )
                        )
                        .map((s) => (
                          <option key={s} value={String(s)}>
                            {s}
                          </option>
                        ))}
                    </select>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveParticipant(p.nickname)}
                      className="mt-2"
                    >
                      ❌
                    </Button>
                  </>
                ) : (
                  <motion.div
                    className="flex flex-col items-center justify-center gap-1 text-gray-400"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  >
                    <span>In attesa...</span>
                    <div className="flex gap-1">
                      <span>•</span>
                      <span>•</span>
                      <span>•</span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Form per aggiungere partecipante */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-80 space-y-4">
              <h3 className="text-lg font-semibold mb-3">Nuovo partecipante</h3>
              <input
                type="text"
                placeholder="Nome"
                value={newParticipant.name}
                onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
                // --- 🚨 5. FIX: RIMOSSO text-white (BUG) 🚨 ---
                className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Nickname"
                value={newParticipant.nickname}
                onChange={(e) => setNewParticipant({ ...newParticipant, nickname: e.target.value })}
                // --- 🚨 5. FIX: RIMOSSO text-white (BUG) 🚨 ---
                className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-4 mt-4">
                <Button variant="default" onClick={handleAddParticipant} className="flex-1">✅ Aggiungi</Button>
                <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">❌ Annulla</Button>
              </div>
            </div>
          </div>
        )}

        {/* --- 🚨 6. BOTTONI AGGIUNTA CONDIZIONALI (MODIFICATO) 🚨 --- */}
        {!isFull ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="default" onClick={() => setShowForm(true)}>➕ Aggiungi partecipante</Button>
            <Button
              variant="secondary"
              onClick={handleAddMockParticipants}
            >
              🧩 Aggiungi partecipanti di test
            </Button>
          </div>
        ) : (
          <p className="text-lg font-semibold text-green-600">✅ Torneo Pieno!</p>
        )}
        {/* --- 🚨 FINE 🚨 --- */}


        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
          <Button
            variant="default"
            disabled={!isFull || tournament.started}
            onClick={async () => { // Aggiunto async
              // Modificato per usare showModalMessage
              const ok = await showModalMessage("Vuoi andare al pre-torneo?", true);
              if (!ok) return;

              // Aggiorna lo stato nel DB
              axios
                .patch(`${import.meta.env.VITE_API_URL}/api/tournament/${tournament.code}/start`)
                .then(() => {
                  setTournament((prev: any) => ({ ...prev, started: true })); // aggiorna anche lo stato locale
                  navigate(`/pretournament/${tournament.code}`);
                })
                .catch((err) => console.error(err));
            }}
            className={!isFull || tournament.started ? "opacity-50 cursor-not-allowed" : ""}
          >
            🏁 Avvia torneo
          </Button>


          <Button
            variant="destructive"
            onClick={async () => { // Aggiunto async
              // Modificato per usare showModalMessage
              const ok = await showModalMessage("Sei sicuro di voler cancellare il torneo? Questa azione non è reversibile.", true);
              if (!ok) return;

              axios
                .delete(`${import.meta.env.VITE_API_URL}/api/tournament/${tournament.code}`)
                .then(() => {
                  showModalMessage("Torneo cancellato!");
                  navigate("/"); // Usiamo navigate
                })
                .catch((err) => console.error(err));
            }}
          >
            ❌ Cancella torneo
          </Button>
        </div>
      </div>
    </div>
  );
}