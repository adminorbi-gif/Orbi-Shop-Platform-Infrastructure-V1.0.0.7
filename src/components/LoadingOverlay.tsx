import React from "react";

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-md animate-fade-in">
      <div className="flex flex-col items-center gap-4">
        <img 
          src="https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png" 
          alt="Orbi Logo" 
          className="w-24 h-24 object-contain animate-pulse grayscale" 
          referrerPolicy="no-referrer"
        />
        {message && (
          <p className="text-sm uppercase tracking-widest font-medium text-slate-500">{message}</p>
        )}
      </div>
    </div>
  );
}

