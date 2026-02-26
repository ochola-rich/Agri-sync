import React, { useState } from 'react';
import { signupFarmer, signupCollector, login } from '../../auth';

interface Props { role: 'farmer'|'collector'; onSuccess: (data:any)=>void; onCancel: ()=>void; }

export default function SignupForm({ role, onSuccess, onCancel }: Props) {
  const [name,setName] = useState('');
  const [phone,setPhone] = useState('');
  const [password,setPassword] = useState('');
  const [err,setErr] = useState<string|null>(null);
  const [loading,setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const payload = { name, phone, password };
      await (role === 'farmer' ? signupFarmer(payload) : signupCollector(payload));
      const loginData = await login(phone, password, role === 'collector' ? 'collector' : 'farmer');
      onSuccess(loginData);
      // do not reload; App will fetch profile on onSuccess
    } catch (err: any) {
      setErr(err.message || 'Sign up failed');
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl max-w-sm mx-auto">
      <h3 className="font-black text-lg mb-4">Sign up ({role})</h3>
      <form onSubmit={submit} className="space-y-3">
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name" className="w-full p-3 border rounded" />
        <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone" className="w-full p-3 border rounded" />
        <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" className="w-full p-3 border rounded" />
        {err && <div className="text-rose-500 text-sm">{err}</div>}
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="flex-1 bg-slate-900 text-white p-3 rounded">{loading ? 'Creating...' : 'Create'}</button>
          <button type="button" onClick={onCancel} className="flex-1 border p-3 rounded">Cancel</button>
        </div>
      </form>
    </div>
  );
}