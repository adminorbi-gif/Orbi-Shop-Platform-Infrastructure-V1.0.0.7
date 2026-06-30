import React from 'react';
import { Check } from 'lucide-react';

interface OrderProgressProps {
  status: string;
}

export const OrderProgressIndicator: React.FC<OrderProgressProps> = ({ status }) => {
  const steps = ['confirmed', 'shipped', 'delivered'];
  const currentIndex = steps.indexOf(status as any);

  // If status is not in the journey, don't show the journey
  if (currentIndex === -1) return null;

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, index) => (
        <React.Fragment key={step}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${index <= currentIndex ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
            {index < currentIndex ? <Check size={12} /> : index + 1}
          </div>
          {index < steps.length - 1 && (
            <div className={`h-0.5 w-6 ${index < currentIndex ? 'bg-emerald-600' : 'bg-slate-200'}`}></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
