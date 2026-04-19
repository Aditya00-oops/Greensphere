'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Camera, CheckCircle2, TrendingUp, BarChart3, CloudRain, UploadCloud, X } from 'lucide-react';

import dynamic from 'next/dynamic';
const MapContainerV3 = dynamic(() => import('@/components/MapContainerV3'), { ssr: false });


export default function GreenSphereV3() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(0); 

  useEffect(() => {
    // Add or remove .dark class to body
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const triggerConfetti = async () => {
    const confetti = (await import('canvas-confetti')).default;
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 }, colors: ['#10B981', '#34D399', '#A7F3D0'] });
  };

  const startUplink = () => {
    setStep(1); // Scanning
    setTimeout(() => {
      setStep(2); // Categorizing
      setTimeout(() => {
        setStep(3); // 100% Verified
        triggerConfetti();
        setTimeout(() => {
          setModalOpen(false);
          setStep(0);
        }, 3000);
      }, 2000);
    }, 1500);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden transition-colors duration-400 ease-in-out font-sans">
      
      {/* Background Map Layer */}
      <div className="absolute inset-0 z-0">
        <MapContainerV3 isDarkMode={isDarkMode} />
      </div>

      {/* Dynamic Island Toggle (Top Center) */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50">
        <div className="glass-panel rounded-full p-1.5 flex items-center gap-1 shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
          <motion.button 
            whileTap={{ scale: 0.96 }}
            onClick={() => setIsDarkMode(false)}
            className={`p-2 rounded-full transition-colors ${!isDarkMode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-white'}`}
          >
            <Sun size={18} />
          </motion.button>
          <motion.button 
            whileTap={{ scale: 0.96 }}
            onClick={() => setIsDarkMode(true)}
            className={`p-2 rounded-full transition-colors ${isDarkMode ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <Moon size={18} />
          </motion.button>
        </div>
      </div>

      {/* Hero Header (Top Left) */}
      <div className="absolute top-6 left-6 z-40">
        <div className="glass-panel px-5 py-3 rounded-2xl flex items-center gap-3">
          <div className="bg-emerald-500/20 p-2 rounded-xl border border-emerald-500/30">
            <Leaf className="text-emerald-500" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">GreenSphere 3.0</h1>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Ethereal Obsidian</p>
          </div>
        </div>
      </div>

      {/* Aero-Glass Right Sidebar */}
      <motion.div 
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, delay: 0.5 }}
        className="absolute top-0 right-0 h-full w-[400px] z-40 p-6 flex flex-col gap-5 overflow-y-auto no-scrollbar"
      >
        <div className="glass-panel w-full h-full rounded-[2rem] p-6 flex flex-col gap-6">
          
          <div className="flex items-center gap-2 border-b border-gray-500/20 pb-4">
            <BarChart3 className="text-emerald-500" />
            <h2 className="text-lg font-bold">Predictive Intelligence</h2>
          </div>

          {/* Neural Composition Analyzer */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Neural Composition</h3>
            <div className="flex w-full h-3 rounded-full overflow-hidden mb-2 shadow-inner">
              <div className="bg-emerald-500 w-[70%]" title="Polyethylene 70%" />
              <div className="bg-blue-400 w-[20%]" title="Aluminum 20%" />
              <div className="bg-amber-400 w-[10%]" title="Organic 10%" />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-gray-500">
              <span className="text-emerald-600">70% PET</span>
              <span className="text-blue-500">20% ALUM</span>
              <span className="text-amber-500">10% ORG</span>
            </div>
          </div>

          {/* Revenue Projection AI */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                <TrendingUp size={14} /> Revenue Projection
              </h3>
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
            </div>
            <div className="text-3xl font-black text-gray-900 dark:text-white my-1">₹4,250</div>
            <p className="text-[10px] text-gray-500 font-medium leading-tight">Estimated B2B Market Value based on real-time Jaipur Recycling Index.</p>
          </div>

          {/* ESG Forecast Engine */}
          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1 mb-2">
              <CloudRain size={14} /> ESG Forecast Engine
            </h3>
            <div className="bg-white/50 dark:bg-black/50 p-3 rounded-xl mb-3 font-mono text-center text-xs border border-blue-500/20 shadow-inner">
              <span className="text-gray-900 dark:text-white">E = Σ (w<sub>i</sub> × c<sub>i</sub>)</span>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <div className="text-xs text-gray-500 mb-1">Predicted CO2 Offset</div>
                <div className="text-2xl font-black text-blue-600">42.5 kg</div>
              </div>
              <div className="text-[10px] text-blue-600/70 font-bold uppercase">24HR Forecast</div>
            </div>
          </div>

        </div>
      </motion.div>

      {/* Floating Action Button (Contribute) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-8 z-50">
        <motion.button
          whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(16,185,129,0.4)' }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setModalOpen(true)}
          className="glass-button bg-emerald-500/90 text-white px-8 py-4 rounded-full font-bold tracking-wide text-lg flex items-center gap-3"
        >
          <Camera size={22} />
          Capture Intel
        </motion.button>
      </div>

      {/* Uplink Modal Overlay */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="glass-panel w-full max-w-md p-8 flex flex-col items-center relative bg-white/80 dark:bg-slate-900/80"
            >
              <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20}/></button>
              
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 mb-4">
                <UploadCloud size={32} />
              </div>
              
              <h2 className="text-xl font-bold mb-2">Neural Uplink</h2>
              <p className="text-sm text-gray-500 text-center mb-6">Upload environmental intel to process structural anomaly via Vision Transformer.</p>

              {step === 0 && (
                <motion.button 
                  whileTap={{ scale: 0.96 }}
                  onClick={startUplink}
                  className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 transition-colors"
                >
                  Simulate Upload
                </motion.button>
              )}

              {step > 0 && (
                <div className="w-full space-y-4">
                  <div className="flex justify-between text-xs font-bold uppercase text-emerald-600">
                    <span>{step === 1 ? 'Scanning Image...' : step === 2 ? 'Categorizing...' : '100% Verified'}</span>
                    <span>{step === 1 ? '33%' : step === 2 ? '85%' : '100%'}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-emerald-500"
                      initial={{ width: '0%' }}
                      animate={{ width: step === 1 ? '33%' : step === 2 ? '85%' : '100%' }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                  {step === 3 && (
                    <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="flex items-center gap-2 justify-center text-emerald-500 font-bold mt-4">
                      <CheckCircle2 /> Green Credits Minted!
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}

const Leaf = ({ className, size }: any) => <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>;
