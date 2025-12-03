import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion"; 
import { Button } from "@/components/ui/button";

// Definizione Tipi Mappe
interface MapImageItem {
  id: number;
  src: string;
  alt: string; 
}

interface TierMatrixRow {
  tierName: string;
  probQualifica: number;
  probInterna: number;
  probFinale: number;
  mapNames: string[];
}

// Definizione Tipi Torneo
interface Participant {
  nickname: string;
  name: string;
  seeding?: number;
  points?: number;
  currentPosition: number | string;
  isManualScore: boolean;
  manualScore: number | null;
  nextserie?: number;
  nextposition?: number;
}

interface Group extends Array<Participant> {}

interface Tournament {
  code: string;
  name: string;
  race: number;
  maxraces: number; 
  stations: number;
  participants: Participant[];
  temporaryResults: any[];
  stationsPositions?: number[];
  started: boolean;
  tierList: TierMatrixRow[]; 
  temporaryMaps?: string[]; // Array di 4 nomi di file mappa
  selectedMap?: string; // Mappa selezionata per la gara (Nome file)
  currentMapIndex?: number; // Indice della mappa selezionata
  chosenMaps?: string[]; // ⭐ NUOVO CAMPO: Mappe già uscite
}

// URL dell'API GitHub
const GITHUB_MAPS_URL = "https://api.github.com/repos/ff-falco/MKLegacy/contents/Mappecontorneo2";


// ⭐ FUNZIONI HELPER LOGICHE (Mantengono il loro scope esterno o interno)

interface ChosenMapsSummaryProps {
  chosenMaps: string[];
  allMapImages: MapImageItem[];
  maxRaces: number;
}

const ChosenMapsSummary: React.FC<ChosenMapsSummaryProps> = ({ chosenMaps, allMapImages, maxRaces }) => {
  if (!chosenMaps || chosenMaps.length === 0) return null;

  const mapLookup = useMemo(() => {
      return allMapImages.reduce((acc, img) => {
          if (img.alt) { acc[img.alt] = img; }
          return acc;
      }, {} as Record<string, MapImageItem>);
  }, [allMapImages]);

  // Logica per categorizzare le mappe in base all'indice (che corrisponde al numero di gara)
  const categorizedMaps = chosenMaps.reduce((acc, mapName, index) => {
      const raceNumber = index + 1;
      let category: 'Qualifica' | 'Normale' | 'Finale';
      
      if (raceNumber === 1) {
          category = 'Qualifica';
      } else if (raceNumber === maxRaces) {
          category = 'Finale';
      } else {
          category = 'Normale';
      }

      if (!acc[category]) {
          acc[category] = [];
      }

      const mapItem = mapLookup[mapName];

      // L'oggetto pushato contiene tutti i dati necessari per il rendering
      acc[category].push({ 
          mapName, 
          raceNumber, 
          mapItem 
      });
      
      return acc;
  }, {} as Record<string, { mapName: string, raceNumber: number, mapItem: MapImageItem | undefined }[]>);

  // Funzione helper per renderizzare una singola card mappa
  const renderMapCard = (map: { mapName: string, raceNumber: number, mapItem: MapImageItem | undefined }, index: number) => {
      const mapItem = map.mapItem;
      const imageUrl = mapItem?.src || `https://placehold.co/300x160/999999/FFFFFF?text=${getNamePart(map.mapName)}`;
      const displayTitle = getNamePart(map.mapName);

      return (
          <motion.div
              key={map.raceNumber}
              className="w-full bg-white rounded-xl shadow-lg border border-gray-200 p-3 overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
          >
              <div
                  className="w-full h-24 bg-cover bg-center rounded-lg mb-2 border border-gray-300"
                  style={{ backgroundImage: `url(${imageUrl})` }}
                  title={displayTitle}
              />
              <p className="text-center font-semibold text-gray-800 text-sm break-words leading-tight">{displayTitle}</p>
              {map.raceNumber > 1 && map.raceNumber < maxRaces && (
                   <p className="text-center text-xs text-gray-500">Gara {map.raceNumber}</p>
              )}
          </motion.div>
      );
  };

  return (
      <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-5xl mt-6 p-6 bg-gray-50 shadow-2xl rounded-2xl border border-gray-300"
      >
          <h2 className="text-2xl font-bold mb-6 text-center text-purple-700">🗺️ Riepilogo Mappe Giocate</h2>
          
          <div className="space-y-6">
              
              {/* 1. Qualifica */}
              {categorizedMaps['Qualifica'] && (
                  <section>
                      <h3 className="text-xl font-bold mb-3 border-b-2 border-green-500 pb-1 text-green-700">
                          Qualifica (Gara 1)
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 center">
                          {categorizedMaps['Qualifica'].map(renderMapCard)}
                      </div>
                  </section>
              )}
              
              {/* 2. Gare Intermedie */}
              {categorizedMaps['Normale'] && (
                  <section>
                      <h3 className="text-xl font-bold mb-3 border-b-2 border-blue-500 pb-1 text-blue-700">
                          Gare Intermedie ({categorizedMaps['Normale'].length})
                      </h3>
                      {/* Ordina le mappe 'Normale' per numero di gara */}
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          {categorizedMaps['Normale']
                              .sort((a, b) => a.raceNumber - b.raceNumber)
                              .map(renderMapCard)}
                      </div>
                  </section>
              )}

              {/* 3. Finale */}
              {categorizedMaps['Finale'] && (
                  <section>
                      <h3 className="text-xl font-bold mb-3 border-b-2 border-red-500 pb-1 text-red-700">
                          Finale (Gara {maxRaces})
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          {categorizedMaps['Finale'].map(renderMapCard)}
                      </div>
                  </section>
              )}
          </div>
          
      </motion.div>
  );
};



// Funzione helper per trovare il peso (probabilità) di una Tier nella gara corrente
const getTierWeight = (tier: TierMatrixRow, currentRace: number, maxraces: number): number => {
    if (currentRace === 1) { 
        return tier.probQualifica;
    } 
    if (currentRace === maxraces) {
        return tier.probFinale;
    }
    // Gare Intermedie
    return tier.probInterna;
};


const selectMaps = (tournament: Tournament): string[] => {
    const mapsToSelectCount = 4;
    const selectedMaps: string[] = [];
    
    // Usiamo una mappa delle mappe disponibili (copia profonda)
    const availableMapsByTier: { [key: string]: string[] } = {};
    let totalWeight = 0;
    
    const tierList: TierMatrixRow[] = tournament.tierList || []; 
    // ⭐ ESTRAZIONE MAPPE ESCLUSE
    const chosenMapsSet = new Set(tournament.chosenMaps || []);


    // Popolamento iniziale delle mappe disponibili e calcolo peso totale
    for (const tier of tierList) {
        // ⭐ FILTRA LE MAPPE GIÀ USATE PRIMO DI INIZIALIZZARE availableMapsByTier
        const usableMaps = (tier.mapNames || []).filter(map => !chosenMapsSet.has(map));

        if (tier.tierName === 'Ban') {
             availableMapsByTier[tier.tierName] = [...usableMaps];
             continue; // Ban non partecipa al peso
        }
        
        availableMapsByTier[tier.tierName] = [...usableMaps];
        
        // Calcola il peso SOLO se ci sono mappe disponibili
        const weight = (usableMaps.length > 0) 
            ? getTierWeight(tier, tournament.race, tournament.maxraces)
            : 0;
            
        totalWeight += weight; 
    }
    
    // Funzione interna per eseguire l'estrazione di una Tier pesata
    const selectWeightedTier = (currentWeight: number): string | null => {
        if (currentWeight === 0) return null; 

        let randomWeight = Math.random() * currentWeight;

        for (const tier of tierList) {
            if (tier.tierName === 'Ban') continue;

            const weight = getTierWeight(tier, tournament.race, tournament.maxraces);
            
            // ⭐ Aggiungiamo un controllo di sicurezza in più qui, anche se il peso totale dovrebbe gestirlo
            if (availableMapsByTier[tier.tierName]?.length === 0) {
                 randomWeight -= 0; // Se la categoria è vuota, non rimuovere peso ma non selezionarla.
                 continue;
            }

            if (randomWeight < weight) {
                return tier.tierName; // Trovata la Tier in base al peso
            }
            randomWeight -= weight;
        }
        return null;
    };
    
    let currentTotalWeight = totalWeight;

    // --- Ciclo di Estrazione delle 4 Mappe ---
    while (selectedMaps.length < mapsToSelectCount) {
        
        let mapFound = false;
        let attempts = 0;
        let tierWeightsChanged = false; // Flag per sapere se dobbiamo ricalcolare il peso totale

        // Tenta l'estrazione pesata
        while (attempts < tierList.length * 2 && !mapFound) { // Aumentato gli attempts per sicurezza
            
            const selectedTierName = selectWeightedTier(currentTotalWeight);

            if (selectedTierName && availableMapsByTier[selectedTierName].length > 0) {
                // 1. Estrai una mappa a caso da quella Tier
                const availableMaps = availableMapsByTier[selectedTierName];
                const randomIndex = Math.floor(Math.random() * availableMaps.length);
                const mapName = availableMaps.splice(randomIndex, 1)[0]; 
                
                selectedMaps.push(mapName);
                mapFound = true;
                
                // 2. Ricalcola il peso se la Tier è ora vuota
                if (availableMaps.length === 0) {
                    const weight = getTierWeight(tierList.find(t => t.tierName === selectedTierName)!, tournament.race, tournament.maxraces);
                    currentTotalWeight = Math.max(0, currentTotalWeight - weight); 
                    tierWeightsChanged = true;
                }
            } else if (selectedTierName && availableMapsByTier[selectedTierName].length === 0) {
                 // Questo caso è meno probabile dopo il filtro iniziale, ma gestisce l'estrazione pesata
                 // di una Tier che si è appena svuotata.
                 const weight = getTierWeight(tierList.find(t => t.tierName === selectedTierName)!, tournament.race, tournament.maxraces);
                 currentTotalWeight = Math.max(0, currentTotalWeight - weight);
                 tierWeightsChanged = true;
            }
            attempts++;
        }
        
        // Se tutti i pesi sono scesi a zero prima di trovare 4 mappe, procedi al fallback BAN
        if (!mapFound && selectedMaps.length < mapsToSelectCount && currentTotalWeight <= 0) {
             break; // Forza l'uscita dal ciclo interno per il fallback BAN
        }

        // 3. Gestione Fallback Estremo (Se le estrazioni pesate falliscono o mappe esaurite)
        if (!mapFound && selectedMaps.length < mapsToSelectCount) {
            const banMaps = availableMapsByTier['Ban'] || []; // Usiamo la lista filtrata e modificabile

            if (banMaps.length > 0) {
                // Prendi una mappa a caso dalla categoria Ban e rimuovila dalla lista di Ban per non ripeterla
                const randomIndex = Math.floor(Math.random() * banMaps.length);
                const mapName = banMaps.splice(randomIndex, 1)[0]; 
                selectedMaps.push(mapName);
                mapFound = true; // Necessario per uscire dal while(selectedMaps.length < mapsToSelectCount)
            } else {
                 console.error("Non ci sono più mappe disponibili, nemmeno nella categoria Ban.");
                 break;
            }
        }
    }

    return selectedMaps;
};
// ⭐ FINE FUNZIONI DI SELEZIONE MAPPE PESATA

// Funzione helper per creare l'array casuale senza ripetizioni
const generateRandomPositions = (size: number): number[] => {
  const positions = Array.from({ length: size }, (_, i) => i + 1);
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  return positions;
};

// Funzione per estrarre la parte del nome che segue il trattino (utilizzata per UI)
const getNamePart = (alt: string): string => {
    if (!alt) return 'N/D';
    const nameWithoutExt = alt.substring(0, alt.lastIndexOf('.') > 0 ? alt.lastIndexOf('.') : alt.length);
    const separatorIndex = nameWithoutExt.indexOf('-');
    if (separatorIndex !== -1) {
      return nameWithoutExt.substring(separatorIndex + 1).trim();
    }
    return nameWithoutExt; 
};


// ⭐ COMPONENTE MAP SELECTION INCLUSO NELLO STESSO FILE
interface MapSelectionProps {
  mapNames: string[];
  allMapImages: MapImageItem[];
  onMapSelected: (selectedMapName: string | null) => void; 
  initialSelectedMap: string | null;
}

const MapSelectionComponent = ({ mapNames, allMapImages, onMapSelected, initialSelectedMap }: MapSelectionProps) => {
  const [selectedMap, setSelectedMap] = useState<string | null>(initialSelectedMap);

  const mapLookup = useMemo(() => {
    // ⭐ CORREZIONE TS: Tipizzazione corretta dell'accumulatore
    return allMapImages.reduce((acc, img) => {
      if (img.alt) { acc[img.alt] = img; }
      return acc;
    }, {} as Record<string, MapImageItem>);
  }, [allMapImages]);

  useEffect(() => {
      // Inizializza il selettore se il torneo ha già una mappa selezionata
      if (initialSelectedMap && initialSelectedMap !== selectedMap) {
          setSelectedMap(initialSelectedMap);
      }
  }, [initialSelectedMap]);

  // Gestore della selezione
  const handleSelection = (mapName: string) => {
    const newSelection = selectedMap === mapName ? null : mapName;
    setSelectedMap(newSelection);
    // ⭐ CHIAMA LA FUNZIONE DI SALVATAGGIO IMMEDIATO TRAMITE PROPS
    onMapSelected(newSelection); 
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto p-4">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
        Seleziona la Mappa per la Gara Corrente
      </h2>
      <div className="flex justify-center gap-4 flex-wrap">
        {mapNames.map((mapName, index) => {
          const mapItem = mapLookup[mapName];
          const isSelected = selectedMap === mapName;
          
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
              {selectedMap ? getNamePart(selectedMap) : "Nessuna"}
            </span>
          </p>
      </div>
    </div>
  );
};
// ⭐ FINE COMPONENTE MAP SELECTION

export default function RaceManagerPage() {
  const { code } = useParams<{ code: string }>();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [savedGroups, setSavedGroups] = useState<number[]>([]);
  const [editableGroups, setEditableGroups] = useState<number[]>([]);
  const [globalRanking, setGlobalRanking] = useState<any[]>([]);
  
  // ⭐ STATI PER GESTIONE MAPPA
  const [allMapImages, setAllMapImages] = useState<MapImageItem[]>([]);
  const [mapImagesLoading, setMapImagesLoading] = useState(true);
  //const [selectedRaceMap, setSelectedRaceMap] = useState<string | null>(null);
  // ⭐ Rimosso il flag 'mapSelectionStage' come blocco

  const showModalMessage = (message: string, isConfirm: boolean = false): Promise<boolean> => {
    if (isConfirm) {
      try {
        return Promise.resolve(window.confirm(message));
      } catch (e) {
        console.warn("window.confirm bloccato o non disponibile.", e);
        return Promise.resolve(true); 
      }
    }
    try {
      window.alert(message);
    } catch (e) {
      console.warn("window.alert bloccato o non disponibile.", e);
      console.log("Messaggio (fallback):", message);
    }
    return Promise.resolve(true);
  };

  // Funzioni logistiche ripristinate qui per l'utilizzo:
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
  // Fine Funzioni logistiche


  // ⭐ FUNZIONE PER FETCH DELLE IMMAGINI
  const fetchGitHubImages = async (): Promise<MapImageItem[]> => {
    try {
      const githubToken = import.meta.env.VITE_GITHUB_TOKEN; 
    
      let headers: Record<string, string> = {}; // Inizializza come oggetto vuoto (valido)

      if (githubToken) {
          // Aggiunge l'intestazione solo se il token esiste ed è una stringa non vuota
          headers = {
              'Authorization': `token ${githubToken}`
          };
      }
      const response = await fetch(GITHUB_MAPS_URL, { headers });
      const files = await response.json();

      if (!Array.isArray(files)) return [];

      const images: MapImageItem[] = files
        .filter((f: any) => f.type === "file" && f.name.match(/\.(png|jpg|jpeg|gif)$/i))
        .map((f: any, index: number) => ({
          id: index + 1,
          src: f.download_url,
          alt: f.name as string, 
        }));

      return images.sort((a, b) => getNamePart(a.alt).localeCompare(getNamePart(b.alt)));
    } catch (e) {
      console.error("Errore nel fetching delle immagini di GitHub:", e);
      return [];
    }
  };


  useEffect(() => {
    if (!code) return;

    // 1. Fetch delle immagini
    fetchGitHubImages().then(imgs => {
        setAllMapImages(imgs);
        setMapImagesLoading(false);
    });

    // 2. Fetch del torneo
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/tournament/${code}`)
      .then((res) => {
        const t: Tournament = res.data;
        
        t.participants = t.participants || [];
        t.stations = t.stations || 1;
        t.temporaryResults = t.temporaryResults || [];
        t.maxraces = t.maxraces || 5;
        t.stationsPositions = t.stationsPositions || [];
        if (t.stationsPositions.length === 0) {
          t.stationsPositions = Array.from({ length: t.stations }, (_, i) => i + 1);
        } 
        t.temporaryMaps = t.temporaryMaps || [];


        const globalRanking = [...(t.participants || [])]
        .sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
        setGlobalRanking(globalRanking);
        
        let distribuiti: Group[] = [];
        let completedGroups: number[] = [];
        
        // Logica di distribuzione (omessa per brevità, ma presente)
        if(t.race === 1){ // Ordinamento per qualifiche
            const ordered = [...t.participants].sort((a, b) => (a.seeding ?? 9999) - (b.seeding ?? 9999));
            const totalGroups = Math.ceil(ordered.length / t.stations);
            
            for (let i = 0; i < totalGroups; i++) {
                const start = i * t.stations;
                const end = start + t.stations;

                const group: Group = ordered.slice(start, end).map((p) => {
                    const tr = t.temporaryResults.find((r: any) => r.nickname === p.nickname && r.serie === i + 1);
                    return {
                        ...p,
                        currentPosition: tr?.position ?? "",
                        isManualScore: tr?.manual ?? tr?.beer ?? false, 
                        manualScore: tr?.manualScore ?? tr?.points ?? null, 
                    } as Participant;
                });
                
                const groupCompleted = group.every((p) => p.currentPosition !== "");
                if (groupCompleted) completedGroups.push(i);
                distribuiti.push(group);
            }
        
        } else if(t.race > 1) { // Ordinamento per gare interne
            const maxSerie = Math.max(...t.participants.map((p: any) => p.nextserie || 1));
            
            for (let i = 1; i <= maxSerie; i++) {
                const groupParticipants = t.participants.filter((p: any) => p.nextserie === i);
                const group: Group = [];

                for (let j = 1; j <= t.stationsPositions.length; j++) {
                    let positionValue = t.stationsPositions[j-1];
                    const p = groupParticipants.find((gp: any) => gp.nextposition === positionValue);
                    if (p) {
                        const tr = t.temporaryResults.find((r: any) => r.nickname === p.nickname && r.serie === i);
                        group.push({
                            ...p,
                            currentPosition: tr?.position ?? "",
                            isManualScore: tr?.manual ?? tr?.beer ?? false, 
                            manualScore: tr?.manualScore ?? tr?.points ?? null, 
                        } as Participant);
                    }
                }
                const groupCompleted = group.every((p) => p.currentPosition !== "");
                if (groupCompleted) completedGroups.push(i - 1);
                distribuiti.push(group);
            }
        }
        
        setTournament({ ...t });
        setGroups(distribuiti);
        setSavedGroups(completedGroups);

        // ⭐ LOGICA DI SELEZIONE MAPPE ALL'AVVIO
        const mapsAlreadyGenerated = t.temporaryMaps.length > 0;
        
        if (!mapsAlreadyGenerated && t.race <= t.maxraces) {
            // Seleziona le mappe solo se non sono state ancora estratte
            const newTemporaryMaps = selectMaps(t); 
            
            axios.post(`${import.meta.env.VITE_API_URL}/api/tournament/${code}/temporary-maps`, {
              temporaryMaps: newTemporaryMaps,
          })
          .then(() => {
              setTournament(prev => ({ ...prev!, temporaryMaps: newTemporaryMaps }));
          })
          .catch(console.error);
        }

        // ⭐ Setta lo stato locale della mappa in base ai dati del DB
        
        //setSelectedRaceMap(t.selectedMap || null);
      })
      .catch(console.error);
  }, [code]);


  // ⭐ FUNZIONE AGGIORNATA: Salva il nome della mappa al click
  const handleMapSelectedCallback = async (mapName: string | null) => {
    
    if (!tournament || !tournament.temporaryMaps) {
        //setSelectedRaceMap(null);
        setTournament(prev => ({ ...prev!, selectedMap: undefined, currentMapIndex: undefined }));
        return;
    }

    
    // Aggiornamento dello stato locale per feedback immediato
    //setSelectedRaceMap(mapName);
    if(!mapName){
        setTournament(prev => ({ ...prev!, selectedMap: undefined, currentMapIndex: undefined }));
        return;
    }
    console.log("Salvataggio mappa selezionata:", mapName);
    try {
        await axios.patch(`${import.meta.env.VITE_API_URL}/api/tournament/${code}/temporary-map-name`, {
            selectedMap: mapName
        }).catch(console.error);
        
        // Aggiorna lo stato di React con i nuovi valori salvati
        setTournament(prev => ({ ...prev!, selectedMap: mapName}));

    } catch (err) {
        console.error("Errore nel salvataggio della mappa selezionata:", err);
        showModalMessage("Errore nel salvataggio della mappa. Riprova.", false);
    }
  };


  // --- RESTO DELLE FUNZIONI DENTRO IL COMPONENTE ---

  const handleChangePosition = (nickname: string, groupIndex: number, position: number) => {
    // ... (Logica handleChangePosition esistente)
    setGroups((prevGroups) => {
      return prevGroups.map((group, index) => {
        if (index !== groupIndex) { return group; }
        return group.map((participant) => {
          if (participant.nickname !== nickname) { return participant; }
          return { ...participant, currentPosition: position, };
        });
      });
    });
  };

  const handleToggleManualScore = (nickname: string, groupIndex: number) => {
    // ... (Logica handleToggleManualScore esistente)
    setGroups((prevGroups) => {
      return prevGroups.map((group, index) => {
        if (index !== groupIndex) { return group; }
        return group.map((participant) => {
          if (participant.nickname !== nickname) { return participant; }
          const newIsManualScore = !participant.isManualScore;
          return {
            ...participant,
            isManualScore: newIsManualScore,
            manualScore: newIsManualScore ? participant.manualScore : null,
          };
        });
      });
    });
  };

  const handleChangeManualScore = (nickname: string, groupIndex: number, score: string) => {
    // ... (Logica handleChangeManualScore esistente)
    setGroups((prevGroups) => {
      return prevGroups.map((group, index) => {
        if (index !== groupIndex) { return group; }
        return group.map((participant) => {
          if (participant.nickname !== nickname) { return participant; }
          return {
            ...participant,
            manualScore: score === "" ? null : Number(score),
          };
        });
      });
    });
  };
  

  const handleSaveGroupResults = (groupIndex: number) => {
    // ... (Logica handleSaveGroupResults esistente)
    const group = groups[groupIndex];
    if (!group || !tournament) return;
    
    // ⭐ Controllo Mappa Selezionata (NON BLOCCHIAMO IL SALVATAGGIO DEL GRUPPO)
    // L'avviso rimane, ma non forziamo lo stage qui.
    if (!tournament.selectedMap) {
        showModalMessage("ATTENZIONE: Nessuna mappa selezionata! La mappa non verrà registrata con questi risultati.", false);
    }
  
    const positionsTaken = group
      .filter((p) => p.currentPosition)
      .map((p) => p.currentPosition);

    const groupResults = group
      .filter((p) => p.currentPosition)
      .map((p) => ({
        nickname: p.nickname,
        serie: groupIndex + 1,
        position: Number(p.currentPosition), 
        manual: p.isManualScore , 
        manualScore: p.isManualScore ? (p.manualScore ?? 0) : null,
        startingposition: p.nextposition || 0,
      }));
  
    let updatedTemporaryResults = [...(tournament?.temporaryResults || [])];
    updatedTemporaryResults = updatedTemporaryResults.filter(
      (r) => r.serie !== groupIndex + 1
    );
    updatedTemporaryResults = [...updatedTemporaryResults, ...groupResults];
  
    axios
      .post(`${import.meta.env.VITE_API_URL}/api/tournament/${code}/temporary-results`, {
        temporaryResults: updatedTemporaryResults,
        positionsTaken: positionsTaken,
      })
      .then(() => {
        // ⭐ CORREZIONE TIPO QUI
        setTournament((prev: any) => ({
          ...prev!,
          temporaryResults: updatedTemporaryResults,
        }));
        setSavedGroups((prev) => [...new Set([...prev, groupIndex])]);
        setEditableGroups((prev) => prev.filter((g) => g !== groupIndex));
      })
      .catch(console.error);
    
    const updatedTournament = {
      ...tournament!, 
      temporaryResults: updatedTemporaryResults,
      stationsPositions: positionsTaken as number[]
    }

    setGroups((prevGroups) => {
      const newGroups = [...prevGroups];
      const nextGroup = newGroups[groupIndex + 1];
      
      const arrivalPositions = updatedTournament.stationsPositions || [];

      if (!nextGroup || arrivalPositions.length === 0) return newGroups;
  
      const reorderedGroup: (Participant | null)[] = Array(arrivalPositions.length).fill(null);

      arrivalPositions.forEach((arrivalPosValue, index) => {
        const participantToMove = nextGroup.find(p => p.nextposition === arrivalPosValue);
        if (participantToMove) {
          reorderedGroup[index] = participantToMove;
        }
      });
  
      newGroups[groupIndex + 1] = reorderedGroup.filter(p => p !== null) as Group;
      
      return newGroups;
    });
  };

  const handleRewind = async () => {
    if (!tournament) return;
    
    
    const confirmationText = "⚠️ Sei sicuro di voler tornare indietro? Tutti i risultati di questa gara verranno persi definitivamente.";

    // Usiamo la funzione helper per la conferma
    const conferma = await showModalMessage(confirmationText, true);

    if (!conferma) return;

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/tournament/${code}/rewind`);
      showModalMessage("✅ Tutti i risultati sono stati ripristinati");
      // Ricarica la pagina per aggiornare lo stato del torneo
      window.location.reload();
    } catch (err) {
      console.error(err);
      showModalMessage("❌ Errore durante il passaggio alla prossima azione del torneo.");
    }
  };


  // ✅ FUNZIONE PER ASSEGNARE RISULTATI CASUALI (Aggiornata)
  const handleRandomizeGroupResults = (groupIndex: number) => {
    setGroups(prevGroups => {
      const newGroups = [...prevGroups];
      const group = newGroups[groupIndex];
      if (!group) return prevGroups;

      const groupSize = group.length;
      const randomPositions = generateRandomPositions(groupSize);

      const updatedGroup: Participant[] = group.map((p, i) => {
        const isManual = Math.random() < 0.2; // 20% di probabilità di punteggio manuale
        return {
          ...p,
          currentPosition: randomPositions[i], // Assegna la posizione casuale univoca
          isManualScore: isManual, // AGGIUNTO
          manualScore: isManual ? Math.floor(Math.random() * 100) : null, // AGGIUNTO (punteggio casuale 0-99)
        };
      });

      newGroups[groupIndex] = updatedGroup;
      return newGroups;
    });
  };
  // ----------------------------------------------------

  // --- FUNZIONE PER SALTARE IL RIORDINO (NUOVA) ---
  const handleSkipReordering = async () => {
    const conferma = await showModalMessage(
      "⚠️ Sei sicuro di voler saltare il riordino? La lista dei partecipanti per tutte le serie non ancora salvate sarà riordinata in base alla posizione di partenza prevista (nextposition).",
      true
    );

    if (!conferma || !tournament) return;

    // Applica il riordino "standard" a tutti i gruppi non ancora salvati
    setGroups((prevGroups) => {
      const newGroups = [...prevGroups];
      
      // Itera su tutti i gruppi
      for (let i = 0; i < newGroups.length; i++) {
        // Se il gruppo è già stato salvato, saltalo
        if (savedGroups.includes(i)) continue;

        let group = newGroups[i];
        
        // Riordina i partecipanti del gruppo in base alla loro posizione di partenza prevista (nextposition)
        // Questo riporta l'ordine a quello "previsto" (1a riga -> 1° di nextposition, 2a riga -> 2° di nextposition)
        const reorderedGroup = [...group].sort((a, b) => (a.nextposition ?? 9999) - (b.nextposition ?? 9999));
        
        // Sostituisci il gruppo non salvato con la versione riordinata
        newGroups[i] = reorderedGroup;
      }
      
      showModalMessage("✅ Riordino saltato! Le serie non salvate sono state allineate per posizione di partenza.");
      return newGroups;
    });
  };
  // --------------------------------------------------

  const toggleEditGroup = (groupIndex: number) => {
    if (editableGroups.includes(groupIndex)) {
      setEditableGroups((prev) => prev.filter((i) => i !== groupIndex));
    } else {
      setEditableGroups((prev) => [...prev, groupIndex]);
      setSavedGroups((prev) => prev.filter((i) => i !== groupIndex)); // togli il gruppo dai salvati quando entri in edit
    }
  };

  // Determina il testo del pulsante in base a race e maxraces (LOGICA REINSERITA)
  const getNextRaceButtonText = () => {
    if (!tournament) return "Caricamento...";
    
    // Ultima gara prima della finale (Gara maxraces - 1)
    if (tournament.race === tournament.maxraces - 1) {
      return "🏆 Vai alla Finale";
    }

    // Gara Finale (Gara maxraces)
    if (tournament.race === tournament.maxraces) {
      return "✅ Termina Torneo";
    }

    // --- 🚨 INIZIO FIX 🚨 ---
    // Aggiunto controllo per torneo terminato
    if( tournament.race > tournament.maxraces){
      return "✅ Torneo Terminato";
    }
    // --- 🚨 FINE FIX 🚨 ---

    // Gara intermedia
    return "⏭ Prossima Gara";
  };
  
  // Determina l'azione da eseguire al click del pulsante (LOGICA REINSERITA)
  const handleNextAction = async () => {
    if (!tournament) return;

    if (tournament.race > tournament.maxraces) {
      showModalMessage("Il torneo è già terminato.");
      return;
    }
    
    // ⭐ Se la mappa non è selezionata, forziamo la schermata di selezione
    if (!tournament.selectedMap) {
        showModalMessage("Devi selezionare una mappa prima di avanzare.", false);
        // Non blocca, ma avvisa e apre la selezione.
        return; 
    }

    const isFinalRace = tournament.race === tournament.maxraces;
    const isQualifyingRace = tournament.race === 1;
    const nextIsFinalRace = tournament.race === tournament.maxraces - 1;
    
    const confirmationText = isFinalRace 
      ? "⚠️ Sei sicuro di voler terminare il torneo? Tutti i risultati verranno salvati in modo definitivo e la classifica finale sarà stabilita."
      : "⚠️ Sei sicuro di voler passare alla prossima gara? Tutti i risultati correnti verranno salvati in modo definitivo.";

    const conferma = await showModalMessage(confirmationText, true);

    if (!conferma) return;

    try {
      if (isFinalRace) {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/tournament/${code}/finale`); 
        showModalMessage("✅ Torneo terminato! La classifica finale è disponibile.");
      } else if (isQualifyingRace) {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/tournament/${code}/qualify`);
        showModalMessage("✅ Tutti i risultati sono stati salvati! Si passa alla prossima gara.");

      } else if (nextIsFinalRace) {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/tournament/${code}/finale-preparation`);
        showModalMessage("✅ Tutti i risultati sono stati salvati! Si passa alla Finale.");
    
      }else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/tournament/${code}/next-race`);
        showModalMessage("✅ Tutti i risultati sono stati salvati! Si passa alla prossima gara.");
      }
      
      // Ricarica la pagina per aggiornare lo stato del torneo
      window.location.reload();
    } catch (err) {
      console.error(err);
      showModalMessage("❌ Errore durante il passaggio alla prossima azione del torneo.");
    }
  };


  const allGroupsSaved = savedGroups.length === groups.length;
  
  if (!tournament || mapImagesLoading) {
    return <div className="flex items-center justify-center min-h-screen text-gray-600">Caricamento dati torneo e mappe...</div>;
  }

  // --- RENDER PRINCIPALE ---
  
  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-b from-white to-blue-50 p-6">
      <h1 className="text-3xl font-bold mb-2">{tournament.name} — Race Manager</h1>
      <p className="text-gray-600 mb-6">
        <strong>Codice:</strong> {tournament.code} — <strong>Postazioni:</strong> {tournament.stations} —{" "}
        <strong>Giocatori:</strong> {tournament.participants.length}
        
        <strong> {tournament.race <= tournament.maxraces ? "— Gara:" : ""} </strong> 
        {tournament.race <= tournament.maxraces 
          ? ( tournament.race === 1 
              ? "Qualifiche" 
              : (tournament.race === tournament.maxraces 
                  ? "Finale" 
                  : `${tournament.race} / ${tournament.maxraces}`)
            ) 
          : "Terminato"}
        {/* --- Dettagli Mappa Corrente --- */}
        {tournament.selectedMap && (
             <span className="ml-4 font-bold text-lg text-purple-600">
                — Mappa: {getNamePart(tournament.selectedMap)}
            </span>
        )}
      </p>
      
      {/* Condizionale: Mostra la gestione dei gruppi SOLO se il torneo non è terminato */}
      {tournament.race<=tournament.maxraces && (
        <>
          {/* ⭐ BLOCCO DI SELEZIONE MAPPA SEMPRE VISIBILE ⭐ */}
          <div className="w-full max-w-5xl mb-6 p-4 bg-yellow-50 rounded-xl shadow-lg border border-yellow-300">
              <MapSelectionComponent
                  mapNames={tournament.temporaryMaps || []}
                  allMapImages={allMapImages}
                  onMapSelected={handleMapSelectedCallback} 
                  initialSelectedMap={tournament.selectedMap || null}
              />
               {!tournament.selectedMap && (
                  <p className="mt-4 text-center text-red-700 font-semibold">
                      ⚠️ Devi selezionare una mappa per poter avanzare alla prossima gara.
                  </p>
              )}
          </div>
          {/* ⭐ FINE BLOCCO DI SELEZIONE MAPPA ⭐ */}

          <div className="grid gap-6 w-full max-w-5xl" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
            {groups.map((group, i) => {
              const prevGroupSaved = i === 0 || savedGroups.includes(i - 1);
              const isEditable = editableGroups.includes(i);
              const locked = savedGroups.includes(i) && !isEditable;

              const allPositionsFilled = group.every((p) => p.currentPosition !== "");

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl shadow-md p-4 border ${
                    locked ? "bg-gray-100" : "bg-white"
                  } border-gray-200 relative`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xl font-semibold">
                    ♦️ Serie {String.fromCharCode('A'.charCodeAt(0) + i )} {savedGroups.includes(i) && "✅"}
                    </h3>

                    {savedGroups.includes(i) && (
                      <button onClick={() => toggleEditGroup(i)} className="text-blue-600 hover:text-blue-800">
                        ✏️
                      </button>
                    )}
                  </div>
                  
                  {/* PULSANTE CASUALE */}
                  <Button
                    variant="outline"
                    onClick={() => handleRandomizeGroupResults(i)}
                    disabled={locked}
                    className={`w-full mb-3 text-sm border-dashed ${locked ? "opacity-50 cursor-not-allowed" : "hover:bg-yellow-50"}`}
                  >
                    🎲 Assegna Risultati Casuali
                  </Button>
                  {/* ---------------------------- */}


                  <ul className="space-y-2">
                    {group.map((p) => {
                      const taken = group.map((x) => x.currentPosition).filter((v) => v);
                      return (
                              <motion.li
                                key={p.nickname}
                                layout
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                className="p-2 rounded-md bg-blue-50 flex justify-between items-start"
                              >
                                <span className="pt-1">
                                  <strong>{p.seeding ? `#${p.seeding}` : `(${p.nextposition})`}</strong> {p.name} ({p.nickname})
                                </span>
                                
                                <div className="flex gap-2 items-start">
                                  
                                  <select
                                    value={p.currentPosition}
                                    // I controlli del gruppo sono disabilitati SOLO se locked o !prevGroupSaved
                                    disabled={locked || !prevGroupSaved} 
                                    onChange={(e) =>
                                      handleChangePosition(p.nickname, i, Number(e.target.value))
                                    }
                                    className={`border rounded px-2 py-1 text-sm ${
                                      locked || !prevGroupSaved
                                        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                                        : "bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    }`}
                                  >
                                    <option value="">Posizione</option>
                                    {Array.from({ length: group.length }, (_, j) => {
                                      const positionValue = j + 1;
                                      const isTaken = taken.includes(positionValue);
                                      const isCurrent = p.currentPosition === positionValue;
                                      
                                      if (!isTaken || isCurrent) {
                                          return (
                                              <option key={positionValue} value={positionValue}>
                                                  {positionValue}
                                              </option>
                                          );
                                      }
                                      return null;
                                    })}
                                  </select>

                                  {/* Sostituzione della "beer" label */}
                                {tournament.race>1 && (
                                  <div className="flex flex-col items-end gap-1">
                                    <label className="bg-white text-black flex items-center cursor-pointer select-none text-sm whitespace-nowrap">
                                      <input
                                        type="checkbox"
                                        checked={p.isManualScore}
                                        disabled={locked || !prevGroupSaved}
                                        onChange={() => handleToggleManualScore(p.nickname, i)}
                                        className="mr-1"
                                      />
                                      Manuale
                                    </label>

                                    {/* Input numerico condizionale */}
                                    {p.isManualScore && (
                                      <input
                                        type="number"
                                        placeholder="Punti"
                                        value={p.manualScore ?? ""}
                                        disabled={locked || !prevGroupSaved}
                                        onChange={(e) =>
                                          handleChangeManualScore(p.nickname, i, e.target.value)
                                        }
                                        className="bg-white text-black border rounded px-2 py-1 text-sm w-24" 
                                      />
                                    )}
                                  </div>
                                )}
                                  {/* Fine sostituzione */}

                                </div>
                              </motion.li>
                            );
                          })}
                  </ul>


                  <Button
                    variant="default"
                    onClick={() => handleSaveGroupResults(i)}
                    // I pulsanti di salvataggio devono essere indipendenti dalla selezione mappa
                    disabled={!allPositionsFilled || locked || !prevGroupSaved}
                    className={`mt-4 w-full ${
                      !allPositionsFilled || locked || !prevGroupSaved ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    💾 Salva risultati
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {/* CLASSIFICA GLOBALE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl mt-10 p-4 bg-white shadow-md rounded-2xl border border-gray-200"
      >
        <h2 className="text-xl font-bold mb-4">🏆 Classifica Generale</h2>

        <ul className="columns-2 md:columns-4 gap-x-6">
          {globalRanking.map((p, idx) => (
            <li
              key={p.nickname}
              className="flex justify-between p-2 rounded-lg bg-gray-50 break-inside-avoid mb-2"
            >
              <span className="font-semibold">
                {idx + 1}. {p.name} ({p.nickname})
              </span>
              <span className="text-blue-600 font-bold">
                {p.points ?? 0} pts
              </span>
            </li>
          ))}
        </ul>

      </motion.div>
      {/* FINE CLASSIFICA GLOBALE */}
      {tournament.race > tournament.maxraces && tournament.chosenMaps && (
          <ChosenMapsSummary 
              chosenMaps={tournament.chosenMaps} 
              allMapImages={allMapImages}
              maxRaces={tournament.maxraces}
          />
      )}
      <div className="flex justify-center gap-4 mt-8">
        <button
          className="bg-gray-400 text-white px-6 py-2 rounded disabled:opacity-50"
          disabled={tournament.race === 1} // Disabilitato se siamo in Gara 1 (Qualifiche)
          onClick={handleRewind}
        >
          ⬅️ Torna indietro
        </button>
        
        {tournament && tournament.race <= tournament.maxraces && (
          <>
            <Button
              variant="outline"
              onClick={handleSkipReordering}
              disabled={allGroupsSaved} 
              className={`bg-red-500 text-white hover:bg-red-600 border-red-700 disabled:opacity-50 ${allGroupsSaved ? "cursor-not-allowed" : ""}`}
            >
              🚫 Salta riordino (LAN interrotta)
            </Button>

            {/* ⭐ Pulsante di Azione Principale / Prossima Gara ⭐ */}
            <Button
                variant="default"
                // Disabilitato se: (Nessuna mappa selezionata) OPPURE (Non tutti i gruppi sono salvati)
                disabled={!tournament.selectedMap || !allGroupsSaved} 
                className={!tournament.selectedMap || !allGroupsSaved ? "opacity-50 cursor-not-allowed" : ""}
                onClick={handleNextAction} 
              >
                {getNextRaceButtonText()}
              </Button>
          </>
        )}

      </div>

    </div>
  );
}