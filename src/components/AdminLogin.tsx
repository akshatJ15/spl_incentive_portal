import React, { useState } from 'react';
import { Lock, Smartphone, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [loginNo, setLoginNo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const formattedNo = loginNo.trim();
    const formattedPass = password.trim();

    if (!formattedNo || !formattedPass) {
      setError('Please fill in all security fields.');
      return;
    }

    if (formattedNo === '7217251263' && formattedPass === '1234') {
      setIsSuccess(true);
      window.setTimeout(() => {
        onLoginSuccess();
      }, 800);
    } else {
      setError('Invalid system credentials. Please check your login number and password.');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400" />

        <div className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
              <Lock className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">Admin Authentication</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Secure system access</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Enter authorized local system credentials to gain management portal entry.
              </p>
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {isSuccess && (
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Authentication approved! Redirecting...</span>
              </div>
            )}

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Login Number</span>
              <div className="relative">
                <Smartphone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  inputMode="numeric"
                  value={loginNo}
                  onChange={(e) => setLoginNo(e.target.value)}
                  disabled={isSuccess}
                  placeholder="Enter login number"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-mono text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-70"
                />
              </div>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSuccess}
                  placeholder="Enter password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-mono text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-70"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={isSuccess}
              className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-blue-600"
            >
              {isSuccess ? 'Authorizing Interface...' : 'Verify Identity'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}