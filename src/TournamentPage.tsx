import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import axios from "axios";

interface Participant {
  id: number;
  nickname: string;
  name: string;
  hasPhone: boolean;
  seeding: number | null;
}

export default function TournamentPage() {
  const [tournament, setTournament] = useState<any>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newParticipant, setNewParticipant] = useState({ nickname: "", name: "" });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("tournamentData");
    if (stored) setTournament(JSON.parse(stored));
  }, []);

  // Polling per aggiornare lista giocatori dal backend
  useEffect(() => {
    if (!tournament) return;
    const interval = setInterval(() => {
      axios
        .get(`http://localhost:4000/api/tournament/${tournament.code}/players`)
        .then((res) => setParticipants(res.data))
        .catch((err) => console.error(err));
    }, 2000);
    return () => clearInterval(interval);
  }, [tournament]);

  if (!tournament) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600">
        Nessun torneo trovato.
      </div>
    );
  }

  const totalPlayers = Number(tournament.players);
  const slots = Array.from({ length: totalPlayers }, (_, i) => participants[i] || null);
  const isStartDisabled = participants.length < totalPlayers;

  const handleAddParticipant = () => {
    if (!newParticipant.nickname || !newParticipant.name) return;

    axios.post(`http://localhost:4000/api/tournament/${tournament.code}/join`, newParticipant)
      .then(() => setShowForm(false))
      .catch((err) => console.error(err));

    setNewParticipant({ nickname: "", name: "" });
  };

  const handleRemove = (id: number) => {
    axios.post(`http://localhost:4000/api/tournament/${tournament.code}/leave`, { id })
      .catch((err) => console.error(err));
  };

  const handleTogglePhone = (id: number) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, hasPhone: !p.hasPhone } : p
      )
    );
  };

  const handleSeedingChange = (id: number, value: number) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, seeding: value } : p
      )
    );
  };

  const handleStartTournament = () => alert("🏁 Il torneo è iniziato!");

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center text-center max-h-[90vh] overflow-hidden">
        <h1 className="text-3xl font-bold mb-2">{tournament.name}</h1>
        <p className="text-gray-600 mb-6">
          <strong>Data:</strong> {tournament.date} —{" "}
          <strong>Giocatori previsti:</strong> {tournament.players}
        </p>

        {/* QR CODE */}
        <div className="mb-6 flex flex-col items-center">
        <QRCodeCanvas
            value={`https://t.me/TuoBotUsername?start=${tournament.code}`}
            size={180}
            />
          <p className="text-sm text-gray-500 mt-2">
            Codice torneo: <strong>{tournament.code}</strong>
          </p>
        </div>

        {/* LISTA SCORREVOLE */}
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
                className={`rounded-xl border p-4 shadow-sm min-h-[100px] flex flex-col justify-center items-center ${
                  p ? "bg-blue-100" : "bg-gray-100 text-gray-400"
                }`}
              >
                {p ? (
                  <>
                    <div className="flex flex-col items-center">
                      <span className="font-semibold text-gray-800">{p.name}</span>
                      <span className="text-sm text-gray-500">{p.nickname}</span>
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={p.hasPhone}
                          onChange={() => handleTogglePhone(p.id)}
                          className="w-4 h-4 accent-blue-500 cursor-pointer"
                        />
                        <span>📱</span>
                      </label>

                      <select
                        value={p.seeding ?? ""}
                        onChange={(e) =>
                          handleSeedingChange(p.id, Number(e.target.value))
                        }
                        className="border rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Seed</option>
                        {Array.from({ length: totalPlayers }, (_, i) => i + 1).map(
                          (num) => (
                            <option key={num} value={num}>
                              {num}
                            </option>
                          )
                        )}
                      </select>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemove(p.id)}
                      >
                        ❌
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1 text-gray-400">
                    <span className="text-sm">In attesa...</span>
                    <motion.div
                      className="flex gap-1"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.5,
                        ease: "easeInOut",
                      }}
                    >
                      <span>•</span>
                      <span>•</span>
                      <span>•</span>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* BOTTONI */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-auto">
          <Button variant="default" onClick={() => setShowForm(true)}>
            ➕ Aggiungi partecipante
          </Button>

          <Button
            variant="default"
            disabled={isStartDisabled}
            onClick={handleStartTournament}
            className={isStartDisabled ? "opacity-50 cursor-not-allowed" : ""}
          >
            🏁 Avvia torneo
          </Button>
        </div>

        {/* FORM */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-80 space-y-4">
              <h3 className="text-lg font-semibold mb-3">Nuovo partecipante</h3>

              <input
                type="text"
                placeholder="Nickname (es. @mariokart95)"
                value={newParticipant.nickname}
                onChange={(e) =>
                  setNewParticipant({ ...newParticipant, nickname: e.target.value })
                }
                className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                type="text"
                placeholder="Nome (come vuoi essere chiamato)"
                value={newParticipant.name}
                onChange={(e) =>
                  setNewParticipant({ ...newParticipant, name: e.target.value })
                }
                className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="flex justify-between gap-4 mt-4">
                <Button variant="default" onClick={handleAddParticipant} className="flex-1">
                  ✅ Aggiungi
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                  ❌ Annulla
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
