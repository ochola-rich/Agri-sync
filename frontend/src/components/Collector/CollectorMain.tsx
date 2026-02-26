import React from 'react';
import { Package, PlusCircle } from 'lucide-react';
import type { Farmer, Collection } from '../../types';

interface CollectorMainProps {
  activeTab: string;
  collections: Collection[];
  currentFarmer: Farmer | null;
  setCurrentFarmer: (val: Farmer | null) => void;
  initiateCollection: (e: React.FormEvent<HTMLFormElement>) => void;
  marketPrices: any;
  onScan: () => void;
}

export default function CollectorMain({ 
  activeTab, collections, currentFarmer, setCurrentFarmer, initiateCollection, marketPrices, onScan 
}: CollectorMainProps) {
  
  if (activeTab === 'terminal') {
    return (
      <main className="flex-1 overflow-y-auto p-6 pb-28">
        {!currentFarmer ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
            <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <PlusCircle className="text-slate-300" size={40} />
            </div>
            <p className="text-slate-500 font-bold">Scan a Farmer ID to start</p>
            <button
              type="button"
              onClick={onScan}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider shadow-sm active:scale-95 transition"
            >
              <PlusCircle size={18} />
              Open Scanner
            </button>
          </div>
        ) : (
          <form onSubmit={initiateCollection} className="space-y-6 animate-in slide-in-from-bottom-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <p className="text-[10px] font-black uppercase text-slate-400">Active Farmer</p>
              <h2 className="text-xl font-black text-slate-900 mt-1">{currentFarmer.name}</h2>
              <p className="text-sm text-slate-500">{currentFarmer.phone}</p>
            </div>
            
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-black uppercase text-slate-500 ml-2">Select Crop</span>
                <select name="crop" className="w-full mt-2 p-4 rounded-lg bg-white border border-slate-300 font-bold">
                  {Object.keys(marketPrices).map(crop => <option key={crop} value={crop}>{crop}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-black uppercase text-slate-500 ml-2">Weight (KG)</span>
                <input name="weight" type="number" step="0.1" required className="w-full mt-2 p-4 rounded-lg bg-white border border-slate-300 font-bold" placeholder="0.00" />
              </label>

              <button type="submit" className="w-full py-3.5 bg-slate-900 text-white rounded-lg font-bold uppercase tracking-wider shadow-sm active:scale-95 transition-all">
                Generate Receipt
              </button>
            </div>
          </form>
        )}
      </main>
    );
  }

  if (activeTab === 'cloud') {
    return (
      <main className="flex-1 p-6 space-y-4">
        <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">Local Inventory</h2>
        {collections.map((item) => (
          <div key={item.id} className="bg-white p-4 rounded-lg flex justify-between items-center border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-100 rounded-md flex items-center justify-center text-slate-500">
                <Package size={20} />
              </div>
              <div>
                <p className="font-black text-slate-800">{item.cropType}</p>
                <p className="text-[10px] font-bold text-slate-400">{item.farmerId}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-black text-slate-900">{item.weightKg}kg</p>
              <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${item.status === 'synced' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </main>
    );
  }

  return null;
}