// src/TierListPage.tsx
import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { encodeData, decodeData } from './encodedecodemaps'; 

// Definizione dei tipi
// ⭐ MODIFICATO: Inversione di Adlitam e Goat
type TierName = "Goat" | "Difficile" | "Normale" | "Facile" | "Ban" | "Adlitam";

interface ImageItem {
  id: number;
  src: string;
  alt?: string; 
}

// Interfaccia per il payload decodificato
interface TierlistPayload {
  tiers: Record<TierName, ImageItem[]>;
  charts: number[][]; 
  visiblePoints: boolean[][];
  timestamp?: number; // Aggiunto per compatibilità con il salvataggio
}


export default function TierListPage() {

  // SIDEBAR CHARTS
  // ⭐ MODIFICATO: Inversione dei nomi dei punti (Goat e Adlitam)
  const pointNames = ["👶🏼", "😐", "😡", "🐐", "👹"];
  const chartNames = ["Qualifica", "Normale", "Finale"];

  const [charts, setCharts] = useState([
    [3, 2, 4, 1, 0], 
    [1, 3, 2, 4, 0],
    [2, 4, 3, 1, 0],
  ]);

  const [visiblePoints, setVisiblePoints] = useState([
    [true, true, true, true, true],
    [true, true, true, true, true],
    [true, true, true, true, true],
  ]);

  const togglePoint = (chartIndex: number, pointIndex: number) => {
    setVisiblePoints((prev) => {
      const copy = prev.map((arr) => [...arr]);
      copy[chartIndex][pointIndex] = !copy[chartIndex][pointIndex];
      return copy;
    });
  };

  const handleValueChange = (chartIndex: number, pointIndex: number, delta: number) => {
    setCharts((prev) => {
      const copy = prev.map((arr) => [...arr]);
      copy[chartIndex][pointIndex] = Math.max(0, Math.min(5, copy[chartIndex][pointIndex] + delta));
      return copy;
    });
  };

  // TIERLIST DRAG & DROP
  const [available, setAvailable] = useState<ImageItem[]>([]);
  
  // ⭐ MODIFICATO: Inversione di Adlitam e Goat
  const [tiers, setTiers] = useState<Record<TierName, ImageItem[]>>({
    Facile: [],
    Normale: [],
    Difficile: [],
    Goat: [], // ex Adlitam
    Adlitam: [], // ex Goat
    Ban: [],
  });

  // STATI AGGIUNTI PER IL FLOW DI CONFERMA E CARICAMENTO
  const [showCode, setShowCode] = useState(false);
  const [uniqueCode, setUniqueCode] = useState("");
  const [showFinalChoice, setShowFinalChoice] = useState(false);
  
  const [inputCode, setInputCode] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  // ⭐ MODIFICATO: Inversione di Adlitam e Goat
  const tierNamesWithEmoji = [
    { label: "Facile", emoji: "👶🏼" },
    { label: "Normale", emoji: "😐" },
    { label: "Difficile", emoji: "😡" },
    { label: "Goat", emoji: "🐐" }, // ex Adlitam
    { label: "Adlitam", emoji: "👹" }, // ex Goat
    { label: "Ban", emoji: "❌" },
  ];


  // Funzione di utilità per estrarre la parte del nome che segue il trattino
const getNamePart = (alt: string): string => {
  // 1. Rimuovi l'estensione del file
  const nameWithoutExt = alt.substring(0, alt.lastIndexOf('.'));
  
  // 2. Trova l'indice del primo trattino
  const separatorIndex = nameWithoutExt.indexOf('-');
  
  // 3. Restituisci la sottostringa dopo il trattino e fai il trim
  if (separatorIndex !== -1) {
    return nameWithoutExt.substring(separatorIndex + 1).trim();
  }
  // Fallback: se non c'è il trattino, ordina per nome completo (inclusi i numeri se ci sono)
  return nameWithoutExt; 
};

// Funzione di comparazione per l'ordinamento
const compareImageItems = (a: ImageItem, b: ImageItem): number => {
  if (!a.alt || !b.alt) return 0; // Gestione caso in cui alt non è definito
  const nameA = getNamePart(a.alt);
  const nameB = getNamePart(b.alt);
  // Esegue la comparazione alfabetica sulla parte del nome estratta
  return nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
};

  // ⭐ FUNZIONE AGGIORNATA CON ORDINAMENTO PER NOME MAPPA DOPO IL TRATTINO (Questa parte era già corretta)
  const fetchGitHubImages = async (): Promise<ImageItem[]> => {
    const response = await fetch(
      "https://api.github.com/repos/ff-falco/MKLegacy/contents/Mappecontorneo2"
    );
    const files = await response.json();

    const images: ImageItem[] = files
      .filter((f: any) => f.type === "file" && f.name.match(/\.(png|jpg|jpeg|gif)$/i))
      .map((f: any, index: number) => ({
        id: index + 1,
        src: f.download_url,
        alt: f.name, // Esempio: "1-Pista Giungla.png"
      }));

    // --- Ordinamento per nome dopo il trattino ---
    return images.sort(compareImageItems);

    };
  useEffect(() => {
    fetchGitHubImages().then((imgs) => setAvailable(imgs));
  }, []);

  // --- Drag & Drop handlers (omesso per brevità) ---
  const handleDragStart = (e: React.DragEvent<HTMLElement>, item: ImageItem, from: string) => {
    const payload = JSON.stringify({ item, from });
    e.dataTransfer.setData("text/plain", payload);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  const handleDropOnTier = (e: React.DragEvent<HTMLDivElement>, tier: TierName) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData("text/plain");
    if (!raw) return;
    let parsed: { item: ImageItem; from: string } | null = null;
    try { parsed = JSON.parse(raw); } catch { return; }
    if (!parsed) return;

    const { item, from } = parsed;
    const already = tiers[tier].some(i => i.id === item.id);
    if (already) return;

    setTiers(prev => {
      const copy = { ...prev };
      if (from && from !== "available" && from in copy)
        copy[from as TierName] = copy[from as TierName].filter(i => i.id !== item.id);
      copy[tier] = [...copy[tier], item];
      return copy;
    });

    if (from === "available") setAvailable(prev => prev.filter(i => i.id !== item.id));
  };

  const handleDropOnAvailable = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData("text/plain");
    if (!raw) return;
    let parsed: { item: ImageItem; from: string } | null = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return;
    }
    if (!parsed) return;

    const { item, from } = parsed;

    if (available.some((i) => i.id === item.id)) return;

    if (from && from !== "available") {
      setTiers((prev) => {
        const copy = { ...prev };
        if (from in copy) copy[from as TierName] = copy[from as TierName].filter((i) => i.id !== item.id);
        return copy;
      });
    }

    // ⭐ SISTEMATO: L'ordinamento usa ora la funzione compareImageItems aggiornata
    setAvailable((prev) =>
      [...prev, item].sort(compareImageItems)
    );
    
  };

  // --- LOGICHE DI CONFERMA (Codifica) ---
  // ⭐ MODIFICATO: Nello stato iniziale (Annulla), inversione Adlitam e Goat
  const saveTierlist = (defaultTier: TierName) => {
    let finalTiers = tiers;
    if (available.length > 0) {
      finalTiers = { ...tiers };
      finalTiers[defaultTier] = [...finalTiers[defaultTier], ...available];
      setTiers(finalTiers); 
    }

    const payload: TierlistPayload = {
      tiers: finalTiers,
      charts,
      visiblePoints,
      timestamp: Date.now(),
    };

    const encodedCode = encodeData(payload); 

    setUniqueCode(encodedCode);
    setShowFinalChoice(false);
    setShowCode(true);
    setAvailable([]);
  };

  const handleConfirm = () => {
    if (available.length > 0) {
      setShowFinalChoice(true);
    } else {
      saveTierlist("Normale"); 
    }
  };
  
  // ⭐ MODIFICATO: La scelta finale deve poter essere Ban o Normale (corretto)
  const handleFinalChoice = (choice: "Normale" | "Ban") => {
    saveTierlist(choice);
  };

  const handleClosePopup = () => setShowCode(false);

  const handleCancel = () => {
    // ⭐ MODIFICATO: Inversione Adlitam e Goat
    setTiers({ Goat: [], Difficile: [], Normale: [], Facile: [], Ban: [], Adlitam: [] });
    fetchGitHubImages().then((imgs) => setAvailable(imgs));
  };
  
  // ⭐ FUNZIONE DI CARICAMENTO DA CODICE
  const handleLoadCode = () => {
    setLoadError(null);
    if (!inputCode.trim()) {
      setLoadError("Inserisci il codice per caricare la Tier List.");
      return;
    }

    const payload = decodeData(inputCode.trim());

    if (payload) {
      // 2. Aggiorna TUTTI gli stati dell'applicazione con i dati decodificati
      setTiers(payload.tiers as Record<TierName, ImageItem[]>); // Cast per la Type safety
      setCharts(payload.charts);
      setVisiblePoints(payload.visiblePoints);
      
      // La lista disponibile deve essere svuotata
      setAvailable([]); 
      
      setInputCode('');
      
      console.log("Tier List ricostruita con successo!");
    } else {
      setLoadError("Codice non valido o Tier List corrotta. Assicurati di aver copiato l'intera stringa.");
    }
  };


  // --- RENDER DEL COMPONENTE ---

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-start bg-gradient-to-b from-purple-100 to-white overflow-x-hidden">

      <div className="flex flex-col items-center justify-start w-full px-4 sm:px-6 lg:px-10 py-6 flex-grow">
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-purple-700 text-center mb-8 leading-tight">
          🏅 Tier List Maker
        </h1>
        <p className="text-gray-600 text-xl text-center max-w-3xl mb-10">
          Il codice generato **contiene tutti i dati codificati e compressi** per ricostruire la tua Tier List in qualsiasi momento!
        </p>

        {/* --- SEZIONE CARICAMENTO CODICE --- */}
        <div className="w-full max-w-4xl bg-white p-6 rounded-xl shadow-lg mb-8 border border-purple-200">
            <h2 className="text-2xl font-bold text-purple-700 mb-4 text-center">
                ⬇️ Carica Tier List da Codice
            </h2>
            <div className="flex flex-col sm:flex-row gap-3">
                <textarea
                    value={inputCode}
                    onChange={(e) => { setInputCode(e.target.value); setLoadError(null); }}
                    placeholder="Incolla qui il codice Tier List..."
                    rows={2}
                    className={`flex-1 p-2 border rounded-lg resize-none font-mono text-sm ${loadError ? 'border-red-500' : 'border-gray-300'}`}
                />
                <button
                    onClick={handleLoadCode}
                    className="w-full sm:w-auto px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition self-stretch"
                >
                    Carica
                </button>
            </div>
            {loadError && (
                <p className="mt-2 text-sm text-red-500 text-center font-medium">
                    {loadError}
                </p>
            )}
        </div>
        {/* --- FINE SEZIONE CARICAMENTO --- */}


        {/* CONTAINER PRINCIPALE TIERS + SIDEBAR */}
        <div className="w-full max-w-6xl flex flex-col md:flex-row gap-6"> 

          {/* --- CATEGORIE TIERS --- */}
          <div className="flex-1 space-y-4 flex flex-col">
            {tierNamesWithEmoji.map((tier) => (
              <div key={tier.label} className="flex flex-col gap-2">
                <h3 className="text-xl font-bold text-center">
                  {tier.label}
                  <span className="block text-2xl mt-1">{tier.emoji}</span>
                </h3>

                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropOnTier(e, tier.label as TierName)}
                  className="flex flex-wrap justify-center gap-2 sm:gap-3 bg-white border border-gray-200 rounded-lg min-h-[90px] p-3 transition-all"
                >
                  {tiers[tier.label as TierName].length === 0 ? (
                    <div className="text-sm text-gray-400 italic">Trascina qui</div>
                  ) : (
                    tiers[tier.label as TierName].map((it) => (
                      <img
                        key={it.id}
                        src={it.src}
                        alt={it.alt ?? ""}
                        draggable
                        onDragStart={(e) => handleDragStart(e, it, tier.label)}
                        className="w-16 sm:w-20 md:w-24 h-auto object-cover rounded-md cursor-grab shadow hover:scale-105 transition-transform"
                      />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* --- SIDEBAR DESTRO: IMMAGINI DISPONIBILI --- */}
          {/* ⭐ SISTEMATO: Altezza massima e Sticky per lo scroll indipendente */}
          <div className="w-full md:w-60 flex-shrink-0"> 
            {/* Contenitore Sticky: Fissato in alto con altezza massima per lo scorrimento */}
            <div className="md:sticky md:top-6 flex flex-col max-h-[90vh]"> 
              <h2 className="text-lg font-semibold mb-3 text-center">Mappe disponibili</h2>
              {/* Box Scorrevole: Deve avere 'overflow-y-auto' e 'max-h' */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDropOnAvailable}
                className="flex flex-col gap-3 bg-white border border-dashed border-gray-300 rounded-lg p-4 overflow-y-auto max-h-[80vh] flex-grow"
              >
                {available.length === 0 ? (
                  <div className="text-sm text-gray-400 italic">Nessuna immagine disponibile</div>
                ) : (
                  available.map((img) => (
                    <img
                      key={img.id}
                      src={img.src}
                      alt={img.alt ?? ""}
                      draggable
                      onDragStart={(e) => handleDragStart(e, img, "available")}
                      className="w-24 h-24 object-cover rounded-md cursor-grab shadow hover:scale-105 transition-transform"
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* --- TITOLO SEMPLICE SOPRA I GRAFICI --- */}
        <div className="w-full text-center mt-12">
          <h2 className="text-xl sm:text-2xl font-bold text-purple-700">
            📊 Scelta delle Probabilità
          </h2>
          <p className="text-gray-600 text-sm">
            Controlla e regola le difficoltà nelle fasi del torneo.
          </p>
        </div>

        {/* --- CONTAINER GRAFICI --- */}
        <div className="mt-8 w-full max-w-5xl flex flex-row gap-4 overflow-x-auto">
          {charts.map((points, chartIndex) => {
            const data = points.map((y, i) => ({
              name: pointNames[i], 
              value: visiblePoints[chartIndex][i] ? y : null,
            }));

            return (
              <div key={chartIndex} className="p-4 bg-purple-50 rounded-2xl shadow-md min-w-[180px] flex-1">
                <h3 className="text-lg font-semibold mb-2 text-purple-800">{chartNames[chartIndex]}</h3>

                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 5]} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#8b5cf6"
                        strokeWidth={3}
                        dot={{ r: 6 }}
                        activeDot={{ r: 8 }}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {/* Controlli sotto */}
                <div className="flex justify-between mt-3">
                  {points.map((_, pointIndex) => (
                    <div key={pointIndex} className="flex flex-col items-center">
                      <input
                        type="checkbox"
                        checked={visiblePoints[chartIndex][pointIndex]}
                        onChange={() => togglePoint(chartIndex, pointIndex)}
                        className="accent-purple-600 h-4 w-4"
                      />
                      <span className="text-xs mt-1">{pointNames[pointIndex]}</span>
                      <div className="flex mt-1 gap-1">
                        <button
                          onClick={() => handleValueChange(chartIndex, pointIndex, +1)}
                          className="bg-purple-200 hover:bg-purple-300 text-xs rounded px-2"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => handleValueChange(chartIndex, pointIndex, -1)}
                          className="bg-purple-200 hover:bg-purple-300 text-xs rounded px-2"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 mt-8">

          <button
            onClick={handleConfirm}
            className="w-full sm:w-auto px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            OK
          </button>
          <button
            onClick={handleCancel}
            className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Annulla
          </button>
        </div>
      </div>

      {/* 1. POPUP CODICE UNIVOCO */}
      {showCode && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg mx-4 flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-purple-700">Il tuo codice univoco (Autosufficiente e Compresso)</h3>
            <textarea
              readOnly
              value={uniqueCode}
              rows={6}
              className="w-full p-2 border rounded text-xs text-gray-800 font-mono resize-none overflow-y-scroll bg-white text-black"
              onFocus={(e) => e.target.select()}
              style={{ overflowWrap: 'break-word' }}
            />
            <p className="mt-2 text-sm text-gray-500 text-center">
                Conserva questo codice: usa la compressione **Pako** per essere più breve. 
                Incollalo nella casella "Carica Tier List" per ricostruirla.
            </p>
            <button
              onClick={handleClosePopup}
              className="mt-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
            >
              Chiudi
            </button>
          </div>
        </div>
      )}

      {/* 2. POPUP DI SCELTA FINALE */}
      {showFinalChoice && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80 flex flex-col gap-4">
            <h3 className="text-xl font-semibold text-purple-700 text-center">
              Mappe non selezionate
            </h3>
            <p className="text-gray-600 text-center">
              Ci sono **{available.length}** mappe rimanenti. Dove vuoi inserirle?
            </p>

            <div className="flex justify-between gap-3">
              <button
                onClick={() => handleFinalChoice("Normale")}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
              >
                Normale 😐
              </button>
              <button
                onClick={() => handleFinalChoice("Ban")}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
              >
                Ban ❌
              </button>
            </div>
            <button
                onClick={() => setShowFinalChoice(false)}
                className="mt-2 text-sm text-gray-500 hover:text-gray-700"
            >
                Torna Indietro
            </button>
          </div>
        </div>
      )}

    </div>
  );
}