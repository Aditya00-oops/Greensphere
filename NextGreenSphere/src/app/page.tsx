'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wind, Coins, Satellite, Camera, CheckCircle2, Truck, BarChart3, Recycle, ShieldCheck, FileWarning, Upload, AlertTriangle, Sun, Moon } from 'lucide-react';

import dynamic from 'next/dynamic';
const LeafletMapContainer = dynamic(() => import('@/components/LeafletMapContainer'), { ssr: false });

import AIScanner from '@/components/AIScanner';
import { X } from 'lucide-react';

import { useGlobal } from '@/context/GlobalContext';

export default function B2BDashboard() {
  const { activeScan, setActiveScan } = useGlobal();
  const [step, setStep] = useState(0); 
  const [logistics, setLogistics] = useState<null | string>(null);
  const [receipt, setReceipt] = useState<null | any>(null);
  const [liveFeed, setLiveFeed] = useState([
    "2.1kg PET Plastic secured in Malviya Nagar — Available for Buyback.",
    "0.8kg E-Waste secured in Mansarovar — Sent to Verification.",
  ]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [ghostMode, setGhostMode] = useState(false);
  const [shake, setShake] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const chimeRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') setIsDarkMode(true);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    chimeRef.current = new Audio('https://actions.google.com/sounds/v1/ui/soft_bell_ding.ogg');
    if (chimeRef.current) chimeRef.current.volume = 0.5;
  }, []);

  const impactStats = [
    { icon: <Recycle className="text-accent" size={18} />, text: "Feedstock: 4,200kg" },
    { icon: <Wind className="text-blue-500" size={18} />, text: "Offsets: 1.2 Metric Tons" },
    { icon: <Coins className="text-amber-500" size={18} />, text: "Issued: 15,400 $VERT" },
    { icon: <Truck className="text-textSecondary" size={18} />, text: "Active Trucks: 12" },
  ];

  const triggerConfetti = async () => {
    const confetti = (await import('canvas-confetti')).default;
    const end = Date.now() + 2 * 1000;
    const colors = ['#10B981', '#A7F3D0', '#FCD34D'];
    (function frame() {
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors: colors });
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors: colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());
  };

  const handleContribute = () => {
    if (step > 0) return;
    setStep(1); 
    setLogistics(null);
    setReceipt(null);
    setGhostMode(false);

    setTimeout(() => {
      setStep(2); 

      setTimeout(() => {
        const category = "Plastic (HDPE)";
        const weight = "3.2kg";
        
        setStep(3); 

        setTimeout(() => {
          const payload = JSON.stringify({ type: category, urgency: "High", coords: [26.9124, 75.7873], status: "Dispatched" });
          setLogistics(`TRUCK DISPATCHED: ${payload}`);
          setStep(4); 
          setReceipt({ category, weight, credits: 25 });
          
          if (chimeRef.current) chimeRef.current.play().catch(() => {});
          if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([100, 50, 100]);
          
          setShake(true);
          setTimeout(() => setShake(false), 500);

          triggerConfetti();
          setLiveFeed(prev => [`${weight} ${category} secured in Central Park — Available for Buyback.`, ...prev].slice(0, 3));

          setTimeout(() => {
            setStep(0);
          }, 5000);

        }, 2000);
      }, 3000);
    }, 2000);
  };

  return (
    <motion.div 
      animate={shake ? { x: [-5, 5, -5, 5, 0] } : {}}
      transition={{ duration: 0.4 }}
      className="min-h-screen pb-32 font-sans selection:bg-accent/30 overflow-x-hidden bg-background text-textPrimary transition-colors duration-300"
    >
      <AnimatePresence>
        {receipt && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }} 
            animate={{ y: 20, opacity: 1 }} 
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[100] glass-panel px-6 py-4 rounded-2xl flex items-center gap-4 border-accent"
          >
            <div className="bg-accent/20 p-2 rounded-full"><CheckCircle2 className="text-accent" /></div>
            <div>
              <h4 className="font-bold text-textPrimary">Verification Receipt</h4>
              <p className="text-xs text-textSecondary">{receipt.weight} {receipt.category} • EXIF Validated</p>
            </div>
            <div className="ml-4 pl-4 border-l border-border">
              <span className="block text-xl font-black text-accent">+{receipt.credits} $VERT</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="p-6 flex justify-between items-center max-w-[90rem] mx-auto z-50 relative">
        <div className="flex items-center gap-3">
          <div className="bg-accent/10 p-2.5 rounded-2xl border border-accent/20">
            <BarChart3 className="text-accent" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-textPrimary">GreenSphere</h1>
            <p className="text-xs font-semibold tracking-wider uppercase text-textSecondary">Circular Economy Dashboard</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div 
            className="bg-surface border border-border rounded-full p-1 flex items-center relative w-[88px] h-[44px] cursor-pointer"
            onClick={() => setIsDarkMode(!isDarkMode)}
          >
            <motion.div 
              className="absolute top-1 bottom-1 w-[40px] bg-card rounded-full z-0 border border-border shadow-sm"
              animate={{ x: isDarkMode ? 40 : 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
            <div className={`relative z-10 flex-1 flex justify-center transition-colors duration-300 ${!isDarkMode ? 'text-textPrimary' : 'text-textSecondary'}`}>
              <Sun size={18} strokeWidth={2.5} />
            </div>
            <div className={`relative z-10 flex-1 flex justify-center transition-colors duration-300 ${isDarkMode ? 'text-textPrimary' : 'text-textSecondary'}`}>
              <Moon size={18} strokeWidth={2.5} />
            </div>
          </div>

          <div className="glass-button px-5 py-2.5 rounded-full flex items-center gap-2 hidden sm:flex">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-sm font-semibold tracking-wide text-textPrimary">System Online</span>
          </div>
        </div>
      </header>

      <div className="w-full overflow-hidden whitespace-nowrap py-3 border-y border-border bg-card mb-6 z-40 relative">
        <div className="inline-block animate-marquee no-scrollbar">
          {[...impactStats, ...impactStats, ...impactStats].map((stat, i) => (
            <motion.div key={i} whileHover={{ y: -2 }} className="inline-flex items-center gap-2 mx-4 glass-button px-5 py-2 rounded-full">
              {stat.icon}
              <span className="font-semibold text-sm text-textPrimary">{stat.text}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="max-w-[90rem] mx-auto px-4 grid grid-cols-1 xl:grid-cols-12 gap-6 relative z-10">
        
        <div className="xl:col-span-8 flex flex-col gap-6">
          <div className="glass-panel p-2 h-[500px] relative rounded-3xl overflow-hidden z-10">
            <div className="absolute top-6 left-6 z-[1000] glass-panel px-4 py-3 rounded-xl">
              <h2 className="text-lg font-bold tracking-tight flex items-center gap-2 text-textPrimary">
                <Satellite size={18} className="text-accent" /> Geospatial Intelligence Map
              </h2>
            </div>
            {ghostMode && (
              <div className="absolute top-6 right-6 z-[1000] glass-panel text-textPrimary px-4 py-2 rounded-xl flex items-center gap-2 animate-pulse border-blue-500/50">
                <ShieldCheck size={16} className="text-blue-500" />
                <span className="text-xs font-bold">Sector Lockdown: Satellite Verification Pending</span>
              </div>
            )}
<LeafletMapContainer ghostMode={ghostMode} isDarkMode={isDarkMode} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-6 rounded-3xl z-20 relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold flex items-center gap-2 text-textPrimary"><Camera size={18} className="text-accent"/> Live Verification Feed</h3>
              </div>
              <div className="h-32 bg-surface rounded-2xl border border-border flex items-center justify-center p-6 relative overflow-hidden">
                <AnimatePresence mode="wait">
                  {activeScan ? (
                    <motion.div initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} className="w-full text-center">
                      <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${activeScan.materials?.[0].toLowerCase().includes('false') ? 'text-red-500' : 'text-accent'}`}>
                        {activeScan.materials?.[0].toLowerCase().includes('false') ? 'Invalid Source Detected' : 'AI Analysis Active'}
                      </div>
                      <div className="text-2xl font-black text-textPrimary uppercase tracking-tighter mb-1">
                        {activeScan.materials?.[0]}
                      </div>
                      <div className="flex items-center justify-center gap-4">
                        <div className="text-[10px] font-bold text-textSecondary px-2 py-0.5 border border-border rounded-md">
                          CONFIDENCE: {activeScan.confidence}%
                        </div>
                        <div className="text-[10px] font-bold text-accent px-2 py-0.5 bg-accent/10 rounded-md">
                          SEVERITY: {activeScan.severity}/10
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <>
                      {step === 0 && <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="text-sm font-semibold text-textSecondary uppercase tracking-wide">Awaiting Intel Capture...</motion.div>}
                      {step === 1 && <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex flex-col items-center gap-2 text-blue-500"><Satellite className="animate-pulse" size={24}/><span className="text-xs font-bold uppercase tracking-wider">Parsing EXIF Geolocation...</span></motion.div>}
                      {step === 2 && <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="w-full"><div className="flex justify-between text-xs font-bold uppercase text-accent mb-2"><span>ViT Model Scanning</span><span className="animate-pulse">Categorizing...</span></div><div className="h-2 bg-border rounded-full overflow-hidden"><motion.div className="h-full bg-accent w-full animate-pulse" /></div></motion.div>}
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-3xl z-20">
              <h3 className="font-bold flex items-center gap-2 mb-4 text-textPrimary"><BarChart3 size={18} className="text-accent"/> B2B Secured Feed</h3>
              <div className="space-y-3">
                <AnimatePresence>
                  {liveFeed.map((feed, idx) => (
                    <motion.div key={feed + idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-surface p-3 rounded-xl border border-border text-xs font-medium text-textPrimary flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />{feed}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-5 z-10 relative h-min">
          <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-accent transition-colors">
            <div className="absolute top-0 right-0 bg-accent text-white text-[10px] font-black tracking-wider uppercase px-4 py-1.5 rounded-bl-xl shadow-sm">Core SaaS</div>
            <BarChart3 className="text-accent mb-3" size={32} />
            <h3 className="font-black text-xl mb-1 text-textPrimary">Verified Inventory Map</h3>
            <p className="text-sm font-medium mb-4 text-textSecondary">B2B Data Marketplace for Recycling Plants.</p>
            <div className="w-full bg-surface rounded-xl p-4 border border-border shadow-inner">
              <div className="flex justify-between text-xs font-black text-accent mb-2 uppercase tracking-wide"><span>High-Purity Feedstock</span><span>2.4k Tons</span></div>
              <div className="w-full h-2 bg-border rounded-full overflow-hidden"><div className="w-[75%] h-full bg-accent rounded-full" /></div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl transition-colors">
            <ShieldCheck className="text-blue-500 mb-3" size={32} />
            <h3 className="font-black text-xl mb-1 text-textPrimary">Carbon Credit Aggregator</h3>
            <p className="text-sm font-medium mb-4 text-textSecondary">Bundled actions into Corporate-Grade ESG Certificates.</p>
            <div className="text-4xl font-black text-blue-500 tracking-tight">1.2m <span className="text-lg font-bold text-blue-400 tracking-normal">Tons Offset</span></div>
          </div>

          <div className="glass-panel p-6 rounded-3xl transition-colors">
            <div className="flex justify-between items-start mb-3">
              <Coins className="text-amber-500" size={32} />
              <span className="bg-amber-500/10 text-amber-600 text-[10px] font-black tracking-wider uppercase px-2 py-1 rounded-lg">15% Marketplace Fee</span>
            </div>
            <h3 className="font-black text-xl mb-1 text-textPrimary">Eco-Affiliate Store</h3>
            <p className="text-sm font-medium mb-4 text-textSecondary">Spend $VERT with partner eco-brands.</p>
            <div className="flex gap-2">
              <div className="w-10 h-10 rounded-full bg-surface border-2 border-border shadow-sm" />
              <div className="w-10 h-10 rounded-full bg-border border-2 border-border shadow-sm -ml-4" />
              <div className="w-10 h-10 rounded-full bg-accent border-2 border-border shadow-sm -ml-4 flex items-center justify-center text-[10px] font-black text-white">+42</div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[1000]">
        <div className={`conic-border rounded-full p-[3px] shadow-[0_10px_40px_rgba(16,185,129,0.3)]`}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsScannerOpen(true)}
            className={`relative px-10 py-5 rounded-full font-black tracking-wide text-xl flex items-center gap-3 transition-colors bg-card text-accent border border-border shadow-[0_0_20px_rgba(16,185,129,0.2)]`}
          >
            <Camera size={26} className="text-accent" />
            Capture Intel (AI Scan)
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {isScannerOpen && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsScannerOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative z-10 w-full max-w-md"
            >
              <button 
                onClick={() => setIsScannerOpen(false)}
                className="absolute -top-12 right-0 text-white/50 hover:text-white transition-colors"
              >
                <X size={32} />
              </button>
              <AIScanner />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
