'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function MobileLoginCard() {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleNext = () => {
    if (phone.length < 10) return;
    
    setIsLoading(true);
    setLoadingText('INITIALIZING SECURE UPLINK...');
    
    // Simulate OTP step sequence
    setTimeout(() => {
      setLoadingText('GEOSPATIAL SYNC COMPLETE.');
      setTimeout(() => {
        login(phone);
        router.push('/');
      }, 800);
    }, 1500);
  };

  return (
    <div className="bg-[#0f1824e0] border border-[rgba(16,185,129,0.25)] p-8 w-full max-w-sm relative overflow-hidden flex flex-col items-center">
      <div className="w-full text-left mb-6 relative z-10">
        <label className="block text-emerald-400/90 text-xs font-mono tracking-widest uppercase mb-2">
          Secure Link - Mobile
        </label>
        
        <div className="flex items-center gap-3 border-b border-gray-600 focus-within:border-[#2DD4BF] transition-all duration-300 pb-2 mt-4">
          <span className="text-xl grayscale">🇮🇳</span>
          <span className="text-gray-400 font-mono text-lg font-medium">+91</span>
          <input
            type="tel"
            maxLength={10}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            className="bg-transparent border-none outline-none text-white font-mono text-lg w-full placeholder-gray-600 tracking-wider"
            placeholder="000 000 0000"
            autoFocus
          />
        </div>
      </div>

      <button
        onClick={handleNext}
        disabled={phone.length < 10 || isLoading}
        className="w-full relative group overflow-hidden bg-[rgba(15,24,36,0.88)] hover:bg-[#2DD4BF]/10 border border-[#2DD4BF]/50 hover:border-[#2DD4BF] text-[#2DD4BF] font-mono font-bold uppercase tracking-widest text-xs py-4 px-6 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 flex items-center justify-center gap-2 mt-2 z-10"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{loadingText}</span>
          </>
        ) : (
          <span>INITIATE UPLINK</span>
        )}
      </button>

      {/* Decorative elements */}
      <div className="absolute top-4 right-4 flex gap-1 z-0">
        <div className="w-1.5 h-1.5 bg-[#2DD4BF] animate-pulse" style={{ animationDelay: '0ms' }}></div>
        <div className="w-1.5 h-1.5 bg-[#2DD4BF] animate-pulse" style={{ animationDelay: '300ms' }}></div>
        <div className="w-1.5 h-1.5 bg-[#2DD4BF] animate-pulse" style={{ animationDelay: '600ms' }}></div>
      </div>
    </div>
  );
}
