import React from 'react';
import { QrCode, Wallet, TrendingUp } from 'lucide-react';

type Tab = 'profile' | 'inventory' | 'market';

interface Props {
  activeTab: Tab;
  setActiveTab: React.Dispatch<React.SetStateAction<Tab>>;
}

export default function FarmerNav({ activeTab, setActiveTab }: Props) {
  return (
    <nav className="bg-slate-900 text-white p-4 flex justify-around fixed bottom-0 left-0 right-0 max-w-md mx-auto border-t border-slate-700">
      <button onClick={() => setActiveTab('profile')} className={activeTab === 'profile' ? 'text-emerald-400' : ''}>
        <QrCode /> ID
      </button>
      <button onClick={() => setActiveTab('inventory')} className={activeTab === 'inventory' ? 'text-emerald-400' : ''}>
        <Wallet /> Vault
      </button>
      <button onClick={() => setActiveTab('market')} className={activeTab === 'market' ? 'text-emerald-400' : ''}>
        <TrendingUp /> Pulse
      </button>
    </nav>
  );
}