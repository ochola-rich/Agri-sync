import React from 'react';
import { QrCode } from 'lucide-react';

interface FarmerHeaderProps {
  profile: { name: string };
  onVerify: () => void;
}

export default function FarmerHeader({ profile, onVerify }: FarmerHeaderProps) {
  return (
    <header className="bg-slate-900 p-6 pt-10 text-white shrink-0 border-b border-slate-800">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center border border-white/10 overflow-hidden">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-xl font-black leading-none">{profile.name}</h1>
            <p className="text-[10px] text-slate-300 w-fit px-2 py-0.5 rounded-full font-black uppercase mt-2 tracking-wider border border-white/10">
              Member
            </p>
          </div>
        </div>
        <button
          onClick={onVerify}
          className="bg-white text-slate-900 w-12 h-12 rounded-lg flex flex-col items-center justify-center gap-1 active:scale-95 transition-all border border-slate-200"
        >
          <QrCode size={20} />
          <span className="text-[9px] font-black uppercase">Verify</span>
        </button>
      </div>
    </header>
  );
}