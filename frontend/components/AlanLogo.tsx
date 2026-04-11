/**
 * Alan logo — marmot face + "alan" text
 * Recreated as SVG from the official Alan lockup
 *
 * Owner: Dev 3
 */

interface AlanLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  color?: string;
  showText?: boolean;
}

export function AlanMarmot({ className = "", size = "md", color = "#282830" }: { className?: string; size?: "sm" | "md" | "lg"; color?: string }) {
  const sizes = { sm: 28, md: 36, lg: 48 };
  const s = sizes[size];

  return (
    <svg width={s} height={s} viewBox="0 0 100 100" fill="none" className={className}>
      {/* Left eye */}
      <circle cx="18" cy="28" r="8" fill={color} />
      {/* Right eye */}
      <circle cx="52" cy="28" r="6" fill={color} />
      {/* Nose */}
      <ellipse cx="38" cy="48" rx="18" ry="14" fill={color} />
      {/* Mouth */}
      <path d="M24 70 Q38 86 52 70" stroke={color} strokeWidth="7" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export default function AlanLogo({ className = "", size = "md", color = "#282830", showText = true }: AlanLogoProps) {
  const textSizes = { sm: "text-lg", md: "text-2xl", lg: "text-4xl" };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <AlanMarmot size={size} color={color} />
      {showText && (
        <span className={`${textSizes[size]} font-bold tracking-tight`} style={{ color }}>
          alan
        </span>
      )}
    </div>
  );
}

export function HeyMoLogo({ className = "", size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const textSizes = { sm: "text-xl", md: "text-3xl", lg: "text-5xl" };
  const subtextSizes = { sm: "text-[10px]", md: "text-xs", lg: "text-sm" };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="flex items-center gap-2">
        <AlanMarmot size={size} color="#5C59F3" />
        <span className={`${textSizes[size]} font-bold text-[#282830] tracking-tight`}>
          Hey<span className="text-[#5C59F3]">Mo</span>
        </span>
      </div>
      <div className={`flex items-center gap-1.5 ${subtextSizes[size]} text-[#9DA3BA] font-medium mt-0.5`}>
        <span>by</span>
        <AlanMarmot size="sm" color="#9DA3BA" />
        <span className="text-[#464754] font-semibold">alan</span>
      </div>
    </div>
  );
}
