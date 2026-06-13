import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import ClientLogin from './ClientLogin';
import { 
  Gift, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  LogIn, 
  ShieldCheck, 
  Clock, 
  Award,
  Smartphone,
  ChevronRight,
  User,
  LogOut,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ClientClaim() {
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Extract token from URL search query
  const tokenFromHook = searchParams.get('token');
  const tokenFromUrl = new URLSearchParams(window.location.search).get('token') || 
                       new URLSearchParams(location.search).get('token');
  const token = tokenFromHook || tokenFromUrl || '';

  // Required state variables
  const [step, setStep] = useState('verifying'); // 'verifying', 'ready', 'claiming', 'claimed', 'error'
  const [pointsAvailable, setPointsAvailable] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);

  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('clientToken'));
  const [userProfile, setUserProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('clientUser') || 'null');
    } catch {
      return null;
    }
  });

  // 1. Verify token validity on mounting
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setErrorMsg('No verification token provided. Please scan a valid QR code.');
        setStep('error');
        return;
      }

      setStep('verifying');
      setErrorMsg(null);

      try {
        const response = await fetch(`/api/public/check-token/${token}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to verify secure QR code.');
        }

        setPointsAvailable(data.points);
        setStep('ready');
      } catch (err) {
        console.error('Verify token failed:', err);
        setErrorMsg(err.message || 'An error occurred during verification.');
        setStep('error');
      }
    };

    verifyToken();
  }, [token]);

  // Sync profile points from active MongoDB database on mount/login state changes
  useEffect(() => {
    const fetchLatestProfile = async () => {
      const clientToken = localStorage.getItem('clientToken');
      if (!clientToken) return;

      try {
        const response = await fetch('/api/client/profile', {
          headers: {
            'Authorization': `Bearer ${clientToken}`
          }
        });
        const data = await response.json();
        if (response.ok && data.success && data.user) {
          localStorage.setItem('clientUser', JSON.stringify(data.user));
          setUserProfile(data.user);
        } else if (response.status === 401) {
          // Clean invalid credentials session
          handleLogout();
        }
      } catch (err) {
        console.error('Failed to sync profile with database:', err);
      }
    };

    if (isLoggedIn) {
      fetchLatestProfile();
    }
  }, [isLoggedIn]);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    try {
      setUserProfile(JSON.parse(localStorage.getItem('clientUser') || 'null'));
    } catch {
      setUserProfile(null);
    }
    // Retain step as ready since login complete
    setStep('ready');
  };

  const handleLogout = () => {
    localStorage.removeItem('clientToken');
    localStorage.removeItem('clientUser');
    setIsLoggedIn(false);
    setUserProfile(null);
    setStep('ready');
  };

  // 2. Perform the atomic points claiming POST process
  const handleClaimPoints = async () => {
    if (step === 'claiming') return;
    setStep('claiming');
    setErrorMsg(null);

    const clientToken = localStorage.getItem('clientToken');
    if (!clientToken) {
      setErrorMsg('User authentication is missing. Please log in before claiming.');
      setStep('error');
      return;
    }

    try {
      const response = await fetch('/api/client/claim-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${clientToken}`
        },
        body: JSON.stringify({ uid: token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to claim token points.');
      }

      // Transition to CLAIMED completely
      setStep('claimed');

      // Update the client local state profile points
      const currentProfile = { ...userProfile };
      if (currentProfile) {
        currentProfile.points = data.newTotal !== undefined ? Number(data.newTotal) : (currentProfile.points || 0) + Number(pointsAvailable);
        localStorage.setItem('clientUser', JSON.stringify(currentProfile));
        setUserProfile(currentProfile);
      }
    } catch (err) {
      console.error('Points Claiming Failure:', err);
      setErrorMsg(err.message || 'Database capture failed during claim pipeline.');
      setStep('error');
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden p-6 md:p-8 flex flex-col justify-between min-h-[460px] relative">
      
      {/* Decorative Mobile Header Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-4 bg-gray-50 border-b border-gray-100 rounded-b-xl flex items-center justify-center">
        <div className="w-12 h-1 bg-gray-200 rounded-full"></div>
      </div>

      {/* Internal Content Wrapper */}
      <div className="pt-4 flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          
          {/* VERIFYING STATE */}
          {step === 'verifying' && (
            <motion.div
              key="verifying"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center text-center space-y-5 py-8"
            >
              <div className="relative flex items-center justify-center">
                <div className="absolute w-16 h-16 bg-blue-50 rounded-full animate-ping opacity-75"></div>
                <div className="relative w-16 h-16 bg-blue-100/65 text-blue-600 rounded-2xl flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              </div>
              <div>
                <span className="text-xs uppercase tracking-widest text-blue-500 font-bold font-mono">Securing Connection</span>
                <h3 className="text-lg font-bold text-gray-900 mt-1">Verifying secure token...</h3>
                <p className="text-xs text-gray-400 mt-2 max-w-[240px] leading-relaxed mx-auto">
                  Validating cryptographic identifier with QR Incentive Core Engine.
                </p>
              </div>
            </motion.div>
          )}

          {/* ERROR STATE */}
          {step === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center text-center py-6"
            >
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center border border-red-100/60 shadow-xs mb-5">
                <XCircle className="w-10 h-10" />
              </div>
              
              <div className="bg-red-50/50 border border-red-100/60 rounded-2xl p-5 w-full">
                <span className="inline-block px-2.5 py-0.5 bg-red-100 text-red-800 rounded-full text-[10px] font-extrabold uppercase font-mono tracking-wider">
                  Operation Restrained
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-3">Claim Failed</h3>
                <p className="text-xs text-red-600 mt-2 font-medium leading-relaxed">
                  {errorMsg || 'Token verification failed.'}
                </p>
              </div>

              <button
                onClick={() => window.location.reload()}
                className="mt-6 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Try Again
              </button>
            </motion.div>
          )}

          {/* READY / CLAIMING STATE (PENDING LOGIN) */}
          {(step === 'ready' || step === 'claiming') && !isLoggedIn && (
            <motion.div
              key="auth-pending"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="py-2"
            >
              <div className="text-center mb-4">
                <span className="inline-block px-3 py-0.5 bg-yellow-50 text-yellow-800 border border-yellow-100 rounded-full text-[10px] font-extrabold uppercase tracking-wider font-mono">
                  Authentication Required
                </span>
                <p className="text-sm font-semibold text-gray-800 mt-2">
                  We verified <span className="text-base font-bold text-blue-600">{pointsAvailable} points</span> waiting!
                </p>
              </div>
              <ClientLogin onLoginSuccess={handleLoginSuccess} />
            </motion.div>
          )}

          {/* READY / CLAIMING STATE (LOGGED IN & READY) */}
          {(step === 'ready' || step === 'claiming') && isLoggedIn && (
            <motion.div
              key="claim-ready"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center text-center py-4"
            >
              <div className="relative mb-5">
                <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-40 scale-125 select-none pointer-events-none"></div>
                <div className="relative w-16 h-16 bg-gradient-to-tr from-blue-50 to-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-xs border border-blue-200">
                  <Award className="w-9 h-9" />
                </div>
              </div>

              <div className="bg-gradient-to-b from-blue-50/70 to-blue-50/10 border border-blue-100 rounded-2xl p-5 w-full shadow-xs">
                <span className="inline-block px-3 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[10px] font-extrabold uppercase tracking-wider font-mono">
                  Points Verified
                </span>
                
                <h3 className="text-xs font-semibold text-gray-500 mt-4">Security Validation Passed</h3>
                
                <div className="mt-2 flex flex-col items-center">
                  <span className="text-5xl font-black text-blue-900 tracking-tight font-mono">
                    {pointsAvailable}
                  </span>
                  <span className="text-xs font-semibold text-blue-700/80 uppercase tracking-wider mt-1">
                    Reward points available
                  </span>
                </div>
              </div>

              {userProfile && (
                <div className="mt-4 flex items-center justify-between w-full bg-slate-50 border border-gray-100 rounded-xl px-3.5 py-2.5">
                  <div className="flex items-center gap-2 text-left">
                    <div className="p-1 px-1.5 bg-slate-200 text-slate-700 rounded-lg font-mono font-bold text-xs">
                      {userProfile.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-gray-400 block font-mono">Claimant</span>
                      <span className="text-xs font-bold text-gray-800 font-sans block">{userProfile.name}</span>
                    </div>
                  </div>
                  <button 
                    onClick={handleLogout}
                    title="Logout"
                    className="p-1 px-2 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg text-[10px] font-bold border border-transparent hover:border-red-100 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                  </button>
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 bg-slate-50 border border-gray-100 px-3.5 py-1.5 rounded-xl text-[10px] text-gray-400 font-mono">
                <Clock className="w-3 h-3 text-gray-400/80" />
                <span>Single-use unique signature token</span>
              </div>
            </motion.div>
          )}

          {/* CLAIMED STATE SUCCESS CARD */}
          {step === 'claimed' && (
            <motion.div
              key="claimed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center text-center py-6"
            >
              <div className="relative mb-5">
                <div className="absolute inset-0 bg-green-100 rounded-full blur-xl opacity-60 scale-125 select-none pointer-events-none"></div>
                <div className="relative w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shadow-md border-4 border-white">
                  <CheckCircle className="w-12 h-12" />
                </div>
              </div>

              {/* Explicit Green Success Card */}
              <div className="bg-gradient-to-b from-green-50 to-emerald-50/45 border border-green-100 rounded-2xl p-6 w-full shadow-xs">
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-black uppercase tracking-widest font-mono">
                  Claimed!
                </span>
                <p className="text-sm font-bold text-gray-800 mt-4 leading-relaxed">
                  <strong>{pointsAvailable}</strong> points have been added to your account.
                </p>
                <div className="mt-3.5 border-t border-green-100/60 pt-3 flex justify-between items-center text-xs font-mono text-gray-400">
                  <span>New Balance:</span>
                  <span className="font-bold text-green-700">{userProfile?.points ?? pointsAvailable} pts</span>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-1 text-xs text-gray-400 font-bold font-mono">
                <Sparkles className="w-3.5 h-3.5 text-yellow-500 animate-spin-slow" />
                <span>Ledger transaction logged</span>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Action Footer Button Group */}
      <div className="mt-6 pt-4 border-t border-gray-50">
        {(step === 'ready' || step === 'claiming') && isLoggedIn ? (
          <button
            onClick={handleClaimPoints}
            disabled={step === 'claiming'}
            id="auth-claim-btn"
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300 text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            {step === 'claiming' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Claiming...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Claim Token
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
            <span>Cryptographic End-to-End Verification</span>
          </div>
        )}
      </div>

    </div>
  );
}
