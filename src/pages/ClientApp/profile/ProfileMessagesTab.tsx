import React from "react";

export function ProfileMessagesTab({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-[calc(100dvh-11rem)] min-h-[520px] sm:min-h-[620px] bg-slate-50 rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {children}
    </div>
  );
}
