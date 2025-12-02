// src/types.ts

// L'ordine qui DEVE corrispondere all'ordine usato nelle tuple e negli array
export type TierName = "Facile" | "Normale" | "Difficile" | "Goat" | "Adlitam" | "Ban"; 

export interface ImageItem {
  id: number;
  src: string;
  alt?: string;
}

export interface TierlistPayload {
  // Usiamo string qui per essere compatibili con le chiavi JSON decodificate,
  // ma sappiamo che sono TierName
  tiers: Record<string, ImageItem[]>; 
  charts: number[][]; 
  visiblePoints: boolean[][];
  timestamp?: number;
}