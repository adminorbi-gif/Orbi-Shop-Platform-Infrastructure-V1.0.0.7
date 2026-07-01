import React from "react";

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <div className="relative flex items-center justify-center w-24 h-24">
          <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <img 
            src="https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png" 
            alt="Orbi Logo" 
            className="w-12 h-12 object-contain grayscale opacity-50" 
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm font-bold tracking-widest uppercase text-slate-800">
            {message || "Loading workspace"}
          </p>
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

