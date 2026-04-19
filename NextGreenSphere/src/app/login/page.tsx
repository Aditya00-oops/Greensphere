'use client';

import { Shield } from 'lucide-react';
import MobileLoginCard from '@/components/MobileLoginCard';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <main className="min-h-screen relative flex flex-col items-center justify-center text-white selection:bg-emerald-500/30 font-sans overflow-hidden animate-in fade-in duration-1000">
      {/* Background Image with Dark Overlay */}
      <div className="absolute inset-0 z-0 bg-black">
        <Image
          src="/bg.png"
          alt="Satellite Control View"
          fill
          className="object-cover opacity-60"
          priority
        />
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-md px-4">
        {/* Logo / Title */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="mb-4 bg-emerald-500/10 p-4 rounded-full border border-emerald-500/30 flex items-center justify-center relative">
             <div className="absolute inset-0 rounded-full border border-emerald-400 animate-ping opacity-20"></div>
             <Shield className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-4xl font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 to-teal-100 uppercase font-mono">
            GreenSphere
          </h1>
          <p className="text-emerald-400/80 text-sm uppercase tracking-[0.2em] mt-2 font-semibold">
            Urban Waste Intelligence System
          </p>
        </div>

        {/* Floating Card */}
        <MobileLoginCard />

        {/* Footer Text */}
        <div className="mt-8 flex items-center gap-2 text-gray-500 text-xs tracking-widest uppercase font-mono">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
          Secured via satellite network
        </div>
      </div>
    </main>
  );
}
