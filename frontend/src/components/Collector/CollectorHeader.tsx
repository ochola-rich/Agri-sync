// src/components/Collector/CollectorHeader.tsx
import React from 'react';
import { Camera, Search } from 'lucide-react';

interface CollectorHeaderProps {
  isOnline: boolean;
  onScan: () => void;
}

export default function CollectorHeader({ isOnline, onScan }: CollectorHeaderProps) {
  return (
    <header className="bg-white p-5 pt-8 border-b border-slate-200 shrink-0">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Collection Log</h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
            {isOnline ? 'Online' : 'Offline'}
          </p>
        </div>
        <button 
          onClick={onScan}
          className="w-10 h-10 bg-white text-slate-900 rounded-lg flex items-center justify-center border border-slate-300 hover:bg-slate-50 active:scale-95 transition-all"
        >
          <Camera size={20} />
        </button>
      </div>
    </header>
  );
}