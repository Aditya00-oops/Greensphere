'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Hotspot, WasteType } from '../types';
import { SATELLITE_LANDFILLS, INITIAL_USER_REPORTS } from '../data/mockData';

interface Toast {
  id: string;
  message: string;
}

interface FloatingMint {
  id: string;
  lat: number;
  lng: number;
  amount: number;
}

interface GlobalContextType {
  hotspots: Hotspot[];
  addReport: (lat: number, lng: number, type: WasteType, severity: number) => void;
  markCollected: (id: string) => void;
  credits: number;
  addCredits: (amount: number, reason: string, lat?: number, lng?: number) => void;
  toasts: Toast[];
  floatingMints: FloatingMint[];
  simulateScan: () => void;
  activeScan: any | null;
  setActiveScan: (scan: any | null) => void;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export function GlobalProvider({ children }: { children: ReactNode }) {
  const [hotspots, setHotspots] = useState<Hotspot[]>([...SATELLITE_LANDFILLS, ...INITIAL_USER_REPORTS]);
  const [credits, setCredits] = useState(1240);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [floatingMints, setFloatingMints] = useState<FloatingMint[]>([]);
  const [activeScan, setActiveScan] = useState<any | null>(null);

  const addToast = useCallback((message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const addCredits = useCallback((amount: number, reason: string, lat?: number, lng?: number) => {
    setCredits((prev) => prev + amount);
    
    // Add toast
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message: `+${amount} $VERT Minted: ${reason}` }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);

    // Add floating mint if lat/lng
    if (lat !== undefined && lng !== undefined) {
      const mintId = Math.random().toString();
      setFloatingMints(prev => [...prev, { id: mintId, lat, lng, amount }]);
      setTimeout(() => {
        setFloatingMints(prev => prev.filter(m => m.id !== mintId));
      }, 2000);
    }
  }, []);

  const addReport = useCallback((lat: number, lng: number, type: WasteType, severity: number) => {
    const newHotspot: Hotspot = {
      id: `user-${Date.now()}`,
      lat,
      lng,
      severity,
      type,
      source: 'user',
      status: 'pending',
    };
    setHotspots((prev) => [...prev, newHotspot]);
  }, []);

  const markCollected = useCallback((id: string) => {
    setHotspots((prev) => {
      const hotspot = prev.find(h => h.id === id);
      if (hotspot && hotspot.lat && hotspot.lng) {
        addCredits(100, 'Zone Sanitization', hotspot.lat, hotspot.lng);
      }
      return prev.map((h) => (h.id === id ? { ...h, status: 'collected' } : h));
    });
  }, [addCredits]);

  const simulateScan = useCallback(() => {
    // Adds a new satellite point
    setTimeout(() => {
      const lat = 26.9 + (Math.random() - 0.5) * 0.2;
      const lng = 75.8 + (Math.random() - 0.5) * 0.2;
      setHotspots(prev => [...prev, {
        id: `sat-scan-${Date.now()}`,
        lat,
        lng,
        severity: 8,
        type: 'mixed',
        source: 'satellite',
        status: 'pending'
      }]);
      addCredits(25, 'Satellite Verification (Ground Truth)', lat, lng);
    }, 3000);
  }, [addCredits]);

  return (
    <GlobalContext.Provider value={{ hotspots, addReport, markCollected, credits, addCredits, toasts, floatingMints, simulateScan, activeScan, setActiveScan }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="bg-[rgba(15,24,36,0.88)] border border-[#2DD4BF] text-white p-3 shadow-none font-mono text-xs w-64 animate-in slide-in-from-right-4 duration-200 pointer-events-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[#2DD4BF] font-bold tracking-widest uppercase">Minting...</span>
            </div>
            <div className="text-gray-300 mb-3">{toast.message}</div>
            {/* Progress Bar */}
            <div className="w-full h-1 bg-[#0D1117] overflow-hidden">
              <div className="h-full bg-[#2DD4BF] animate-[progress_3s_ease-out_forwards]"></div>
            </div>
          </div>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}} />
    </GlobalContext.Provider>
  );
}

export function useGlobal() {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobal must be used within a GlobalProvider');
  }
  return context;
}
