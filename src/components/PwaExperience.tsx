import React, { useEffect, useMemo, useState } from "react";
import { Download, ExternalLink, Smartphone, X } from "lucide-react";

const ORBI_SHOP_LOGO = "https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandaloneDisplay() {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

export function OrbiBootSplash({ message = "Opening Orbi Shop" }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#f8fafc] text-slate-950">
      <div className="relative flex flex-col items-center gap-5 px-6 text-center">
        <div className="absolute -inset-20 rounded-full bg-[radial-gradient(circle,rgba(30,41,59,0.10),transparent_62%)] animate-pulse" />
        <div className="relative flex h-32 w-32 items-center justify-center">
          <span className="absolute inset-2 rounded-full border border-slate-200/70 animate-[orbi-boot-ring_1.8s_ease-in-out_infinite]" />
          <span className="absolute inset-7 rounded-full bg-white/80 blur-xl" />
          <img
            src={ORBI_SHOP_LOGO}
            alt="Orbi Shop"
            className="relative h-24 w-24 object-contain drop-shadow-sm animate-[orbi-boot-logo_1.4s_ease-in-out_infinite]"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="relative space-y-1">
          <p className="font-display text-base font-black tracking-tight text-slate-950">Orbi Shop</p>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">{message}</p>
        </div>
      </div>
    </div>
  );
}

export function PwaExperience() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showBoot, setShowBoot] = useState(false);
  const [installedHint, setInstalledHint] = useState(false);
  const isIos = useMemo(() => /iphone|ipad|ipod/i.test(window.navigator.userAgent), []);

  useEffect(() => {
    const standalone = isStandaloneDisplay();
    if (standalone) {
      setShowBoot(true);
      const timeout = window.setTimeout(() => setShowBoot(false), 1500);
      return () => window.clearTimeout(timeout);
    }
  }, []);

  useEffect(() => {
    if (isStandaloneDisplay()) return;

    const dismissedAt = Number(localStorage.getItem("orbi_shop_pwa_install_dismissed_at") || "0");
    const dismissedRecently = dismissedAt > 0 && Date.now() - dismissedAt < 1000 * 60 * 60 * 24 * 7;
    const installedAt = Number(localStorage.getItem("orbi_shop_pwa_installed_at") || "0");
    const hasInstalledHint = installedAt > 0;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      if (!dismissedRecently) {
        window.setTimeout(() => setShowPrompt(true), 6500);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", () => {
      localStorage.setItem("orbi_shop_pwa_installed_at", String(Date.now()));
      setInstalledHint(true);
      setShowPrompt(false);
    });

    if (hasInstalledHint && !dismissedRecently) {
      setInstalledHint(true);
      window.setTimeout(() => setShowPrompt(true), 4500);
    }

    if (isIos && !dismissedRecently) {
      window.setTimeout(() => setShowPrompt(true), 8500);
    }

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, [isIos]);

  const dismissPrompt = () => {
    localStorage.setItem("orbi_shop_pwa_install_dismissed_at", String(Date.now()));
    setShowPrompt(false);
  };

  const installApp = async () => {
    if (!installEvent) {
      setShowPrompt(false);
      return;
    }

    await installEvent.prompt();
    const choice = await installEvent.userChoice.catch(() => null);
    if (choice?.outcome === "accepted") {
      localStorage.setItem("orbi_shop_pwa_installed_at", String(Date.now()));
    }
    setInstallEvent(null);
    setShowPrompt(false);
  };

  const openInstalledApp = () => {
    localStorage.setItem("orbi_shop_pwa_open_app_clicked_at", String(Date.now()));
    window.location.href = `${window.location.origin}${window.location.pathname}${window.location.search}`;
  };

  const promptTitle = installedHint && !installEvent ? "Open in Orbi Shop App" : "Install Orbi Shop App";
  const promptBody =
    installedHint && !installEvent
      ? "For a cleaner full-screen experience, open Orbi Shop from your home screen app icon."
      : isIos && !installEvent
        ? "For a cleaner app experience, tap Share then Add to Home Screen."
        : "Get a faster full-screen shopping experience outside the browser.";

  return (
    <>
      {showBoot && <OrbiBootSplash message="Preparing your marketplace" />}
      {showPrompt && (
        <div className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-[9000] mx-auto max-w-md animate-[orbi-install-rise_0.42s_ease-out]">
          <div className="overflow-hidden rounded-[1.55rem] border border-slate-200/80 bg-white/95 shadow-2xl shadow-slate-950/18 backdrop-blur-xl">
            <div className="flex items-start gap-3 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-900/20">
                <Smartphone size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-sm font-black text-slate-950">{promptTitle}</p>
                    <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">
                      {promptBody}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={dismissPrompt}
                    className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Dismiss install suggestion"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="mt-3 flex gap-2">
                  {installedHint && !installEvent ? (
                    <button
                      type="button"
                      onClick={openInstalledApp}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-wide text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800 active:scale-[0.98]"
                    >
                      <ExternalLink size={15} />
                      Open in App
                    </button>
                  ) : installEvent ? (
                    <button
                      type="button"
                      onClick={installApp}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-wide text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800 active:scale-[0.98]"
                    >
                      <Download size={15} />
                      Install App
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={dismissPrompt}
                      className="inline-flex flex-1 items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-wide text-white shadow-lg shadow-slate-900/15 transition active:scale-[0.98]"
                    >
                      I understand
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={dismissPrompt}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-xs font-black text-slate-600 transition hover:bg-slate-50"
                  >
                    Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
