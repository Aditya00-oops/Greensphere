export type WasteType = 'plastic' | 'organic' | 'mixed' | 'metal' | 'e_waste' | 'glass' | 'paper' | 'textile' | 'hazardous';
export type SourceType = 'satellite' | 'user';

export interface Hotspot {
  id: string;
  lat: number;
  lng: number;
  severity: number; // 3-10
  type: WasteType;
  source: SourceType;
  status: 'pending' | 'collected';
}

export interface AIReply {
  type: WasteType;
  confidence: number;
  urgency: number;
}
