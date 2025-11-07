import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

//import { useNavigate } from "react-router-dom";


export default function LandingPage() {
  //const navigate = useNavigate();

  // Stati modale e form
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"create" | "resume" | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    players: "",
    stations: "",
    date: "",
    races: "",
  });
  const [tournamentCode, setTournamentCode] = useState("");
  const [tierCode, setTierCode] = useState("");

  // Tooltip Tier List
  const [showInfo, setShowInfo] = useState(false);
  const [hovering, setHovering] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);


  
  // Apertura/chiusura modale
  const openCreateModal = () => { setModalType("create"); setShowModal(true); };
  const openResumeModal = () => { setModalType("resume"); setShowModal(true); };
  const closeModal = () => {
    setShowModal(false);
    setModalType(null);
    setFormData({ name: "", players: "", stations: "", date: "" , races: ""});
    setTournamentCode("");
    setTierCode("");
  };
  const navigate = useNavigate();

  // Tooltip mobile + click con durata estesa
  useEffect(() => {
    let timeout: number | null = null;
  
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        // Chiude dopo 3 secondi se è stato cliccato
        timeout = window.setTimeout(() => setShowInfo(false), 10000);
      }
    };
  
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (timeout) window.clearTimeout(timeout);
    };
  }, []);
  
  
  const handleMouseEnter = () => {
    setHovering(true);
    setTimeout(() => {
      if (hovering) setShowInfo(true);
    }, 1000);
  };
  
  const handleMouseLeave = () => {
    setHovering(false);
    // Chiude il tooltip solo se non è stato cliccato
    setTimeout(() => {
      if (!hovering) setShowInfo(false);
    }, 500);
  };
  
  // Al click, apre e resta visibile per 3 secondi
  const handleClickInfo = () => {
    setShowInfo(true);
    setTimeout(() => setShowInfo(false), 3000);
  };
  

  

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-gradient-to-b from-blue-50 to-white text-gray-800">
      <header className="w-full py-6 shadow-sm bg-white/70 backdrop-blur-sm">
        <h1 className="text-3xl font-bold text-center">TorneoMaker</h1>
      </header>

      <main className="flex flex-col items-center text-center px-6 mt-10 flex-grow">
        <motion.h2
          className="text-2xl md:text-4xl font-semibold mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Organizza e gestisci tornei in modo semplice e veloce
        </motion.h2>

        <motion.p
          className="max-w-xl text-gray-600 mb-10"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Crea un nuovo torneo da zero o riprendi quello che hai già iniziato.
        </motion.p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button variant="default" onClick={openCreateModal}>
            🏆 Crea Torneo
          </Button>
          <Button variant="outline" onClick={openResumeModal}>
            🔁 Riprendi Torneo
          </Button>
        </div>
      </main>

      <footer className="py-4 text-sm text-gray-500">
        © {new Date().getFullYear()} TorneoMaker — Tutti i diritti riservati
      </footer>

      {/* --- MODALE --- */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-80 shadow-lg space-y-4">
            {modalType === "create" ? (
              <>
                <h3 className="text-lg font-bold text-center">Crea un nuovo torneo</h3>

                <input
                  type="text"
                  placeholder="Nome torneo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border px-3 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  type="number"
                  placeholder="Numero di giocatori"
                  value={formData.players}
                  onChange={(e) => setFormData({ ...formData, players: e.target.value })}
                  className="w-full border px-3 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  type="number"
                  placeholder="Numero di postazioni"
                  value={formData.stations}
                  onChange={(e) => setFormData({ ...formData, stations: e.target.value })}
                  className="w-full border px-3 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  type="number"
                  placeholder="Numero gare"
                  value={formData.races}
                  onChange={(e) => setFormData({ ...formData, races: e.target.value })}
                  className="w-full border px-3 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full border px-3 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* --- Codice Tier List --- */}
                <div className="relative w-full flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="Codice Tier List"
                    value={tierCode}
                    onChange={(e) => setTierCode(e.target.value)}
                    className="flex-1 border px-3 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div
                    ref={tooltipRef}
                    className="relative cursor-pointer text-blue-500 font-bold"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onClick={handleClickInfo}
                  >
                    i
                    <AnimatePresence>
                      {showInfo && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-white border border-gray-300 rounded-md p-3 shadow-lg text-sm z-50"
                        >
                          Per creare una nuova Tier List con la diffoltà delle mappe clicca{" "}
                          <a
                            href="/tierlist"
                            className="text-blue-600 underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Crea Tier List
                          </a>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Bottoni OK / Cancella */}
                <div className="flex justify-between gap-4">
                <Button
                  variant="default"
                  onClick={async () => {
                    // Se i campi non sono compilati, non fare nulla
                    if (
                      !formData.name ||
                      !formData.players ||
                      !formData.stations ||
                      !formData.date ||
                      !formData.races
                    ) {
                      //evidenzia i campi mancanti di rosso
                      return alert("Per favore, compila tutti i campi.");
                      
                    }
                    const positionsarray = [];
                    console.log("Stations:", formData.stations);
                    for (let i = 1; i < (Number(formData.stations)+1); i++) 
                      positionsarray.push(i);
                    const tournamentData = {
                      name: formData.name,
                      date: formData.date,
                      totalPlayers: Number(formData.players),
                      stations: Number(formData.stations),
                      tiercode: tierCode,
                      startingpositions: positionsarray,
                      seriescount: Math.ceil(Number(formData.players) / Number(formData.stations)),
                      maxraces: Number(formData.races),
                    };
              
                    // Genera un codice univoco per il torneo
                    const tournamentCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                    
                    try {
                      // Chiamata POST all'API per creare il torneo
                      const res = await fetch("http://localhost:4000/api/tournament", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          code: tournamentCode,
                          ...tournamentData
                        })
                      });
              
                      if (!res.ok) throw new Error("Errore nella creazione del torneo");
              
                      const createdTournament = await res.json();
              
                      // Salva i dati localmente per usarli nella tournament page
                      localStorage.setItem("tournamentData", JSON.stringify(createdTournament));
              
                      // Reindirizza alla tournament page
                      navigate(`/tournament/${createdTournament.code}`, { state: { fromCreate: true } });
              
                    } catch (err) {
                      console.error(err);
                      alert("Errore nella creazione del torneo!");
                    }
                  }}
                  className="flex-1"
                  >
                  OK
                </Button>
                  <Button variant="outline" onClick={closeModal} className="flex-1">
                    Cancella
                  </Button>
                </div>
              </>
            ) : modalType === "resume" ? (
              <>
                <h3 className="text-lg font-bold text-center">Riprendi torneo</h3>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Codice torneo"
                  value={tournamentCode}
                  onChange={(e) => setTournamentCode(e.target.value)}
                  className="w-full border px-3 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex justify-between gap-4">
                <Button
                    variant="default"
                    onClick={async () => {
                      if (!tournamentCode) return alert("Inserisci un codice torneo");

                      try {
                        const res = await fetch(`http://localhost:4000/api/tournament/${tournamentCode}`);
                        if (!res.ok) throw new Error("Torneo non trovato");

                        const tournament = await res.json();

                        // Salva codice torneo localmente
                        localStorage.setItem("tournamentCode", tournament.code);

                        // Naviga alla tournament page
                        if (tournament.started && !tournament.reviewed) {
                          navigate(`/pretournament/${tournament.code}`);
                        } else if (tournament.reviewed) {
                          navigate(`/racemanager/${tournament.code}`);
                        } else {
                          navigate(`/tournament/${tournament.code}`);
                        }
                      } catch (err) {
                        console.error(err);
                        alert("Torneo non trovato!");
                      }
                    }}
                    className="flex-1"
                  >
                    OK
                  </Button>
                  <Button variant="outline" onClick={closeModal} className="flex-1">
                    Cancella
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
