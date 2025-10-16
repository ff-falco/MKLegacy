// src/TierListPage.tsx
import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { v4 as uuidv4 } from "uuid"; // installa con npm i uuid

type TierName = "Adlitam" | "Difficile" | "Normale" | "Facile" | "Ban";



interface ImageItem {
  id: number;
  src: string;
  alt?: string;
}

export default function TierListPage() {

  //SIDEBAR CHARTS
  const pointNames = ["👶🏼", "😐", "😡", "👹"];
  const chartNames = ["Qualifica", "Normale", "Finale"];

  const [charts, setCharts] = useState([
    [3, 2, 4, 1],
    [1, 3, 2, 4],
    [2, 4, 3, 1],
  ]);

  const [visiblePoints, setVisiblePoints] = useState([
    [true, true, true, true],
    [true, true, true, true],
    [true, true, true, true],
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

  //TIERLIST DRAG & DROP
  const [available, setAvailable] = useState<ImageItem[]>([]);
  const [tiers, setTiers] = useState<Record<TierName, ImageItem[]>>({
    Adlitam: [],
    Difficile: [],
    Normale: [],
    Facile: [],
    Ban: [],
  });


  const tierNamesWithEmoji = [
    { label: "Facile", emoji: "👶🏼" },
    { label: "Normale", emoji: "😐" },
    { label: "Difficile", emoji: "😡" },
    { label: "Adlitam", emoji: "👹" },
    { label: "Ban", emoji: "❌" },
  ];

  const fetchGitHubImages = async (): Promise<ImageItem[]> => {
    const response = await fetch(
      "https://api.github.com/repos/ff-falco/MKLegacy/contents/Mappe"
    );
    const files = await response.json();
  
    // Filtra solo i file immagine e mappa in ImageItem
    const images: ImageItem[] = files
      .filter((f: any) => f.type === "file" && f.name.match(/\.(png|jpg|jpeg|gif)$/i))
      .map((f: any, index: number) => ({
        id: index + 1,
        src: f.download_url,
        alt: f.name,
      }));
  
    // Ordina per nome del file (numerico se ci sono numeri)
    return images.sort((a, b) =>
      a.alt!.localeCompare(b.alt!, undefined, { numeric: true, sensitivity: "base" })
    );
  };

  // --- QUI: fetch immagini da GitHub ---
  useEffect(() => {
    fetchGitHubImages().then((imgs) => setAvailable(imgs));
  }, []);

  // --- Drag & Drop handlers ---
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
  
    // Inserimento mantenendo l'ordine
    setAvailable((prev) =>
      [...prev, item].sort((a, b) =>
        a.alt!.localeCompare(b.alt!, undefined, { numeric: true, sensitivity: "base" })
      )
    );
  };


// Per mostrare il codice univoco
const [showCode, setShowCode] = useState(false);
const [uniqueCode, setUniqueCode] = useState("");

const handleConfirm = () => {
  const code = uuidv4();

  const payload = {
    tiers,
    charts,
    visiblePoints,
    timestamp: Date.now(),
  };

  localStorage.setItem(`tierlist_${code}`, JSON.stringify(payload));

  setUniqueCode(code);
  setShowCode(true); // mostra il popup
};

const handleClosePopup = () => setShowCode(false);

  const handleCancel = () => {
    setTiers({ Adlitam: [], Difficile: [], Normale: [], Facile: [], Ban: [] });
    setAvailable([]);
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-start bg-gradient-to-b from-purple-100 to-white overflow-x-hidden">

    
      <div className="flex flex-col items-center justify-start w-full px-4 sm:px-6 lg:px-10 py-6 flex-grow">
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-purple-700 text-center mb-8 leading-tight">
          🏅 Tier List Maker
        </h1>
        <p className="text-gray-600 text-xl text-center max-w-3xl mb-10">
          Scegli la difficoltà delle mappe, queste compariranno con diverse probabilità all'interno del torneo. Una volta completata la tier list ti verrà dato un codice, conservalo per non dover ripetere la creazione della tier list in futuro!

        </p>

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
  <div className="w-full md:w-60 flex-shrink-0">
    <div className="sticky top-6 flex flex-col">
      <h2 className="text-lg font-semibold mb-3 text-center">Mappe disponibili</h2>
      <div
        onDragOver={handleDragOver}
        onDrop={handleDropOnAvailable}
        className="flex flex-col gap-3 bg-white border border-dashed border-gray-300 rounded-lg p-4 overflow-y-auto max-h-[80vh]"
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
    {/* --- SIDEBAR GRAFICI --- */}
<div className="mt-8 w-full max-w-5xl flex flex-row gap-4 overflow-x-auto">
  {charts.map((points, chartIndex) => {
    const data = points.map((y, i) => ({
      name: pointNames[i], // nomi personalizzati dei punti
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

    {showCode && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80 flex flex-col gap-4 text-white">
            <h3 className="text-lg font-semibold text-purple-700">Il tuo codice univoco</h3>
            <input
              type="text"
              readOnly
              value={uniqueCode}
              className="w-full p-2 border rounded text-center"
              onFocus={(e) => e.target.select()} // seleziona tutto al click
            />
            <button
              onClick={handleClosePopup}
              className="mt-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
            >
              Chiudi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
