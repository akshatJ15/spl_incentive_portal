import React, { useState, useEffect } from 'react';
import AdminDashboard from './components/AdminDashboard';
import ClientClaim from './components/ClientClaim';
import AdminLogin from './components/AdminLogin';
import { Gift, ShieldCheck, Database, HelpCircle, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [route, setRoute] = useState('admin'); // 'admin' | 'claim'
  const [currentToken, setCurrentToken] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return sessionStorage.getItem('isAdminAuthenticated') === 'true';
  });

  const handleLoginSuccess = () => {
    sessionStorage.setItem('isAdminAuthenticated', 'true');
    setIsAdminAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('isAdminAuthenticated');
    setIsAdminAuthenticated(false);
  };

  // Handle simple routing based on URL search params and paths
  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const pathname = window.location.pathname;
      const token = params.get('token');

      if (token || pathname.includes('/claim')) {
        setRoute('claim');
        if (token) {
          setCurrentToken(token);
        }
      } else {
        setRoute('admin');
      }
    };

    // Run once on load and listen to history mutations
    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 flex flex-col antialiased font-sans transition-colors duration-200">
      
      {/* Header Bar - Invisible in print */}
      <header className="print:hidden w-full bg-white border-b border-gray-100 py-4 px-6 sticky top-0 z-50 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 text-white rounded-lg">
              <Gift className="w-5 h-5" />
            </div>
            <span className="font-semibold text-lg tracking-tight">QR Incentive Core</span>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium text-gray-500">
            {route === 'admin' && isAdminAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            )}
            <span className="flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-full border border-green-100 font-mono">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              LIVE DEV SERVER
            </span>
            <span className="flex items-center gap-1 text-gray-400">
              <Database className="w-3.5 h-3.5" />
              Hybrid Storage Active
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 md:py-12 flex flex-col items-center justify-center">
        
        <AnimatePresence mode="wait">
          {route === 'admin' ? (
            !isAdminAuthenticated ? (
              <motion.div
                key="admin-login"
                className="w-full"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <AdminLogin onLoginSuccess={handleLoginSuccess} />
              </motion.div>
            ) : (
              /* Admin Generator Dashboard View */
              <motion.div
                key="admin-view"
                className="print:p-0 print:border-none print:shadow-none w-full flex flex-col items-center"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <div className="print:hidden text-center max-w-lg mb-8">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50/70 text-blue-700 border border-blue-100 rounded-full text-xs font-semibold mb-3">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Step 1: Secure Token Provisioning
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                    Incentives Provisioning System
                  </h1>
                  <p className="mt-3 text-base text-gray-500 leading-relaxed">
                    Generate mathematically immutable claims tied to static or dynamic physical outputs. Scan to verify on the claiming node.
                  </p>
                </div>

                {/* Print Wrapper */}
                <div className="w-full print:p-0">
                  <AdminDashboard />
                </div>

                {/* Informative Footer Box */}
                <div className="print:hidden w-full max-w-lg mt-8 bg-blue-50/30 border border-blue-100/50 rounded-2xl p-4 flex gap-3 text-sm text-blue-800">
                  <HelpCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900">Step-by-Step Preview Guidance</h4>
                    <p className="mt-1 text-blue-700/90 leading-relaxed text-xs">
                      Input a point value above and click <strong>Generate Unique QR</strong>. A secure claim URL linked to the database token is formatted. You can trigger physical output simulation in a printing frame, or click the generated link below the QR code to simulate a user claiming the award!
                    </p>
                  </div>
                </div>
              </motion.div>
            )
          ) : (

            /* Target Claim Reward View using public API */
            <motion.div
              key="claim-view"
              className="w-full flex flex-col items-center"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <ClientClaim />
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Page Footer - Invisible in print */}
      <footer className="print:hidden w-full bg-white border-t border-gray-100 py-6 text-center text-xs text-gray-400 font-mono">
        <p>© 2026 QR Incentive Engine. Powered by Express + React + Mongoose.</p>
      </footer>
    </div>
  );
}
