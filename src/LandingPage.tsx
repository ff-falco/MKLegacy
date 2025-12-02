import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { reconstructTierMatrix } from "./encodedecodemaps";
// Definizione dei tipi


// Codice Tier List standard precompresso e codificato (FALLBACK)
const STANDARD_TIER_CODE = "eJy1WkuTozYQ/i+c0Xhs/JxbUqnkkGwq9609CNCAFiFRkhhCbc1/T2OPO0GSL6meKo8f+mD6o98t+JF5KazLXn5kv/JKKpG9fP2WZ38a2/Prjx+ZrLOX/TbPnK2yl6z1fnAvm43l01MjfTuWoxO2MtoL7Z8q029eX9krV5XZfPn9D9Hwat70XOpNFz4MYjnOWC3MZnthvHde2Jr3tZWv/mnQTZZnXHmQkkbf8xubbUHOZse4lnDJlTXOSd2s2SRRZLP/BDYlL+eB2y7ksVq/M9hfqBnsnkGSbjrT2dG1KxIJ6M7jeKDmcWSlsErqcp747FY8EtCdR3Eit8iZlbIp1SjWBlkv3+WTq2ELOjda1HZei18voxnIg/UAcozi3frq16so/VMuflpO5c4rEWsgwDAu6b2gYFUrxHB9KwWv1pHxAEY+9G6xuwp0QnFdh5kiQJAFOQmQZOBwM2oP8BDmzjR8p0Nvo2dWKTPW3gyVlfA/Qn9JoHcyu0/QDVy7Hj/UDpXQTAwiFXo77VndfR91E4ZQsI5FhV4bF5Dkxr6XUbFfraNvkDsHCDJqaKV2reFqXU9SGFqDXheg9cX2gwLQFZFFQuzOhLzSb7estrwx+tpmQSldU0miqBb6Pgwu3c7LC3KX9ZFaQgxd5UzvKkKJyltTW9OLwFMiCLPr8yfYR/xdSS9K2QluheahgVIw8iHXCxS5puQ9t9JU0lZjGMtpGD2G3n+PrLFjXyrxZlTFtVnTSaLYJ9L774m1sx3BPVK6SYHIhX6KODFZCXgZSCXGRVxiEPtXcr0UrONKLm6RCOwkiO0keeo9MAX5zGhlzBD0swGAHMj1cWA9H5TwVogw5SYgzHLkPM7sYSQnIPQPcl8tVsKKwD1iDJmQ51sYb/8rrl43CWkU/YQ8u51u4jpuvfO8lmO/ovMARj7ks9iR9cLaub8188E8HkFYheizPjiFMctL8BoGwLAGxSDGEDmXC7sON9NiiaBPCAD0WvLGds/60bUWLrkxtlm3KykM6zH9THpYxMkq3rwKAfQO+lFnC6I8lFkfdbOrday99F3bkenj3gJSmskaXoddSQJFNvQ925nBx8fGSaSUFIieSu4fBUibZmO7XsKII4JMH2M4jpIz2TEt9XfeQtfBodKG4/kDGK1Ev1cAkSHdsMwUmtci3i5I45jsyZPKkQ3LJlbDbS10uPkaQagY+nAGadJy3UJfxLV3CkwSxlP6gDsn+oh6Zg+DO4ZQNfTZ9vSYRwyhq5Dr4/iQRoygNui7gjOzsiyNjpURIZhX6AP5ArLehHXghXEVTIFoF/K++sCsqbrl774BG8waSRi7A/qZdA8SZ64sr6LBJ4UhE/q7CgfmWmFL4ePN8xhCbyHnsWO33gyG3ybK+UkQO1ly65xB3NyMMxwabI7GCHYI5OkeZqzlHisfjBVuEKIOHeXhAWgl8lIIhujmW7VL2CiEUDfkeXa/CGtl07pR1zzs82MMmZDnWpCmzRTFTrCMBZi8w74wuEzXSi24tOAJ682LNIr+Qd/vQ4CMw5IzID7GMkptaRgjmZzPiblJCH99q7iezTrvP4CxDpHzAbeYay1maF+l9qHHhBDqhTy3nJhvJ9MPdpRBRxsj2KfQ3/w5Mi+rjnkovJUylQq72QSKvks/d3joiT42tOKhIwGiecjb2fNVXMttaWxQfwIAGwP6UC6uspwfrR5k8MhDEkTTkKf7HUjrZlOq0cZlJ4LQLuRNCqh/ks6LuufaySCZJEEsPORcCjZxNcpGDjBW8HXopDBkQh7G0Id8iEvtzaZRTCr0De2JXXcaXWNU3UPlC6fBBIpRRP8YxuFDXkIzKQx9l9xKy4V7YaNJLFzH7Uh6y+zYJFU9GRPcTYgA5EBfcrZsNtAQJe9LJjDMafT15nKT5uK5K0LQP+k3cA43WW8w0Ig5dM8Qev+WZ7/I11f57xOyP9VKet7ffvxmuL99+5nr5ct7nlXtclcGfnwt8l2+z7f587f86za//Vq+L5/FdR1OfJNOlkr8ZaAJup7l7SjyxBuc+H8gEOFlLyDm+mF5Nu64P552z8XlcNi//wONeoip";


// ⭐ FUNZIONE DI FALLBACK E RICOSTRUZIONE
// Questa funzione non deve essere importata, ma definita qui per usare STANDARD_TIER_CODE
const getTierListMatrix = (tierCode: string, standardCode: string): { tierList: any, isDefault: boolean } => {
    
    // Tentiamo la decodifica del codice utente
    let matrix = reconstructTierMatrix(tierCode);
    
    if (matrix) {
        // Decodifica utente riuscita
        return { tierList: matrix, isDefault: false };
    }
    
    // Se la decodifica fallisce (codice non valido o nullo), proviamo con il codice standard
    matrix = reconstructTierMatrix(standardCode);

    if (matrix) {
         return { tierList: matrix, isDefault: true };
    }
    
    // Se fallisce anche il codice standard, c'è un errore grave
    throw new Error("Impossibile decodificare anche il codice Tier List standard.");
};


export default function LandingPage() {
  
  // Stati modale e form
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"create" | "resume" | null>(null);
  const [tierCodeError, setTierCodeError] = useState<string | null>(null); // Nuovo stato per l'errore del codice Tier List

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
  const openCreateModal = () => { setModalType("create"); setShowModal(true); setTierCodeError(null); }; 
  const openResumeModal = () => { setModalType("resume"); setShowModal(true); };
  const closeModal = () => {
    setShowModal(false);
    setModalType(null);
    setFormData({ name: "", players: "", stations: "", date: "" , races: ""});
    setTournamentCode("");
    setTierCode("");
    setTierCodeError(null); 
  };
  const navigate = useNavigate();

  // Tooltip mobile + click con durata estesa
  useEffect(() => {
    let timeout: number | null = null;
  
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        timeout = window.setTimeout(() => setShowInfo(false), 3000); 
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
    }, 500); 
  };
  
  const handleMouseLeave = () => {
    setHovering(false);
    setTimeout(() => {
      if (!hovering) setShowInfo(false);
    }, 300); 
  };
  
  const handleClickInfo = () => {
    setShowInfo(true);
    setTimeout(() => setShowInfo(false), 3000);
  };
  

  const handleCreateTournament = async () => {
    setTierCodeError(null); 

    // 1. Validazione Campi Obbligatori
    if (
      !formData.name ||
      !formData.players ||
      !formData.stations ||
      !formData.date ||
      !formData.races
    ) {
      return alert("Per favor, compila tutti i campi obbligatori.");
    }
    
    let finalTierList: any;
    let usedTierCode: string | null = tierCode.trim() || null;

    // 2. Gestione e Decodifica Codice Tier List (con fallback)
    try {
        const result = getTierListMatrix(usedTierCode || "", STANDARD_TIER_CODE);
        finalTierList = result.tierList;

        if (result.isDefault) {
             // Il codice standard è stato utilizzato
            usedTierCode = STANDARD_TIER_CODE;

            if (tierCode.trim()) {
                // L'utente aveva inserito un codice, ma è stato scartato (mostra errore)
                setTierCodeError("Codice Tier List non valido. Usato lo schema standard.");
            }
        } else {
            // Decodifica riuscita dal codice utente
            usedTierCode = tierCode.trim();
        }

    } catch (error) {
        console.error(error);
        return alert("Errore critico: Impossibile caricare lo schema Tier List. Controlla la costante standard.");
    }


    // 3. Preparazione dei dati del Torneo
    const stationsCount = Number(formData.stations);
    const playersCount = Number(formData.players);
    const positionsarray = Array.from({ length: stationsCount }, (_, i) => i + 1); 
    const tournamentData = {
      name: formData.name,
      date: formData.date,
      totalPlayers: playersCount,
      stations: stationsCount,
      tierCode: usedTierCode,
      
      
      startingpositions: positionsarray,
      seriescount: Math.ceil(playersCount / stationsCount),
      maxraces: Number(formData.races),

      tierList: finalTierList, // Usa la matrice finale ricostruita o il default
    };
    
    // 4. Genera codice e invia all'API
    const tournamentCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tournament`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: tournamentCode,
          ...tournamentData
        })
      });

      if (!res.ok) throw new Error("Errore nella creazione del torneo");

      const createdTournament = await res.json();

      localStorage.setItem("tournamentData", JSON.stringify(createdTournament));
      navigate(`/tournament/${createdTournament.code}`, { state: { fromCreate: true } });

    } catch (err) {
      console.error(err);
      alert("Errore nella creazione del torneo! Riprova più tardi.");
    }
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
          <div className="bg-white rounded-lg p-6 w-96 shadow-lg space-y-4">
            {modalType === "create" ? (
              <>
                <h3 className="text-lg font-bold text-center">Crea un nuovo torneo</h3>

                <input
                  type="text"
                  placeholder="Nome torneo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border px-3 py-2 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  type="number"
                  placeholder="Numero di giocatori"
                  value={formData.players}
                  onChange={(e) => setFormData({ ...formData, players: e.target.value })}
                  className="w-full border px-3 py-2 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  type="number"
                  placeholder="Numero di postazioni"
                  value={formData.stations}
                  onChange={(e) => setFormData({ ...formData, stations: e.target.value })}
                  className="w-full border px-3 py-2 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  type="number"
                  placeholder="Numero gare"
                  value={formData.races}
                  onChange={(e) => setFormData({ ...formData, races: e.target.value })}
                  className="w-full border px-3 py-2 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full border px-3 py-2 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* --- Codice Tier List --- */}
                <div className="relative w-full">
                  <div className="flex items-center gap-2 mb-1">
                    <label className="text-sm font-medium text-gray-700">Codice Tier List (Opzionale)</label>
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
                            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-white border border-gray-300 rounded-md p-3 shadow-lg text-sm z-50 text-left"
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
                  
                  {/* TextArea per il codice lungo */}
                  <textarea
                    placeholder="Incolla qui il codice Tier List autogenerato (Base64 compresso)..."
                    value={tierCode}
                    onChange={(e) => setTierCode(e.target.value)}
                    rows={4} 
                    className={`w-full border px-3 py-2 rounded-md bg-white text-black focus:outline-none focus:ring-2 ${tierCodeError ? 'border-red-500' : 'focus:ring-blue-500'}`}
                  />
                  {tierCodeError && (
                    <p className="text-red-500 text-xs mt-1">{tierCodeError}</p>
                  )}
                </div>

                {/* Bottoni OK / Cancella */}
                <div className="flex justify-between gap-4">
                <Button
                  variant="default"
                  onClick={handleCreateTournament} 
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
                  className="w-full border px-3 py-2 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex justify-between gap-4">
                <Button
                    variant="default"
                    onClick={async () => {
                      if (!tournamentCode) return alert("Inserisci un codice torneo");

                      try {
                        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tournament/${tournamentCode}`);
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