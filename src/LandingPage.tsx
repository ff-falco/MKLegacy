import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { reconstructTierMatrix } from "./encodedecodemaps";
// Definizione dei tipi


// Codice Tier List standard precompresso e codificato (FALLBACK)
const STANDARD_TIER_CODE = "eJy1W01z2zYQ/S86C7FEffvWTqc99GN6z/iwJGESEQiwACiVk/F/71K2NiYAXTrAxNYkfJTwBGD3vV0w3xdOcGMXz98Xv0IlJF88f/2+EPXi+XhcLqypFs+L1rnePj89Gbh+aYRrh3Kw3FRaOa7cl0p3T6+v7BVkpZ/+/P0P3kA1PnUg1NOf0Pd8uk8bxXXxdGBXcNz0YM5fetUslguQDgfwr78t3yls01MomNPnUZdyMDjSjEUEIiLJeaxxMKgrYapBOJ9JFLxzORbJyexZx40Zu0E5hGdUIhAR2WXYIB0Yoc9gnHVQi6Hz9kkUvhM6rJIT2ryP+LEUmxmbGHansk6/c9cb1pTwecj5nonDRCj93KzXjP9bCcdLceZguII5oTh8J7Rfp4/tDatB2DE2PTHs7WW5+EubDj5lvVP66DoydxXW8boDZYWex1cUpAjbZ4gwe+Xc3V4qUKNH5wF8J3RKT+jE7KBsKxQHYXpt5ssWRyng02egLbNKXyWoesbDu0wE0gsDjnQeW9G0+MVr4D6LACOJOmTQShyuAVNzFWplAN2JFOn3yHrHbMtNyV2wMBGIiGRQ7S0zegRpoOJXGOdMItidyiZD9t0ztd8ahEp9NWgX5mSiKNHJYGfQvAnbG91hoq956GjiOMlTejVA/ekGx1GBRl+XZtfvFHbp16hYzSxCbecxFEUp958yCNFD9xCBSKjTx3OxxeFqI2r8vcxTXAQi8UkfzyfGJa+c0fW0MT3lCSAikmOv1gYarfBbv7ogs0RRCp30iR+9ZNVy3t9eSg5V61vNGEyimJ7QjpVaSzjPl2h+lYQw/fJgpJagmrM+m8G2fhD7EC1MhjRbMFACDWtltLXCT7JRdHK5v4jXVzGr7rcZxPHERo1ezYYiHSA0R+ntNkbLbbBokRTBiEoG31Kwq5D1VWsv9QcAiVD6+cAdegU5iEbESuo4SkYhw5xMzR6UGttoWXdo7OcTE0XJ0WVIdbuPASNzE8NIFTO4hYJdQFV6uHBz4VIHzuXhDeQZ0s/Pgbn2qrveDELN93CIkACk3zVY+Yy14iM6SKHmMR2BKJoySEFxq0i5m+LX+svjQ0Qkg4daM/vPwM9jJTmoyLw8vIFIZejArNikO4CVOrc957VvZR7eQN4qfVwdsUIcm2HEe+V8xUKEwjtD53mqDy1IoUBghaiNnIvkI5wopVfsYsMmcwuYVZzw22UeQjkm/QLtcKzqPP12OtKCfgCT38tgs05sqj6MFVip+ocVUZBmJ/0i7dmjIj9ESLczlNN71gsDqoUeXZyzEr++33KI30AbOP1C4Tb9PGal/WryAU5KlX6eNkzx66jNGd3L4OZ0YhgtWYYTgyOOp3F/TG8P2iAxkOYl/VJhXY8FktG6a7Rp/L5miJEtz1Btb1iHY+kpwdU4AX5xG4I0L+nJ7FiHm5M7w4OOYgQiIul3y45JrWqtpNa9R8MDaMtmqCEPDMUPf/TgejTefnEQglQbZJCBLavNOP1w/ACPSwQjD5OeyonVWvYtOu1Wg+diYhh5vAymYf1xkobGHz/B95wBRls2/fqsWCX1UDvdV0bgh8xXKIpSWsnQAq9ajfd/eJSwAx6FiU/6o6x1cWvTWR72YwKEoijHtODXRrnr0GRHJiUEyS+knxL02B+KB9ZJbhX3SrgHOGW8DJv4yErRlHLgvjx/vkxmN8O+PTHorOOmhu7WYPbdbgSdeoq/aXDUTiwyuJfde6/ugluDe94lhCjLpN/Bm3uHrEezDdJzdCFGsZTh0G9zezLIusGoXnjt8ChImpR+4xxvw7VgSj1XgQCg8MmQXvbMieqMI1ZnTPfVfHniKAVThq4Me/exRtRNcAgaBSnbZTi/334uEK9C+LkugtJSZdCjw8NKNgJRRZ3DNjzkEULEI72pw4J5Ojx7f4xiLkQRiCI5/cqc2M2W3JrdnrX0APKVGbR5PRVe6iL4dXrEJegcxmEilKFhV2DhY0E1HJ2AhD7o9kZQopMhmgt2xgoMKui5z2QOUEpJX61u2BmkmJ4ViNREUZASSob67MDa0QySR4/6YiBJc4amwp41ZuhKyS9aVqC0L0QRlOhk0EWsTydj3UtE7fzB1RhGeybDAeSG1fHObojQjGTwufitz98G1UgezMbn6zQTOYTnc3XhK0+AUTLJw0Tx2owhiR+XafwMjds1A9eitNXgP1ARIFOx8VMthYPux+MLGbz1kdmhnx4llNIOZfAQThym9JYhoxyZESUuSGhTAoQsbQZdZkqob9BiUgf81qGpjcIUyBk2725qF4sqPJnxAZqVDPn1hFnDDl3ny453nexj+oS2ZyU3Et3qiPPu28cAmqLoZ1AUQesMzduClVCO4bp4199e3paLqp3+FwfS+bpbrt7/vCy/rpbFcrfcLIvb31fL9fTvF6R+EVagev6thXp/lzMDX0Ze8I3/B8IhnOi4xSTTT8/U7beH7WG1ORTH49t/DpCzlw==";


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