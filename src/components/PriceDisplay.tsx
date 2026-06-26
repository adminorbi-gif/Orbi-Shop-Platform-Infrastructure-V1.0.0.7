import React from "react";

interface PriceDisplayProps {
  amount: number;
  className?: string;
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  colorClass?: string;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  amount,
  className = "",
  size,
  colorClass = "text-slate-900",
}) => {
  const val = typeof amount === "number" ? amount : Number(amount) || 0;

  // Format with exactly 2 decimal places: e.g. "120,500.00"
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);

  const parts = formatted.split(".");
  const integerPart = parts[0];
  const decimalPart = parts[1] || "00";

  // Dynamic font sizing override based on character length of integerPart (e.g. "1,200,000" is length 9)
  // We use "em" unit scaling so it is naturally responsive relative to any parent/base text classes
  const length = integerPart.length;
  let fontScaleStyle: React.CSSProperties = {};
  if (length > 6) {
    // 6 characters or fewer (e.g. "90,000") is normal size.
    // Above 6, decrease font size progressively by 3.5% per additional character
    // Cap minimum sizing scale to 0.72em to preserve absolute readability
    const scale = Math.max(0.72, 1 - 0.035 * (length - 6));
    fontScaleStyle = { fontSize: `${scale}em` };
  }

  // Tailwind size configurations
  const sizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
    "3xl": "text-3xl",
    "4xl": "text-4xl",
  };

  const selectedSizeClass = size ? sizeClasses[size] : "";

  return (
    <span
      className={`font-money font-[800] tabular-nums tracking-tight inline-flex items-baseline ${colorClass} ${selectedSizeClass} ${className} transition-all`}
      style={{ 
        fontVariantNumeric: "tabular-nums",
        ...fontScaleStyle
      }}
    >
      <span className="text-[0.75em] font-black mr-0.5 opacity-70 select-none">TSh</span>
      <span>{integerPart}</span>
      <span className="text-[0.65em] font-extrabold opacity-60">.{decimalPart}</span>
    </span>
  );
};
