// src/App.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { CheckCircle, QrCode, User, Leaf, Users, PieChart } from 'lucide-react';
import { initDB, addCollection, getAllCollections, estimateStorage } from './db';
import { startSyncProcess } from './sync';
import LoginForm from './components/Auth/LoginForm';
import SignupForm from './components/Auth/SignupForm';
import {
  fetchProfile,
  getToken,
  getStoredRole,
  getUserId,
  setStoredRole,
  setToken,
  setUserId,
  clearToken as clearStoredToken,
  clearStoredRole as clearStoredRoleKey,
  clearUserId as clearStoredUserId,
} from './auth';

// Component Imports
import CollectorHeader from './components/Collector/CollectorHeader';
import CollectorMain from './components/Collector/CollectorMain';
import CollectorNav from './components/Collector/CollectorNav';
import FarmerHeader from './components/Farmer/FarmerHeader';
import FarmerMain from './components/Farmer/FarmerMain';
import ScannerOverlay from './components/ScannerOverlay';
import type { Role, Collection, Farmer } from './types';

// ─────────────────────────────────────────────────────────────
// CONSTANTS & MOCKS
// ─────────────────────────────────────────────────────────────

const marketPrices = {
  Maize: { current: 0.45, color: 'bg-amber-500' },
  'Coffee Beans': { current: 3.20, color: 'bg-orange-900' },
  Cocoa: { current: 2.85, color: 'bg-yellow-800' },
  Wheat: { current: 0.38, color: 'bg-yellow-500' },
};

// ─────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────

export default function App() {
  // profile for the currently authenticated farmer (null if not loaded)
  const [myFarmerProfile, setMyFarmerProfile] = useState<Farmer | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activeTab, setActiveTab] = useState<string>('profile');
  
  // Scanner States
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const scannerRef = useRef<any>(null);

  // Business Logic States
  const [currentFarmer, setCurrentFarmer] = useState<Farmer | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<any>(null);
  const [handshakeStatus, setHandshakeStatus] = useState<'idle' | 'waiting' | 'verified'>('idle');
  
  const [collections, setCollections] = useState<Collection[]>([]);

  // Auth states
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState<{ open: boolean; role: 'farmer' | 'collector' }>({ open: false, role: 'farmer' });

  useEffect(() => {
    let stopSync: (() => void) | undefined;
    initDB().then(async () => {
      const allData = await getAllCollections();
      // Ensure types align: Collection.collectorId must be string
      setCollections(allData.map((c) => ({ ...c, collectorId: c.collectorId ?? '' })));
      stopSync = startSyncProcess();

      // low-storage estimate and warn (non-blocking)
      try {
        const est = await estimateStorage();
        if (est.quota && est.usage && est.quota - est.usage < 5 * 1024 * 1024) {
          console.warn('[storage] low available quota', est);
        }
      } catch {}
    });
    // restore stored role/token and fetch profile if we have a token
        const savedRole = getStoredRole() as Role;
        if (savedRole) {
          setRole(savedRole);
          setActiveTab(savedRole === 'farmer' ? 'profile' : 'terminal');
        }
    const token = getToken();
    if (token && savedRole) {
      // persist via auth helper so authHeader() sees the token consistently
      try {
        setToken(token);
      } catch {
        // ignore
      }
    }
    // if we have a token, fetch the current profile (best-effort)
    if (token) {
      fetchProfile()
        .then((p: any) => {
          if (p && p.id && getStoredRole() === 'farmer') setMyFarmerProfile(p as Farmer);
        })
        .catch(() => {});
    }

    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
      if (stopSync) stopSync();
    };
  }, []);

  const farmerHistory = useMemo(() => {
    if (!myFarmerProfile) return [];
    return collections.filter((c) => c.farmerId === myFarmerProfile.id);
  }, [collections, myFarmerProfile]);

  const farmerWallet = useMemo(() => {
    return farmerHistory.reduce(
      (acc: { paid: number; pending: number }, item: Collection) => {
        const total = item.weightKg * item.pricePerKg;
        // Assuming all pending until synced and paid out by a separate process
        if (item.status === 'synced') acc.paid += total;
        else acc.pending += total;
        return acc;
      },
      { paid: 0, pending: 0 }
    );
  }, [farmerHistory]);

  // ─────────────────────────────────────────────────────────────
  // SCANNER ENGINE (CRASH-PROOF)
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!showScanner) return;

    let cancelled = false;

    const ensureScript = async () => {
      if ((window as any).Html5Qrcode) return;

      await new Promise<void>((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>('script[data-agrisync-html5qrcode="1"]');
        if (existing) {
          existing.addEventListener('load', () => resolve(), { once: true });
          existing.addEventListener('error', () => reject(new Error('Failed to load scanner lib')), { once: true });
          return;
        }

        const script = document.createElement('script');
        script.dataset.agrisyncHtml5qrcode = '1';
        script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load scanner lib'));
        document.body.appendChild(script);
      });
    };

    const initScanner = async () => {
      try {
        setScannerError(null);

        // Debug: environment + security context
        console.debug('[scanner] init', {
          role,
          href: window.location.href,
          protocol: window.location.protocol,
          hostname: window.location.hostname,
          isSecureContext: window.isSecureContext,
        });

        // Give React a tick to mount the overlay + #reader
        await new Promise((r) => setTimeout(r, 50));
        if (cancelled) return;

        const readerEl = document.getElementById('reader');
        console.debug('[scanner] reader mounted', { exists: !!readerEl });
        if (!readerEl) {
          setScannerError('Scanner mount failed. Please retry.');
          return;
        }
        readerEl.innerHTML = '';

        await ensureScript();
        if (cancelled) return;

        const Html5Qrcode = (window as any).Html5Qrcode;
        console.debug('[scanner] lib', { loaded: !!Html5Qrcode });
        if (!Html5Qrcode) {
          setScannerError('Scanner library failed to load.');
          return;
        }

        // Tear down any previous instance
        if (scannerRef.current) {
          try {
            if (scannerRef.current.isScanning) await scannerRef.current.stop();
            if (typeof scannerRef.current.clear === 'function') await scannerRef.current.clear();
          } catch {
            // ignore
          }
          scannerRef.current = null;
        }

        const html5QrCode = new Html5Qrcode('reader');
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          { fps: 15, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            try {
              const data = JSON.parse(decodedText);
              if (role === 'collector' && data.type === 'agrisync-identity') {
                setCurrentFarmer(data);
                navigator.vibrate?.(200);
                stopScanner();
              } else if (role === 'farmer' && data.type === 'agrisync-tx-verify') {
                finalizeFarmerVerification(data);
                navigator.vibrate?.(200);
                stopScanner();
              }
            } catch {
              // ignore unrelated QRs
            }
          },
          () => {}
        );
      } catch (err: any) {
        console.error('[scanner] start failed', err);
        if (!cancelled) setScannerError(parseCameraError(err));
      }
    };

    initScanner();

    return () => {
      cancelled = true;
      stopScanner({ keepModal: true });
    };
  }, [showScanner, role]);

  const stopScanner = (opts?: { keepModal?: boolean }) => {
    const keepModal = opts?.keepModal ?? false;

    const finalize = () => {
      if (!keepModal) setShowScanner(false);
      setScannerError(null);
    };

    const instance = scannerRef.current;
    if (instance) {
      const stopPromise = instance.isScanning ? instance.stop() : Promise.resolve();
      stopPromise
        .catch(() => {})
        .finally(async () => {
          try {
            if (typeof instance.clear === 'function') await instance.clear();
          } catch {
            // ignore
          }
          if (scannerRef.current === instance) scannerRef.current = null;
          finalize();
        });
      return;
    }

    finalize();
  };

  const parseCameraError = (err: any) => {
    const name = err?.name;
    const message = err?.message;

    // Debug: surface real error details in dev console
    console.debug('[scanner] parse error', { name, message });

    if (name === 'NotAllowedError') return 'Camera access denied.';
    if (name === 'NotFoundError') return 'No camera device found.';
    if (name === 'NotReadableError') return 'Camera is busy (another app/tab may be using it).';
    if (name === 'OverconstrainedError') return 'Camera constraints not supported on this device.';

    // Browser security model: camera only on secure contexts (https or localhost)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      return 'HTTPS required for camera.';
    }

    return 'Camera error. Please refresh.';
  };

  // ─────────────────────────────────────────────────────────────
  // HANDSHAKE LOGIC
  // ─────────────────────────────────────────────────────────────

  const initiateCollection = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentFarmer) return;

    const collectorId = getUserId();
    if (!collectorId) {
      console.warn('[handshake] missing collector userId; aborting receipt generation');
      return;
    }

    const formData = new FormData(e.currentTarget);
    const cropType = formData.get('crop') as string;
    const weightKg = parseFloat(formData.get('weight') as string);
    const pricePerKg = marketPrices[cropType as keyof typeof marketPrices]?.current || 0;

    // Receipt payload that farmer scans
    const receipt = {
      type: 'agrisync-tx-verify' as const,
      id: uuidv4(),
      farmerId: currentFarmer.id,
      farmerName: currentFarmer.name,
      collectorId,
      cropType,
      weightKg,
      pricePerKg,
      createdAt: new Date().toISOString(),
      version: 1,
    };

    setPendingConfirmation(receipt);
    setHandshakeStatus('waiting');
  };

  const finalizeFarmerVerification = async (txData: any) => {
    // Map scanned receipt into a local Collection for farmer history
    if (txData?.type !== 'agrisync-tx-verify') return;
    const collection: Collection = {
      id: txData.id,
      farmerId: txData.farmerId,
      collectorId: txData.collectorId,
      cropType: txData.cropType,
      weightKg: Number(txData.weightKg) || 0,
      pricePerKg: Number(txData.pricePerKg) || 0,
      createdAt: txData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: Number(txData.version) || 1,
      status: 'pending',
    };
    await addCollection(collection);
    const allData = await getAllCollections();
    // Ensure types align: Collection.collectorId must be string
    setCollections(allData.map((c) => ({ ...c, collectorId: c.collectorId ?? '' })));
    setActiveTab('inventory');
  };

  const completeTransaction = () => {
    setHandshakeStatus('verified');
    setTimeout(async () => {
      if (pendingConfirmation) {
        const finalCollection: Collection = {
          ...pendingConfirmation,
          status: isOnline ? 'pending' : 'pending', // Always pending until synced
        };
        await addCollection(finalCollection);
        const allData = await getAllCollections();
        // Ensure types align: Collection.collectorId must be string
        setCollections(allData.map((c) => ({ ...c, collectorId: c.collectorId ?? '' })));
      }
      setPendingConfirmation(null);
      setCurrentFarmer(null);
      setHandshakeStatus('idle');
    }, 1500);
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER HELPERS
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    // restore token presence -> optional: could fetch profile
    const t = getToken();
    if (t) {
      // keep token; server-side role would be returned at login so not handled here
    }
  }, []);

  // Render when not authenticated/role chosen
  if (!role) {
    function onAuthSuccess(data: any): void {
      const token = data?.token ?? null;
      const newRole = data?.role as Role | null;

      // persist token/user id via auth helpers so authHeader() works
      if (token) {
        try {
          setToken(token);
        } catch {}
      }
      // persist user id if returned by login
      const userId = data?.userId ?? data?.user?.id;
      if (userId) {
        try { setUserId(userId); } catch {}
      }

      if (newRole) {
        try {
          setStoredRole(newRole);
        } catch {}
        setRole(newRole);
        setActiveTab(newRole === 'farmer' ? 'profile' : 'terminal');
      }

      // If login returned the full user object, use it immediately to populate UI
      if (newRole === 'farmer' && data?.user) {
        try {
          setMyFarmerProfile(data.user as Farmer);
        } catch {}
      }

      // close any auth modals
      setShowLogin(false);
      setShowSignup({ open: false, role: 'farmer' });

      // attempt to refresh authenticated profile if farmer signed in
      if (newRole === 'farmer') {
        fetchProfile()
          .then((p: any) => {
            if (p && p.id) {
              setMyFarmerProfile(p as Farmer);
            } else {
              console.warn('[auth] fetchProfile returned no profile; login response:', data);
            }
          })
          .catch((err) => {
            console.warn('[auth] fetchProfile failed', err);
          });
      }
    }
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-8">
          <Leaf className="w-16 h-16 text-emerald-400 mx-auto" />
          <h1 className="text-5xl font-black text-white">AgriSync</h1>

          <div className="flex gap-3 justify-center">
            <button onClick={() => setShowLogin(true)} className="bg-white px-4 py-2 rounded">Sign in</button>
            <button onClick={() => setShowSignup({ open: true, role: 'farmer' })} className="bg-white px-4 py-2 rounded">Sign up</button>
          </div>

          <div className="grid gap-4">
            <button onClick={() => { setRole('collector'); setActiveTab('terminal'); }} className="bg-white p-6 rounded-3xl text-left shadow-xl">
              <Users className="text-indigo-600 mb-2" />
              <div className="font-black text-2xl text-slate-900">Collector</div>
              <p className="text-slate-500 text-sm">Verify farmers and record yields.</p>
            </button>
            <button onClick={() => { setRole('farmer'); setActiveTab('profile'); }} className="bg-white p-6 rounded-3xl text-left shadow-xl">
              <User className="text-emerald-600 mb-2" />
              <div className="font-black text-2xl text-slate-900">Farmer</div>
              <p className="text-slate-500 text-sm">Show ID and track your payments.</p>
            </button>
          </div>
        </div>

        {showLogin && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-6">
            <LoginForm
              onSuccess={onAuthSuccess}
              onCancel={() => setShowLogin(false)}
            />
          </div>
        )}

        {showSignup.open && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-6">
            <SignupForm
              role={showSignup.role}
              onSuccess={onAuthSuccess}
              onCancel={() => setShowSignup({ open: false, role: 'farmer' })}
            />
          </div>
        )}
      </div>
    );
  }

  const handleSignOut = () => {
    try {
      clearStoredToken();
      clearStoredRoleKey();
      clearStoredUserId();
    } catch {
      // ignore storage errors
    }
    setRole(null);
  };
  // Role Views
  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen flex flex-col relative shadow-2xl border-x border-slate-200">
      {/* Network Status */}
      <div className={`px-4 py-1 text-[10px] font-bold text-white flex justify-between ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}>
        <span>{isOnline ? 'ONLINE' : 'OFFLINE MODE'}</span>
        <div>
          <button onClick={handleSignOut} className="underline opacity-70 mr-3">Sign out</button>
          <button onClick={() => setRole(null)} className="underline opacity-70">Switch Role</button>
        </div>
      </div>

      {/* Scanner Modal */}
      {showScanner && (
        <ScannerOverlay scannerError={scannerError} onClose={stopScanner} />
      )}

      {/* Role Views */}
      {role === 'collector' ? (
        <>
          <CollectorHeader isOnline={isOnline} onScan={() => setShowScanner(true)} />
          <CollectorMain
            activeTab={activeTab}
            collections={collections}
            currentFarmer={currentFarmer}
            marketPrices={marketPrices}
            initiateCollection={initiateCollection}
            setCurrentFarmer={setCurrentFarmer}
            onScan={() => setShowScanner(true)}
          />
          {pendingConfirmation && (
            <div className="absolute inset-0 z-50 bg-indigo-950 p-6 flex flex-col items-center justify-center text-white">
              {handshakeStatus === 'waiting' ? (
                <>
                  <h2 className="text-2xl font-black mb-6">Farmer confirmation</h2>
                  <div className="bg-white p-4 rounded-3xl mb-6">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(JSON.stringify(pendingConfirmation))}&size=200x200`} alt="receipt" />
                  </div>
                  <button onClick={completeTransaction} className="bg-indigo-500 px-8 py-4 rounded-full font-black">SIMULATE FARMER SCAN</button>
                </>
              ) : (
                <div className="text-center animate-bounce">
                  <CheckCircle size={80} className="text-emerald-400 mx-auto mb-4" />
                  <h2 className="text-3xl font-black">Success!</h2>
                </div>
              )}
            </div>
          )}
          <CollectorNav activeTab={activeTab} setActiveTab={setActiveTab} isOnline={isOnline} />
        </>
      ) : (
        <>
          <FarmerHeader profile={myFarmerProfile ?? { id: '', name: '', phone: '', createdAt: '', updatedAt: '', version: 1 }} onVerify={() => setShowScanner(true)} />
          <FarmerMain
            activeTab={activeTab}
            farmerHistory={farmerHistory}
            myFarmerProfile={myFarmerProfile ?? { id: '', name: '', phone: '', createdAt: '', updatedAt: '', version: 1 }}
            farmerWallet={farmerWallet}
            marketPrices={marketPrices}
          />
          {/* Farmer Nav */}
          <nav className="absolute bottom-6 left-6 right-6 bg-slate-900 rounded-[2.5rem] p-3 flex justify-around text-slate-500">
            <button onClick={() => setActiveTab('profile')} className={activeTab === 'profile' ? 'text-emerald-400' : ''}><QrCode /></button>
            <button onClick={() => setActiveTab('inventory')} className={activeTab === 'inventory' ? 'text-emerald-400' : ''}><CheckCircle /></button>
            <button onClick={() => setActiveTab('market')} className={activeTab === 'market' ? 'text-emerald-400' : ''}>
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zM13 21h8V11h-8v10zm0-18v6h8V3h-8z" fill="currentColor"/></svg>
            </button>
          </nav>
        </>
      )}

      <style>{`#reader video { object-fit: cover; }`}</style>
    </div>
  );
}