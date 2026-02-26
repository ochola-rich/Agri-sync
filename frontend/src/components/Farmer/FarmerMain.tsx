import React from 'react';
import QRCodeGenerator from '../QRCodeGenerator';
import { CheckCircle, ShieldCheck } from 'lucide-react';
import type { Farmer, Collection } from '../../types';

interface FarmerMainProps {
  activeTab: string;
  farmerWallet: { paid: number; pending: number };
  farmerHistory: Collection[];
  myFarmerProfile: Farmer;
  marketPrices?: Record<string, { current: number; color: string }>;
}

export default function FarmerMain({ activeTab, farmerWallet, farmerHistory, myFarmerProfile, marketPrices = {} }: FarmerMainProps) {
  return (
    <main className="flex-1 overflow-y-auto p-5 pb-28 space-y-6">
      {/* Profile */}
      {activeTab === 'profile' && (
        <div className="animate-in fade-in flex flex-col items-center pt-4 space-y-8">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
              Global ID
            </div>
            <QRCodeGenerator data={JSON.stringify({ ...myFarmerProfile, type: 'agrisync-identity' })} size={200} />
            <div className="mt-6 flex items-center justify-center gap-2 text-slate-600 font-black text-sm uppercase">
              <ShieldCheck size={18} /> Verified Sync Profile
            </div>
          </div>
        </div>
      )}

      {/* Inventory */}
      {activeTab === 'inventory' && (
        <div>
          <h3 className="text-xl font-black">Collections</h3>
          <p className="text-sm text-slate-500">Your recent yields</p>
          <div className="mt-4 space-y-3">
            {farmerHistory.length === 0 && <div className="text-slate-500">No collections yet</div>}
            {farmerHistory.map((c) => (
              <div key={c.id} className="bg-white p-3 rounded-md border border-slate-200">
                <div className="flex justify-between">
                  <div className="font-black">{c.cropType}</div>
                  <div className="text-sm text-slate-500">{new Date(c.createdAt).toLocaleString()}</div>
                </div>
                <div className="text-slate-600 text-sm mt-2">Weight: {c.weightKg} kg — ${ (c.weightKg * c.pricePerKg).toFixed(2) }</div>
                <div className="mt-2 text-[11px] font-black uppercase">{c.status}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Market */}
      {activeTab === 'market' && (
        <div className="space-y-4">
          <h3 className="text-xl font-black text-slate-900">Market Pulse</h3>
          <p className="text-sm text-slate-500">Current crop prices (local cache)</p>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {Object.keys(marketPrices).map((crop) => {
              const p = marketPrices[crop];
              return (
                <div key={crop} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center">
                  <div>
                    <p className="font-black text-slate-900">{crop}</p>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">price / kg</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900">${p.current.toFixed(2)}</p>
                    <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${p.color}`}></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fallback */}
      {!['profile','inventory','market'].includes(activeTab) && (
        <div className="p-10 text-center text-slate-500">
          No content for tab: {activeTab}
        </div>
      )}
    </main>
  );
}