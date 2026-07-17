import { motion } from "framer-motion";

/**
 * Tubo de laboratorio con líquido coloreado.
 * - `color` (opcional): color final (post-vortex). Si se provee, ignora `intensity/hue`.
 * - `unmixed`: si true, dibuja capa de agua abajo y capa de KMnO4 arriba (no mezclados).
 * - `kmno4Frac`: fracción (0..1) del líquido total que corresponde a KMnO4 cuando unmixed.
 */
export function Tube({
  label,
  intensity = 0,
  fillPct = 0.7,
  hue = "kmno4",
  color,
  unmixed = false,
  kmno4Frac = 0,
  selected = false,
  onClick,
  size = 90,
  rimDeposit = false,
}: {
  label: string;
  intensity?: number;
  fillPct?: number;
  hue?: "kmno4" | "water" | "glycerol";
  color?: string;
  unmixed?: boolean;
  kmno4Frac?: number;
  selected?: boolean;
  onClick?: () => void;
  size?: number;
  rimDeposit?: boolean;
}) {
  const fallbackColor =
    hue === "kmno4"
      ? `oklch(0.45 ${0.05 + 0.22 * intensity} 310 / ${0.15 + 0.85 * intensity})`
      : hue === "glycerol"
        ? `oklch(0.92 0.02 90 / 0.85)`
        : `#CBEBF8`;
  const mixedColor = color ?? fallbackColor;
  const waterColor = "#CBEBF8";
  const kmnoColor = color && color !== "#CBEBF8" ? color : "#8815BD";

  const liquidHeight = fillPct * 140;
  const topY = 192 - liquidHeight;
  const kmnoHeight = unmixed ? liquidHeight * kmno4Frac : 0;
  const waterHeight = unmixed ? liquidHeight - kmnoHeight : liquidHeight;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex flex-col items-center gap-1.5 rounded-lg p-1.5 transition ${
        selected
          ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
          : "hover:bg-secondary/60"
      }`}
      style={{ width: size }}
    >
      <svg viewBox="0 0 60 200" width={size * 0.65} height={size * 2}>
        <rect x="10" y="0" width="40" height="12" rx="2" fill="oklch(0.55 0.02 255)" />
        <rect x="8" y="10" width="44" height="6" rx="1" fill="oklch(0.4 0.02 255)" />
        <path
          d="M 12 18 L 48 18 L 48 170 Q 48 192 30 192 Q 12 192 12 170 Z"
          fill="oklch(0.97 0.005 220)"
          stroke="oklch(0.78 0.01 220)"
          strokeWidth="1.2"
        />
        <defs>
          <clipPath id={`clip-${label}`}>
            <path d="M 14 20 L 46 20 L 46 169 Q 46 190 30 190 Q 14 190 14 169 Z" />
          </clipPath>
        </defs>
        {unmixed ? (
          <g clipPath={`url(#clip-${label})`}>
            <rect
              x="14"
              y={topY + kmnoHeight}
              width="32"
              height={waterHeight}
              fill={waterColor}
              style={{ transition: "y 0.4s ease, height 0.4s ease" }}
            />
            <rect
              x="14"
              y={topY}
              width="32"
              height={kmnoHeight}
              fill={kmnoColor}
              style={{ transition: "y 0.4s ease, height 0.4s ease" }}
            />
          </g>
        ) : (
          <rect
            x="14"
            y={topY}
            width="32"
            height={liquidHeight}
            fill={mixedColor}
            clipPath={`url(#clip-${label})`}
            style={{ transition: "y 0.4s ease, height 0.4s ease, fill 0.4s ease" }}
          />
        )}
        {rimDeposit && (
          <motion.circle
            cx="22"
            cy="40"
            r="4"
            fill="#8815BD"
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          />
        )}
        <path
          d="M 16 25 Q 18 90 16 170"
          stroke="oklch(1 0 0 / 0.6)"
          strokeWidth="1.5"
          fill="none"
        />
      </svg>
      <div className="text-center">
        <div className="font-mono text-xs font-semibold text-foreground">{label}</div>
      </div>
    </button>
  );
}
