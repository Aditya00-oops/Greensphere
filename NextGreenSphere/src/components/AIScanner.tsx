'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, CheckCircle2 } from 'lucide-react';
import { useGlobal } from '@/context/GlobalContext';

export default function AIScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<null | any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addCredits, addReport, setActiveScan } = useGlobal();

  const handleScanClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/detect`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('API processing failed');
      }

      const data = await response.json();
      
      const isGarbage = data.is_garbage;
      const type = data.garbage_type || 'mixed';
      const isInvalid = type === 'INVALID_PHOTO';
      const confidence = Math.round(data.confidence * 100);
      
      const scanResult = {
        materials: isInvalid ? ['INVALID PHOTO'] : (isGarbage ? [type] : ['Clean Area']),
        confidence: confidence,
        estimatedTokens: isGarbage ? 15 : 0, 
        severity: isGarbage ? (Math.floor(data.confidence * 10)) : 0, 
        type
      };
      
      setResult(scanResult);
      setActiveScan(scanResult);
    } catch (error) {
      console.error('Error analyzing image:', error);
      const errorResult = {
        materials: ['AI Error / Missing API Key'],
        confidence: 0,
        estimatedTokens: 0,
        severity: 0,
        type: 'mixed'
      };
      setResult(errorResult);
      setActiveScan(errorResult);
    } finally {
      setIsScanning(false);
    }
  };

  const handlePost = () => {
    if (!result) return;
    
    // Simulate user location in Jaipur
    const lat = 26.9124 + (Math.random() - 0.5) * 0.05;
    const lng = 75.7873 + (Math.random() - 0.5) * 0.05;
    
    addReport(lat, lng, result.type as any, result.severity);
    if (result.estimatedTokens > 0) {
      addCredits(result.estimatedTokens, 'Reported a new hotspot');
    }
    setResult(null);
  };

  return (
    <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800 p-6 rounded-3xl w-full max-w-md mx-auto text-white shadow-[0_0_40px_rgba(16,185,129,0.1)]">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
          AI Waste Scanner
        </h2>
        <p className="text-gray-400 text-sm mt-1">Scan a hotspot to report and earn</p>
      </div>

      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
      />

      <div 
        onClick={handleScanClick}
        className={`relative w-full aspect-video rounded-2xl flex flex-col items-center justify-center border-2 border-dashed transition-all duration-300 cursor-pointer ${isScanning ? 'border-emerald-500 bg-emerald-500/10' : 'border-gray-700 bg-gray-800/50 hover:border-gray-500'}`}
      >
        {isScanning ? (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-emerald-400 font-medium animate-pulse">Analyzing materials w/ model1...</p>
          </div>
        ) : result ? (
          <div className="flex flex-col items-center text-center p-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-2" />
            <p className="font-bold text-xl text-emerald-400">Scan Complete!</p>
            <div className="mt-2 text-sm text-gray-300">
              <span className="block">Detected: {result.materials.join(', ')}</span>
              <span className="block">Confidence: {result.confidence}%</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-gray-500">
            <Camera className="w-12 h-12 mb-2" />
            <p className="font-medium">Tap to upload / capture image</p>
            <p className="text-[10px] opacity-50 mt-1">Supports JPG, PNG, WEBP</p>
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        <button 
          onClick={handleScanClick}
          disabled={isScanning}
          className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
        >
          <Camera size={20} />
          {isScanning ? 'Scanning...' : 'Scan Now'}
        </button>
        {result && (
          <button 
            onClick={handlePost}
            className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-emerald-400 font-bold py-3 px-4 rounded-xl transition-all duration-200 flex justify-center items-center gap-2"
          >
            <Upload size={20} />
            Post (+{result.estimatedTokens} TKN)
          </button>
        )}
      </div>
    </div>
  );
}
