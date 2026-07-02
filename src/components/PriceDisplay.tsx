import React from "react";

interface PriceDisplayProps {
  amount: number;
  className?: string;
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  colorClass?: string;
  showDecimals?: boolean;
  compact?: boolean | "auto";
  truncate?: boolean;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  amount,
  className = "",
  size,
  colorClass = "text-slate-900",
  showDecimals = false,
  compact = "auto",
  truncate = true,
}) => {
  const val = typeof amount === "number" ? amount : Number(amount) || 0;
  const rawCompact = compact as boolean | "auto";
  const compactMode: boolean | "auto" = rawCompact === true ? true : rawCompact === "auto" ? "auto" : false;
  const shouldCompact = compactMode === true || (compactMode === "auto" && Math.abs(val) >= 1_000_000);

  // Tanzanian shilling marketplace prices read cleaner without cents.
  const displayValue = shouldCompact
    ? Math.abs(val) >= 1_000_000_000
      ? val / 1_000_000_000
      : val / 1_000_000
    : val;
  const compactSuffix = shouldCompact
    ? Math.abs(val) >= 1_000_000_000
      ? "B"
      : "M"
    : "";

  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: shouldCompact ? 1 : showDecimals ? 2 : 0,
  }).format(displayValue);

  const parts = formatted.split(".");
  const integerPart = parts[0];
  const decimalPart = parts[1] || "00";
  const mainDisplay = shouldCompact ? formatted : integerPart;

  // Dynamic font sizing override based on character length of integerPart (e.g. "1,200,000" is length 9)
  // We use "em" unit scaling so it is naturally responsive relative to any parent/base text classes
  const length = integerPart.length;
  let fontScaleStyle: React.CSSProperties = {};
  if (length > 6) {
    // 6 characters or fewer (e.g. "90,000") is normal size.
    // Above 6, decrease font size progressively by 3.5% per additional character
    // Cap minimum sizing scale to 0.72em to preserve absolute readability
    const scale = Math.max(0.64, 1 - 0.045 * (length - 6));
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
      title={`TSh ${new Intl.NumberFormat("en-US").format(val)}`}
      className={`font-money font-[800] tabular-nums tracking-tight inline-flex min-w-0 max-w-full items-baseline flex-nowrap whitespace-nowrap ${colorClass} ${selectedSizeClass} ${className} transition-all`}
      style={{ 
        fontVariantNumeric: "tabular-nums",
        ...fontScaleStyle
      }}
    >
      <span className="text-[0.75em] font-black mr-0.5 opacity-70 select-none shrink-0">TSh</span>
      <span className={truncate ? "min-w-0 overflow-hidden text-ellipsis" : "min-w-0 overflow-visible"}>
        {mainDisplay}{compactSuffix}
      </span>
      {!shouldCompact && showDecimals && (
        <span className="text-[0.65em] font-extrabold opacity-60">.{decimalPart}</span>
      )}
    </span>
  );
};
