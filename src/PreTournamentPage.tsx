import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";


export default function PreTournamentPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const [tournament, setTournament] = useState<any>(null);
  const [groups, setGroups] = useState<any[][]>([]);

  // 🔹 nuovi stati per le caselle numeriche
  const [incremento, setIncremento] = useState<number>(1);
  const [soglia, setSoglia] = useState<number>(1);

  const [multipler, setMultiplier] = useState<any[]>([]);

  // 🔹 limiti per i valori (puoi modificarli a piacere)
  const MIN_INCREMENTO = 0;
  const MAX_INCREMENTO = Infinity;
  const MIN_SOGLIA = 0;

  useEffect(() => {
    if (!code) return;

    axios
      .get(`${import.meta.env.VITE_API_URL}/api/tournament/${code}`)
      .then((res) => {
        const t = res.data;
        setTournament(t);
        
        if (t.participants?.length) {
          const distribuiti = createGroups(t.participants, t.stations);
          setGroups(distribuiti);
        }
        //Inizializza il multipler in base al numero di gruppi
        setMultiplier([]);
        let multipler = [];
        for (let i=0; i< Math.ceil(t.participants.length / t.stations); i++){
          console.log("PUSH");
          multipler.push(1);
        }
        setMultiplier(multipler);
        console.log("MULTIPLER:");
        console.log(multipler);

        if (!t.started) {
          navigate(`/tournament/${code}`);
        }
      })
      .catch((err) => console.error(err));
  }, [code, navigate]);

  const createGroups = (participants: any[], stations: number) => {
    if (!participants.length) return [];

    const ordered = [...participants].sort((a, b) => (a.seeding ?? 9999) - (b.seeding ?? 9999));

    const totalGroups = Math.ceil(ordered.length / stations);
    const groups: any[][] = [];

    for (let i = 0; i < totalGroups; i++) {
      const start = i * stations;
      const end = start + stations;
      groups.push(ordered.slice(start, end));
    }
    return groups;
  };

  const calcolapunteggi = (index: number, column:number, incremento:number, maxpartecipants:number, seriescount:number) => {
    return maxpartecipants - (index) + (seriescount-column-1) * incremento;
  }

  if (!tournament) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600">
        Caricamento torneo...
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-b from-white to-blue-50 p-6">
      <h1 className="text-3xl font-bold mb-2">{tournament.name} — Pre-torneo</h1>
      <p className="text-gray-600 mb-6">
        <strong>Codice:</strong> {tournament.code} —{" "}
        <strong>Postazioni:</strong> {tournament.stations} —{" "}
        <strong>Giocatori:</strong> {tournament.participants.length}
      </p>
      <p className="text-gray-700 mb-6 max-w-2xl text-center">
        Qui puoi visualizzare i gruppi generati in base ai partecipanti iscritti. Puoi
        regolare l'incremento dei punti per serie e la soglia di promozione/retrocessione
        prima di avviare il torneo. L'incremento e le soglie sono una dimostrazione, 
        il posizionamento attuale indica l'ordine per le qualifiche.
      </p>

{/* 🔹 Griglia dei gruppi adattiva */}
<div
  className="
    grid 
    gap-6 
    w-full 
    max-w-[1400px] 
    mb-10
    sm:grid-cols-2 
    md:grid-cols-3 
    lg:grid-cols-4 
    xl:grid-cols-5
  "
>
  {groups.map((group, i) => (
    <motion.div
      key={i}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl shadow-md p-4 border border-gray-200"
    >
      <h3 className="text-lg font-semibold mb-3 text-center">🎮 Elenco {i + 1}</h3>
      <ul className="space-y-2">
        {group.map((p, index) => {
          const isPromoted = index < soglia && i != 0;
          const isRelegated =
            index >= group.length - soglia &&
            i != Math.ceil(tournament.totalPlayers / tournament.stations) - 1;

          const bgColor = isPromoted
            ? "bg-green-100"
            : isRelegated
            ? "bg-red-100"
            : "bg-white";

          return (
            <li
              key={p.nickname}
              className={`p-2 rounded-md ${bgColor} text-gray-800 flex justify-between items-center border border-gray-200`}
            >
              <span>
                <strong>{p.seeding ? `#${p.seeding}` : "—"}</strong> {p.name} ({p.nickname})
              </span>
              <span className="flex flex-col text-sm text-green-700 items-end">
                <span>
                  +{" "}
                  {calcolapunteggi(
                    index,
                    i,
                    incremento,
                    tournament.stations,
                    Math.ceil(tournament.totalPlayers / tournament.stations)
                  )}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </motion.div>
  ))}
</div>







{/* 🔹 Riga aggiuntiva allineata alle colonne dei partecipanti */}
<div className="bg-white rounded-2xl shadow-md p-4 border border-gray-200">
<h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
    Configurazione Moltiplicatore Risultati Finali
  </h2>
  <p className="text-m  text-center text-gray-800 mb-6">
    Imposta il moltiplicatore di punti per ogni serie nella gara finale, per un'ultima gara avvincente!
    Se non si vuole una finale con moltiplicatori, lasciare tutti i valori a 1.
  </p>
  <div
    className="
    grid 
    gap-6 
    w-full 
    max-w-[1400px] 
    mb-10
    sm:grid-cols-2 
    md:grid-cols-3 
    lg:grid-cols-4 
    xl:grid-cols-5
  "
    style={{
      // Questo stile è corretto e sovrascrive le classi responsive
      // per far combaciare esattamente le colonne, come vuoi tu.
      gridTemplateColumns: `repeat(${Math.ceil(tournament.participants.length / tournament.stations)}, 1fr)`
    }}
  >
    {/* Questo map è corretto, crea un input per ogni colonna (serie).
    */}
    {Array.from({ length: Math.ceil(tournament.participants.length / tournament.stations) }).map((_, colIndex) => (
      <div
        key={colIndex}
        className="border border-gray-300 rounded-lg p-4 bg-gray-50 text-center"
      >
        <h3 className="text-gray-700 font-semibold text-center mb-3">
          {/* La logica per ottenere 'A', 'B', 'C' è perfetta. */}
          Incremento Finale Serie {String.fromCharCode('A'.charCodeAt(0) + colIndex)}
        </h3>

        <input
            type="number"
            min={1}
            max={Infinity}
            step={1} // Corretto, per forzare solo numeri interi
            value={multipler[colIndex] || 1}
            onChange={(e) => {
              
              const val = e.target.value;
              let newValue: number;

              // Gestisce il caso in cui l'utente cancella l'input.
              // Number("") è 0, quindi rientra nel check successivo.
              const numericVal = Number(val);

              let newMultiplier = [...multipler];

              if (numericVal < 1) {
                // Se il valore è minore di 1 (o 0, o vuoto), lo forziamo a 1.
                newValue = 1;
              } else {
                // Altrimenti, prendiamo il valore intero.
                newValue = (numericVal);
              }
              
              newMultiplier[colIndex] = newValue;

              // ✅ CORREZIONE 1: Chiama setMultiplier solo una volta,
              // dopo aver determinato il 'newValue'.
              setMultiplier(newMultiplier);
            }}
            
            // ✅ CORREZIONE 2: Cambiato 'text-white' in 'text-gray-900'.
            // Il tuo input era su uno sfondo 'bg-gray-50' (quasi bianco),
            // quindi 'text-white' rendeva il numero digitato invisibile.
            className="text-white w-40 text-center border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
      </div>
    ))}
  </div>
</div>



























      {/* 🔹 Sezione centrale con i due input */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
        <div className="flex flex-col items-center">
          <label className="text-gray-700 font-medium mb-1">Incremento per serie</label>
          <input
            type="number"
            min={MIN_INCREMENTO}
            max={MAX_INCREMENTO}
            value={incremento}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (val >= MIN_INCREMENTO && val <= MAX_INCREMENTO) setIncremento(val);
            }}
            className="text-white w-40 text-center border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <p className="text-xs text-gray-400 mt-1">
            (Quanto i punti aumentano in base alla serie)
          </p>
        </div>

        <div className="flex flex-col items-center">
          <label className="text-gray-700 font-medium mb-1">
            Soglia promozione/retrocessione
          </label>
          <input
            type="number"
            min={MIN_SOGLIA}
            max={Math.floor(tournament.stations/2)}
            value={soglia}
            onChange={(e) => {
              const val = Number(e.target.value);
              let seriescount = Math.ceil(tournament.participants.length / tournament.stations);
              if (seriescount>1){ 
                if (val >= MIN_SOGLIA && val <= Math.floor(tournament.stations/2)) setSoglia(val);}
              else 
                setIncremento(0);
              
            }}
            className="text-white w-40 text-center border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <p className="text-xs text-gray-400 mt-1">
            (Seleziona i giocatori che salgono o scendono di gruppo in base al risultato)
          </p>
        </div>


      </div>

      {/* 🔹 Pulsanti di azione */}
      <div className="flex gap-4">
        <Button
          variant="default"
          onClick={() => {
            const ok = window.confirm("Vuoi avviare il torneo?");
            if (!ok) return;

            axios
              .patch(`${import.meta.env.VITE_API_URL}/api/tournament/${tournament.code}/review`, {
                groups: createGroups(tournament.participants, tournament.stations),
                seriesIncrement:incremento,
                seriesThreshold: soglia,
                finaleincrement: multipler,
              })
              .then(() => {
                setTournament((prev: any) => ({ ...prev, reviewed: true, started: true }));
                navigate(`/racemanager/${tournament.code}`, { state: { code: tournament.code } });
              })
              .catch(console.error);
          }}
        >
          🏁 Avvia torneo
        </Button>

        <Button
          variant="destructive"
          onClick={() => {
            const ok = window.confirm("Vuoi davvero cancellare questo torneo?");
            if (!ok) return;
            axios.delete(`${import.meta.env.VITE_API_URL}/api/tournament/${tournament.code}`).then(() => {
              navigate("/");
            });
          }}
        >
          ❌ Cancella torneo
        </Button>
      </div>
    </div>
  );
}
