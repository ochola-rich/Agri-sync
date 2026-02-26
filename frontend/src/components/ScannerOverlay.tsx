import React from 'react';
import { X, AlertCircle } from 'lucide-react';

interface ScannerOverlayProps {
  scannerError: string | null;
  onClose: () => void;
}

export default function ScannerOverlay({ scannerError, onClose }: ScannerOverlayProps) {
  return (
    <div className="absolute inset-0 z-[100] bg-black flex flex-col">
      <div className="p-6 flex justify-between items-center text-white">
        <h2 className="font-black uppercase tracking-widest text-xs">AgriSync Scan</h2>
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full">
          <X size={20} />
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div id="reader" className="w-full max-w-sm aspect-square bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-2 border-white/10"></div>
        {scannerError && (
          <div className="mt-8 bg-rose-500/20 text-rose-300 p-4 rounded-2xl flex items-center gap-3 border border-rose-500/30">
            <AlertCircle size={20} />
            <span className="text-xs font-bold">{scannerError}</span>
          </div>
        )}
        <p className="mt-8 text-slate-400 text-center text-xs font-bold leading-relaxed px-10">
          Align the QR code within the frame to verify identity or transaction logs.
        </p>
      </div>
    </div>
  );
}