import pako from 'pako';

// Tipi base per il payload
interface TierlistPayload {
  tiers: any;
  charts: number[][];
  visiblePoints: boolean[][];
  timestamp?: number;
}

/**
 * Codifica il payload JSON completo in una stringa compressa Base64.
 * @param payload L'oggetto stato completo da codificare.
 * @returns Il codice Tier List autosufficiente.
 */
export const encodeData = (payload: TierlistPayload): string => {
  try {
    const jsonString = JSON.stringify(payload);
    
    // 1. Compressione Gzip (restituisce Uint8Array)
    const compressed_array = pako.deflate(jsonString); 
    
    // 2. Conversione Uint8Array a stringa binaria (richiesto da btoa)
    let binary_string = '';
    const len = compressed_array.length;
    for (let i = 0; i < len; i++) {
        binary_string += String.fromCharCode(compressed_array[i]); 
    }
    
    // 3. Codifica Base64
    return btoa(binary_string);
    
  } catch(e) {
    console.error("Errore di codifica Pako/Base64:", e);
    return "ENCODING_ERROR";
  }
};

/**
 * Decodifica una stringa Base64 compressa per ricostruire il payload JSON originale.
 * @param encodedString Il codice Tier List.
 * @returns L'oggetto payload ricostruito o null.
 */
export const decodeData = (encodedString: string): TierlistPayload | null => {
  try {
    // 1. Decodifica Base64 in stringa binaria
    const binary_string = atob(encodedString);
    
    // 2. Conversione stringa binaria a Uint8Array (richiesto da Pako.inflate)
    const len = binary_string.length;
    const compressed_array = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        compressed_array[i] = binary_string.charCodeAt(i); 
    }
    
    // 3. Decompressione Gzip (restituisce stringa)
    const jsonString = pako.inflate(compressed_array, { to: 'string' });
    
    // 4. Deserializzazione JSON
    return JSON.parse(jsonString);
  } catch (error) {
    return null; 
  }
};