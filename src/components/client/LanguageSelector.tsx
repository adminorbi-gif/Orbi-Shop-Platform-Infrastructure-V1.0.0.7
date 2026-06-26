import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, CheckCircle2 } from "lucide-react";

export const TanzaniaFlag = () => (
  <svg
    viewBox="0 0 300 200"
    className="w-5 h-3.5 inline-block shrink-0 shadow-xs rounded-xs border border-white/20"
    fill="none"
  >
    <polygon points="0,0 300,0 0,200" fill="#1eb53a" />
    <polygon points="0,200 300,200 300,0" fill="#00a3dd" />
    <line
      x1="-20"
      y1="220"
      x2="320"
      y2="-20"
      stroke="#fcd116"
      strokeWidth="54"
    />
    <line
      x1="-20"
      y1="220"
      x2="320"
      y2="-20"
      stroke="#000000"
      strokeWidth="34"
    />
  </svg>
);

export const UKFlag = () => (
  <svg
    viewBox="0 0 60 30"
    className="w-5 h-3.5 inline-block shrink-0 shadow-xs rounded-xs border border-white/20"
    fill="none"
  >
    <clipPath id="uk-flag-clip-client">
      <path d="M0,0 L30,15 L0,15 z M0,30 L30,15 L30,30 z M60,30 L30,15 L60,15 z M60,0 L30,15 L30,0 z" />
    </clipPath>
    <rect width="60" height="30" fill="#012169" />
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
    <path
      d="M0,0 L60,30 M60,0 L0,30"
      stroke="#C8102E"
      strokeWidth="4"
      clipPath="url(#uk-flag-clip-client)"
    />
    <path d="M30,0 V30 M0,15 H60" stroke="#fff" strokeWidth="10" />
    <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6" />
  </svg>
);

export function CustomSelect({
  value,
  onChange,
  options,
  iconLabel,
  label,
  align = "left",
}: {
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string; subtitle?: string }[];
  iconLabel: React.ReactNode;
  label: string;
  align?: "left" | "right" | "center";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.id === value) || options[0];

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-50 hover:bg-slate-100/80 border-none text-slate-700 text-[11px] font-medium rounded-md px-2 py-1 outline-none transition-all flex items-center justify-between text-left h-7"
        title={label}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[12px] shrink-0">{iconLabel}</span>
          <span className="truncate text-[10px] leading-tight mt-0.5">
            {selectedOption.label}
          </span>
        </div>
        <ChevronDown
          size={10}
          className={`text-slate-400 shrink-0 ml-1 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 top-[calc(100%+4px)] ${align === "right" ? "right-0" : align === "center" ? "left-1/2 -translate-x-1/2" : "left-0"} w-max max-w-[95vw] min-w-[150px] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1`}
        >
          <div className="px-3 py-1.5 text-[9px] font-black uppercase text-slate-400 tracking-widest bg-slate-50/50 border-b border-slate-100 flex items-center gap-1">
            {label}
          </div>
          <div className="p-1.5 space-y-1">
            {options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  onChange(opt.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors text-left ${value === opt.id ? "bg-[#ff4c00]/5" : "bg-transparent hover:bg-slate-50 text-slate-700"}`}
              >
                <div>
                  <div
                    className={`text-[12px] font-bold ${value === opt.id ? "text-[#ff4c00]" : "text-slate-800"}`}
                  >
                    {opt.label}
                  </div>
                  {opt.subtitle && (
                    <div
                      className={`text-[10px] mt-0.5 ${value === opt.id ? "text-[#ff4c00]/70 font-medium" : "text-slate-500"}`}
                    >
                      {opt.subtitle}
                    </div>
                  )}
                </div>
                {value === opt.id && (
                  <CheckCircle2
                    size={14}
                    className="text-[#ff4c00] shrink-0 ml-2"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function LanguageSelector({ lang, setLang, t }: { lang: "sw" | "en"; setLang: (l: "sw" | "en") => void; t: (k: string) => string }) {
  return (
    <CustomSelect
      value={lang}
      onChange={(v) => setLang(v as "sw" | "en")}
      iconLabel={lang === "sw" ? <TanzaniaFlag /> : <UKFlag />}
      label={lang === "sw" ? "Badili Lugha" : "Change Language"}
      options={[
        { id: "sw", label: "Kiswahili", subtitle: "Tanzania" },
        { id: "en", label: "English", subtitle: "International" },
      ]}
    />
  );
}
