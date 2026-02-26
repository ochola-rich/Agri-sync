// src/components/HandshakeOverlay.tsx
import React from 'react';
import { X, CheckCircle } from 'lucide-react';
import QRCodeGenerator from './QRCodeGenerator';

interface HandshakeOverlayProps {
  pendingConfirmation: any;
  handshakeStatus: 'idle' | 'waiting' | 'verified';
  onClose: () => void;
  onSimulateScan: () => void;
}

export default function HandshakeOverlay({
  pendingConfirmation,
  handshakeStatus,
  onClose,
  onSimulateScan,
}: HandshakeOverlayProps) {
  if (!pendingConfirmation) return null;

  return (
    <div className="absolute inset-0 z-[60] bg-indigo-950 flex flex-col items-center p-6 text-white overflow-y-auto">
      <div className="w-full flex justify-between mb-8">
        <h2 className="text-xl font-black text-indigo-300">Digital Handshake</h2>
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
          <X size={20} />
        </button>
      </div>

      {handshakeStatus === 'waiting' ? (
        <div className="flex flex-col items-center w-full animate-in fade-in zoom-in-95">
          <div className="bg-white p-8 rounded-[3rem] shadow-2xl mb-8 text-center border-8 border-indigo-400/20">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
              Farmer: Scan to Confirm
            </p>
            <QRCodeGenerator data={JSON.stringify(pendingConfirmation)} size={220} />
            <div className="mt-6 flex flex-col items-center">
              <span className="text-slate-900 font-black text-3xl tracking-tight">
                {pendingConfirmation.weight}kg
              </span>
              <span className="text-indigo-600 font-bold text-sm uppercase tracking-wider">
                {pendingConfirmation.crop}
              </span>
            </div>
          </div>

          <div className="space-y-4 w-full max-w-[300px]">
            <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/10 text-center">
              <p className="text-xs font-bold text-indigo-200">Waiting for Farmer Signature...</p>
            </div>
            <button
              onClick={onSimulateScan}
              className="w-full py-5 rounded-3xl bg-indigo-500 text-white font-black text-sm uppercase tracking-widest shadow-xl hover:bg-indigo-400 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} />
              Simulate Scan
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in-110 duration-500">
          <div className="w-32 h-32 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.4)] mb-8">
            <CheckCircle size={64} className="text-white" />
          </div>
          <h3 className="text-3xl font-black text-white">Record Verified</h3>
          <p className="text-indigo-200 text-lg font-medium mt-2">Local link secured.</p>
        </div>
      )}
    </div>
  );
}