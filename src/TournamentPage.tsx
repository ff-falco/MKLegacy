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
        .get(`http://localhost:4000/api/tournament/${code}`)
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

  // --- FUNZIONE CAMBIA SEEDING ---
  const handleChangeSeeding = (nickname: string, seeding: number) => {
    axios
      .post(`http://localhost:4000/api/tournament/${tournament.code}/seed`, { nickname, seeding })
      .then(() => axios.get(`http://localhost:4000/api/tournament/${tournament.code}`))
      .then((res) => setParticipants(res.data.participants ?? []))
      .catch((err) => console.error(err));
  };

  // --- FUNZIONE AGGIUNGI PARTECIPANTE ---
  const handleAddParticipant = () => {
    if (!newParticipant.name || !newParticipant.nickname) return;
  
    axios
      .post(`http://localhost:4000/api/tournament/${tournament.code}/join`, newParticipant)
      .then(() => {
        // GET per aggiornare i partecipanti
        return axios.get(`http://localhost:4000/api/tournament/${tournament.code}`);
      })
      .then((res) => {
        const updated = res.data.participants ?? [];
        setParticipants(updated);
        setShowForm(false);
        setNewParticipant({ nickname: "", name: "" });
      })
      .catch((err) => console.error(err));
  };

  // --- FUNZIONE AGGIUNGI MOCK PARTECIPANTI ---
const handleAddMockParticipants = async () => {
  if (!tournament) return;

  const totalPlayers = Number(tournament.totalPlayers)-participants.length;
  const mockParticipants = Array.from({ length: totalPlayers }, (_, i) => ({
    name: `Giocatore ${i + 1}`,
    nickname: `nick${i + 1}`,
    seeding: Math.floor(Math.random() * totalPlayers) + 1,
  }));

  try {
    // Aggiungiamo in sequenza tutti i giocatori mock
    for (const p of mockParticipants) {
      await axios.post(`http://localhost:4000/api/tournament/${tournament.code}/join`, p);
    }

    // Poi aggiorniamo i partecipanti dal server
    const res = await axios.get(`http://localhost:4000/api/tournament/${tournament.code}`);
    setParticipants(res.data.participants ?? []);
    alert("Giocatori mock aggiunti con successo!");
  } catch (err) {
    console.error(err);
  }
};

  // --- FUNZIONE RIMUOVI PARTECIPANTE ---
  const handleRemoveParticipant = (nickname: String) => {
  axios
    .post(`http://localhost:4000/api/tournament/${tournament.code}/leave`, { nickname })
    .then(() => axios.get(`http://localhost:4000/api/tournament/${tournament.code}`))
    .then((res) => {
      setParticipants(res.data.participants ?? []);
    })
    .catch((err) => console.error(err));
  };
  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center text-center max-h-[90vh] overflow-hidden">
        <h1 className="text-3xl font-bold mb-2">{tournament.name}</h1>
        <p className="text-gray-600 mb-6">
          <strong>Data:</strong> {tournament.date} —{" "}
          <strong>Giocatori previsti:</strong> {tournament.totalPlayers}
          <strong> — Codice:</strong> {tournament.code}
          <strong> — Numero Gare:</strong> {tournament.maxraces}
        </p>

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
                      className="mt-2 border rounded-md px-2 py-1 text-sm text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white "
              />
              <input
                type="text"
                placeholder="Nickname"
                value={newParticipant.nickname}
                onChange={(e) => setNewParticipant({ ...newParticipant, nickname: e.target.value })}
                className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white "
              />
              <div className="flex gap-4 mt-4">
                <Button variant="default" onClick={handleAddParticipant} className="flex-1">✅ Aggiungi</Button>
                <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">❌ Annulla</Button>
              </div>
            </div>
          </div>
        )}

        <Button variant="default" onClick={() => setShowForm(true)}>➕ Aggiungi partecipante</Button>
        <Button
          variant="secondary"
          onClick={handleAddMockParticipants}
          className="mt-2"
        >
          🧩 Aggiungi partecipanti di test
        </Button>
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
        <Button
          variant="default"
          disabled={participants.length < totalPlayers || tournament.started}
          onClick={() => {
            const ok = window.confirm("Vuoi andare al pre-torneo?");
            if (!ok) return;

            // Aggiorna lo stato nel DB
            axios
              .patch(`http://localhost:4000/api/tournament/${tournament.code}/start`)
              .then(() => {
                setTournament((prev: any) => ({ ...prev, started: true })); // aggiorna anche lo stato locale
                navigate(`/pretournament/${tournament.code}`);
              })
              .catch((err) => console.error(err));
          }}
          className={participants.length < totalPlayers || tournament.started ? "opacity-50 cursor-not-allowed" : ""}
        >
          🏁 Avvia torneo
        </Button>


  <Button
    variant="destructive"
    onClick={() => {
      const ok = window.confirm("Sei sicuro di voler cancellare il torneo? Questa azione non è reversibile.");
      if (!ok) return;

      axios
        .delete(`http://localhost:4000/api/tournament/${tournament.code}`)
        .then(() => {
          alert("Torneo cancellato!");
          window.location.href = "/"; // oppure navigate("/") se usi react-router
          
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
