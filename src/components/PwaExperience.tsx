import React, { useEffect, useMemo, useState } from "react";
import { Download, Smartphone, X } from "lucide-react";

const ORBI_SHOP_LOGO = "https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png";
const PWA_PROMPT_VERSION = "2026-07-03-open-install-v2";

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

function isMobileBrowser() {
  return /android|iphone|ipad|ipod|mobile/i.test(window.navigator.userAgent) || window.innerWidth <= 820;
}

export function OrbiBootSplash() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#f8fafc] text-slate-950">
      <div className="relative flex flex-col items-center px-6 text-center">
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
      </div>
    </div>
  );
}

export function PwaExperience() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showBoot, setShowBoot] = useState(false);
  const [installedHint, setInstalledHint] = useState(false);
  const [lang, setLang] = useState<"sw" | "en">(() => {
    if (typeof window === "undefined") return "sw";
    return localStorage.getItem("orbishop_lang") === "en" ? "en" : "sw";
  });
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
    const dismissedVersion = localStorage.getItem("orbi_shop_pwa_prompt_version") || "";
    const dismissedRecently =
      dismissedVersion === PWA_PROMPT_VERSION &&
      dismissedAt > 0 &&
      Date.now() - dismissedAt < 1000 * 60 * 60 * 24;
    const installedAt = Number(localStorage.getItem("orbi_shop_pwa_installed_at") || "0");
    const hasInstalledHint = installedAt > 0;
    const mobileBrowser = isMobileBrowser();

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      if (!dismissedRecently) {
        window.setTimeout(() => setShowPrompt(true), 3600);
      }
    };

    const handleAppInstalled = () => {
      localStorage.setItem("orbi_shop_pwa_installed_at", String(Date.now()));
      setInstalledHint(true);
      setShowPrompt(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    if (hasInstalledHint && !dismissedRecently) {
      setInstalledHint(true);
      window.setTimeout(() => setShowPrompt(true), 3000);
    }

    if ((isIos || mobileBrowser) && !dismissedRecently) {
      window.setTimeout(() => setShowPrompt(true), isIos ? 5200 : 6200);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [isIos]);

  useEffect(() => {
    const syncLanguage = () => setLang(localStorage.getItem("orbishop_lang") === "en" ? "en" : "sw");
    window.addEventListener("storage", syncLanguage);
    window.addEventListener("orbishop-language-change", syncLanguage);
    return () => {
      window.removeEventListener("storage", syncLanguage);
      window.removeEventListener("orbishop-language-change", syncLanguage);
    };
  }, []);

  const dismissPrompt = () => {
    localStorage.setItem("orbi_shop_pwa_install_dismissed_at", String(Date.now()));
    localStorage.setItem("orbi_shop_pwa_prompt_version", PWA_PROMPT_VERSION);
    setShowPrompt(false);
  };

  const installApp = async () => {
    if (!installEvent) {
      if (!installedHint) {
        localStorage.setItem("orbi_shop_pwa_install_dismissed_at", String(Date.now() - 1000 * 60 * 60 * 23));
      }
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

  const isSw = lang === "sw";
  const promptTitle =
    installedHint && !installEvent
      ? isSw
        ? "Fungua kwenye App ya Orbi Shop"
        : "Open in Orbi Shop App"
      : isSw
        ? "Open in App / Install Orbi Shop"
        : "Open in App / Install Orbi Shop";
  const promptBody =
    installedHint && !installEvent
      ? isSw
        ? "Kama tayari umeinstall, fungua Orbi Shop kupitia icon ya app kwenye Home Screen au App Drawer. Browser hairuhusu kufungua PWA moja kwa moja."
        : "If already installed, open Orbi Shop from the app icon on your Home Screen or App Drawer. Browsers do not allow websites to directly launch an installed PWA."
      : isIos && !installEvent
        ? isSw
          ? "Kwa muonekano wa app, bonyeza Share kisha chagua Add to Home Screen."
          : "For a cleaner app experience, tap Share then Add to Home Screen."
        : isSw
          ? "Pata matumizi ya haraka na full-screen. Kama install button haijatokea, tumia menyu ya browser kisha chagua Install app au Add to Home Screen."
          : "Get a faster full-screen experience. If the install button is unavailable, use the browser menu and choose Install app or Add to Home Screen.";

  return (
    <>
      {showBoot && <OrbiBootSplash />}
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
                      onClick={dismissPrompt}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-wide text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800 active:scale-[0.98]"
                    >
                      <Smartphone size={15} />
                      {isSw ? "Fungua App" : "Open in App"}
                    </button>
                  ) : installEvent ? (
                    <button
                      type="button"
                      onClick={installApp}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-wide text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800 active:scale-[0.98]"
                    >
                      <Download size={15} />
                      {isSw ? "Open / Install" : "Open / Install"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={dismissPrompt}
                      className="inline-flex flex-1 items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-wide text-white shadow-lg shadow-slate-900/15 transition active:scale-[0.98]"
                    >
                      {isSw ? "Nimeelewa" : "I understand"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={dismissPrompt}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-xs font-black text-slate-600 transition hover:bg-slate-50"
                  >
                    {isSw ? "Baadaye" : "Later"}
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
