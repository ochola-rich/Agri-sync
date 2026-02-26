import React, { useState } from 'react';
import { login } from '../../auth';

interface Props { onSuccess: (data: any) => void; onCancel: () => void; }

export default function LoginForm({ onSuccess, onCancel }: Props) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'farmer' | 'collector' | 'admin'>('farmer');
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      const data = await login(phone, password, role);
      onSuccess(data);
    } catch (err: any) {
      setErr(err.message || 'Login failed');
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl max-w-sm mx-auto">
      <h3 className="font-black text-lg mb-4">Sign in</h3>
      <form onSubmit={submit} className="space-y-3">
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" className="w-full p-3 border rounded" />
        <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" className="w-full p-3 border rounded" />
        <div className="flex gap-2">
          <label className="text-sm"><input type="radio" checked={role==='farmer'} onChange={() => setRole('farmer')} /> Farmer</label>
          <label className="text-sm"><input type="radio" checked={role==='collector'} onChange={() => setRole('collector')} /> Collector</label>
        </div>
        {err && <div className="text-rose-500 text-sm">{err}</div>}
        <div className="flex gap-2">
          <button type="submit" className="flex-1 bg-slate-900 text-white p-3 rounded">Sign in</button>
          <button type="button" onClick={onCancel} className="flex-1 border p-3 rounded">Cancel</button>
        </div>
      </form>
    </div>
  );
}