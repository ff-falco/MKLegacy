import { useMemo } from 'react';
import { motion } from 'framer-motion';

// Definizione Tipi (rimasta invariata, assumo siano definite altrove)
interface MapImageItem {
  id: number;
  src: string;
  alt: string; 
}

interface MapSelectionProps {
  mapNames: string[];
  allMapImages: MapImageItem[];
  // La funzione non deve più aggiornare lo stato locale del figlio
  onMapSelected: (selectedMapName: string | null) => void; 
  initialSelectedMap: string | null;
}

// Funzione per estrarre la parte del nome (rimasta invariata)
const getNamePart = (alt: string): string => {
  if (!alt) return 'N/D';
  const nameWithoutExt = alt.substring(0, alt.lastIndexOf('.') > 0 ? alt.lastIndexOf('.') : alt.length);
  const separatorIndex = nameWithoutExt.indexOf('-');
  if (separatorIndex !== -1) {
    return nameWithoutExt.substring(separatorIndex + 1).trim();
  }
  return nameWithoutExt; 
};


export default function MapSelectionComponent({ mapNames, allMapImages, onMapSelected, initialSelectedMap }: MapSelectionProps) {
  
  // ❌ RIMOSSA: Non usiamo più lo stato locale, ci affidiamo solo a initialSelectedMap
  // const [selectedMap, setSelectedMap] = useState<string | null>(initialSelectedMap);

  // Mappa per associare il nome del file all'oggetto immagine completo (URL)
  const mapLookup = useMemo(() => {
    return allMapImages.reduce((acc, img) => {
      if (img.alt) { acc[img.alt] = img; }
      return acc;
    }, {} as Record<string, MapImageItem>);
  }, [allMapImages]);

  // Gestore della selezione
  const handleSelection = (mapName: string) => {
    // 1. Usiamo initialSelectedMap (la prop dal genitore) per controllare il toggle.
    // Se la mappa cliccata è già quella selezionata dal genitore, deseleziona (null).
    const newSelection = initialSelectedMap === mapName ? null : mapName;
    
    // ❌ RIMOSSA: Nessun aggiornamento dello stato locale (setSelectedMap)

    // 2. Notifica il componente padre
    onMapSelected(newSelection); 
    
    // Il genitore riceverà newSelection, aggiornerà il suo stato, e ri-renderizzerà
    // questo componente con la prop initialSelectedMap aggiornata.
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto p-4">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
        Seleziona la Mappa per la Gara Corrente
      </h2>
      <div className="flex justify-center gap-4 flex-wrap">
        {mapNames.map((mapName, index) => {
          const mapItem = mapLookup[mapName];
          
          // ✅ Corretto: Basiamo la selezione solo sulla prop iniziale
          const isSelected = initialSelectedMap === mapName; 
          
          const imageUrl = mapItem?.src || `https://placehold.co/300x160/999999/FFFFFF?text=${getNamePart(mapName)}`;
          const displayTitle = getNamePart(mapName);

          return (
            <motion.div
              key={index}
              className={`
                relative flex flex-col items-center justify-center 
                w-full sm:w-[calc(50%-8px)] lg:w-[calc(25%-12px)] 
                p-2 rounded-xl shadow-lg cursor-pointer transition-all
              `}
              initial={{ scale: 1 }}
              whileHover={{ scale: 1.03, boxShadow: isSelected ? "0 0 15px rgba(50, 200, 50, 0.8)" : "0 5px 15px rgba(0,0,0,0.2)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelection(mapName)}
              style={{
                backgroundColor: isSelected ? '#D1FAE5' : '#f3f4f6', 
                borderColor: isSelected ? '#34D399' : '#e5e7eb',
                borderWidth: '2px',
              }}
            >
              {/* Immagine di sfondo/centro */}
              <div
                className="w-full h-40 bg-cover bg-center rounded-lg mb-3 border border-gray-300"
                style={{ backgroundImage: `url(${imageUrl})` }}
                title={displayTitle}
              />
              
              {/* Titolo */}
              <div className={`text-lg font-semibold text-center ${isSelected ? 'text-green-800' : 'text-gray-800'}`}>
                {displayTitle}
              </div>

              {/* Icona di selezione */}
              {isSelected && (
                <motion.span
                  className="absolute top-2 right-2 text-2xl"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  ✅
                </motion.span>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="mt-8 text-center">
          <p className="text-gray-600">Mappa Selezionata: 
            <span className="font-bold text-lg text-purple-600 ml-2">
              {/* ✅ Corretto: Usiamo initialSelectedMap per la visualizzazione */}
              {initialSelectedMap ? getNamePart(initialSelectedMap) : "Nessuna"}
            </span>
          </p>
      </div>
    </div>
  );
}