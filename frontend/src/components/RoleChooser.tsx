import React from 'react';
import { Leaf, Users, User } from 'lucide-react';

interface RoleChooserProps {
  onChoose: (role: 'farmer' | 'collector') => void;
}

export default function RoleChooser({ onChoose }: RoleChooserProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full text-center space-y-10">
        <div className="mx-auto w-24 h-24 bg-emerald-500/10 rounded-3xl flex items-center justify-center border border-emerald-500/20">
          <Leaf className="w-14 h-14 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-6xl font-black text-white tracking-tighter">AgriSync</h1>
          <p className="text-slate-400 text-xl mt-2">Offline-first farm deals</p>
        </div>

        <div className="grid gap-5 pt-6">
          <button
            onClick={() => onChoose('collector')}
            className="group bg-white hover:bg-slate-50 active:scale-[0.985] transition-all rounded-3xl p-8 text-left shadow-2xl border border-slate-100"
          >
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Users className="w-9 h-9 text-indigo-600" />
              </div>
              <div>
                <div className="font-black text-3xl text-slate-900">Collector</div>
                <div className="text-slate-500 mt-1 leading-tight">Scan farmers • Record deals • Sync later</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => onChoose('farmer')}
            className="group bg-white hover:bg-slate-50 active:scale-[0.985] transition-all rounded-3xl p-8 text-left shadow-2xl border border-slate-100"
          >
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <User className="w-9 h-9 text-emerald-600" />
              </div>
              <div>
                <div className="font-black text-3xl text-slate-900">Farmer</div>
                <div className="text-slate-500 mt-1 leading-tight">Show your ID • Get paid instantly</div>
              </div>
            </div>
          </button>
        </div>

        <p className="text-slate-500 text-xs">48h Hackathon Demo • Data saved locally</p>
      </div>
    </div>
  );
} 