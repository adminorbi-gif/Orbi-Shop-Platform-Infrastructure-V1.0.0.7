import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Cookie, X, CheckCircle2 } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'orbishop_cookie_consent_accepted';

// A simple language type specific to this component just in case
type Lang = "sw" | "en";

export default function CookieConsent({ lang }: { lang: Lang }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const hasConsented = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!hasConsented) {
        // Small delay for a more natural entry
        const timer = setTimeout(() => {
          setShow(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    } catch(e) {
      // Ignore localStorage errors (e.g., incognito mode)
    }
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    } catch(e) {}
    setShow(false);
  };

  const handleEssentialOnly = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'essential_only');
    } catch(e) {}
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          initial={{ y: 20, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6 lg:p-8 pointer-events-none flex justify-center"
        >
          <div className="max-w-4xl w-full bg-slate-900 border border-slate-700/60 rounded-[24px] shadow-2xl shadow-slate-900/40 overflow-hidden pointer-events-auto flex flex-col md:flex-row relative backdrop-blur-md">
            
            {/* Left side brand area */}
            <div className="md:w-[35%] bg-slate-800/80 p-6 flex flex-col items-center justify-center relative overflow-hidden border-b md:border-b-0 md:border-r border-slate-700/50">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -ml-10 -mb-10"></div>
              
              <div className="relative z-10 flex flex-col items-center">
                 <img
                  src="https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png"
                  alt="OrbiShop"
                  className="h-10 md:h-14 object-contain brightness-0 invert drop-shadow-md mb-6"
                />
                <div className="w-16 h-16 bg-slate-700/40 rounded-full flex items-center justify-center border border-slate-600/30 backdrop-blur-sm relative group cursor-pointer hover:bg-slate-700/60 transition-colors">
                  <Cookie size={32} className="text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] group-hover:rotate-12 transition-transform duration-300" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full animate-ping opacity-75"></div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-400 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Right side content */}
            <div className="md:w-[65%] p-6 md:p-8 flex flex-col justify-center bg-slate-900/90">
              <div className="mb-6">
                <h2 className="text-xl md:text-2xl font-black text-white tracking-tight mb-3 flex items-center gap-2">
                   {lang === 'sw' ? "Tunajali Faragha Yako" : "We Respect Your Privacy"}
                </h2>
                <div className="text-[13px] md:text-sm text-slate-300 font-medium leading-relaxed">
                  <p>
                    {lang === 'sw' 
                      ? "OrbiShop hutumia vidakuzi (cookies) muhimu ili kuhakikisha mfumo unafanya kazi vizuri na kwa usalama. Ili ufurahie huduma zetu zaidi, tunatumia vidakuzi maalum kuboresha matumizi yako na kutunza mapendeleo yako. Taarifa zako zipo salama wakati wote." 
                      : "OrbiShop uses essential cookies to ensure robust platform stability and security. To deliver an elevated, premium experience, we use functional cookies to optimize your navigation and remember your preferences. Your data remains strictly safeguarded."}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button 
                  onClick={handleAcceptAll}
                  className="w-full sm:w-auto flex-1 bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold py-3 px-6 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(245,158,11,0.25)]"
                >
                  <CheckCircle2 size={18} strokeWidth={2.5} />
                  {lang === 'sw' ? "Kubali & Endelea" : "Accept & Continue"}
                </button>
                <button 
                  onClick={handleEssentialOnly}
                  className="w-full sm:w-auto flex-1 bg-slate-800/80 border border-slate-600/50 hover:bg-slate-700 hover:border-slate-500 text-slate-200 text-sm font-bold py-3 px-6 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={18} strokeWidth={2.5} />
                  {lang === 'sw' ? "Muhimu Tu" : "Essential Only"}
                </button>
              </div>

              <div className="mt-5 text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5 opacity-80">
                 <ShieldCheck size={12} className="text-indigo-400" /> {lang === 'sw' ? "Ulinzi na Usimbaji Imara" : "Secured & Encrypted Transport"}
              </div>
            </div>
            
            <button 
              onClick={handleEssentialOnly}
              className="absolute top-4 right-4 text-slate-500 hover:text-white bg-slate-800/50 hover:bg-slate-700 rounded-full p-1.5 transition-colors"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
