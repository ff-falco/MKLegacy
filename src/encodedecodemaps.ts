import pako from 'pako';
import type { TierlistPayload } from './types'; // ⭐ CORREZIONE QUI


// ⭐ INTERFACCIA PER IL FORMATO DI OUTPUT RICHIESTO
interface TierMatrixRow {
  tierName: string;
  probQualifica: number;
  probInterna: number;
  probFinale: number;
  mapNames: string[];
}

// --- FUNZIONI DI BASE (OMESSE PER BREVITÀ MA DA MANTENERE) ---

export const encodeData = (payload: TierlistPayload): string => {
  // ... (La tua implementazione esistente per Pako/Base64)
    try {
        const jsonString = JSON.stringify(payload);
        const compressed_array = pako.deflate(jsonString); 
        let binary_string = '';
        const len = compressed_array.length;
        for (let i = 0; i < len; i++) {
            binary_string += String.fromCharCode(compressed_array[i]); 
        }
        return btoa(binary_string);
    } catch(e) {
        console.error("Errore di codifica Pako/Base64:", e);
        return "ENCODING_ERROR";
    }
};

export const decodeData = (encodedString: string): TierlistPayload | null => {
    // ... (La tua implementazione esistente per Base64/Pako)
    try {
        const binary_string = atob(encodedString);
        const len = binary_string.length;
        const compressed_array = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            compressed_array[i] = binary_string.charCodeAt(i); 
        }
        const jsonString = pako.inflate(compressed_array, { to: 'string' });
        return JSON.parse(jsonString);
    } catch (error) {
        return null; 
    }
};

// --- ⭐ NUOVA FUNZIONE DI RICOSTRUZIONE DELLA MATRICE ⭐ ---

/**
 * Decodifica il codice Tier List e lo trasforma nel vettore di oggetti richiesto.
 * @param encodedCode Il codice Tier List (stringa Base64 compressa).
 * @returns Un vettore di oggetti con Nome Tier, 3 Probabilità e lista delle Mappe.
 */
export const reconstructTierMatrix = (encodedCode: string): TierMatrixRow[] | null => {
    const payload = decodeData(encodedCode);

    if (!payload || !payload.tiers || !payload.charts) {
        return null; // Decodifica fallita
    }

    // Ordine dei punti nei grafici (essenziale per mappare gli indici)
    const probTierOrder: string[] = ["Facile", "Normale", "Difficile", "Goat", "Adlitam"];
    const finalMatrix: TierMatrixRow[] = [];

    // 1. Processa le categorie con punti di probabilità
    probTierOrder.forEach((tierName, index) => {
        const mapsInTier = payload.tiers[tierName] || [];

        // Estrai le probabilità dalle righe di charts (charts[0]=Qualifica, charts[1]=Interna, charts[2]=Finale)
        const probQualifica = payload.charts[0]?.[index] || 0;
        const probInterna = payload.charts[1]?.[index] || 0;
        const probFinale = payload.charts[2]?.[index] || 0;
        
        // Costruisci l'oggetto per questa Tier
        finalMatrix.push({
            tierName: tierName,
            probQualifica: probQualifica,
            probInterna: probInterna,
            probFinale: probFinale,
            mapNames: mapsInTier.map(item => item.alt || '') // Ritorna solo i nomi
        });
    });

    // 2. Processa la categoria "Ban" separatamente (ha probabilità 0)
    const banMaps = payload.tiers["Ban"] || [];
    finalMatrix.push({
        tierName: "Ban",
        probQualifica: 0,
        probInterna: 0,
        probFinale: 0,
        mapNames: banMaps.map(item => item.alt || '')
    });
    
    return finalMatrix;
};
export const decodeAsObject = (encodedString: string): TierlistPayload | null => {
  return decodeData(encodedString);
};