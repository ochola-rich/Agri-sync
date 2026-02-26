// src/components/Collector/CollectorNav.tsx
import React from 'react';
import { LayoutDashboard, CloudUpload } from 'lucide-react';

interface CollectorNavProps {
  activeTab: string;
  setActiveTab: (tab: 'terminal' | 'cloud') => void;
  isOnline: boolean;
}

export default function CollectorNav({ activeTab, setActiveTab, isOnline }: CollectorNavProps) {
  return (
    <nav className="absolute bottom-6 left-6 right-6 bg-white rounded-[2.5rem] p-3 flex justify-around items-center shadow-2xl border border-slate-100">
      <button
        onClick={() => setActiveTab('terminal')}
        className={`flex flex-col items-center p-2 transition-all ${
          activeTab === 'terminal' ? 'text-indigo-600 scale-110' : 'text-slate-400'
        }`}
      >
        <LayoutDashboard size={24} />
        <span className="text-[8px] font-black mt-1 uppercase">Terminal</span>
      </button>

      <button
        onClick={() => setActiveTab('cloud')}
        className={`flex flex-col items-center p-2 transition-all relative ${
          activeTab === 'cloud' ? 'text-indigo-600 scale-110' : 'text-slate-400'
        }`}
      >
        <CloudUpload size={24} />
        <span className="text-[8px] font-black mt-1 uppercase">Inventory</span>
        {!isOnline && (
          <div className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
        )}
      </button>
    </nav>
  );
}