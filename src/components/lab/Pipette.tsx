import { motion } from "framer-motion";
import { PIPETTES, type PipetteModel } from "@/lib/lab-constants";

export function Pipette({
  model,
  volume,
  highlight,
  size = 260,
  hideReadout = false,
  hideModelLabel = false,
}: {
  model: PipetteModel;
  volume: number;
  highlight?: boolean;
  size?: number;
  /** Oculta el número del volumen bajo la pipeta (para ejercicios de lectura). */
  hideReadout?: boolean;
  /** Oculta la etiqueta P20/P100/P200/P1000 bajo la pipeta. */
  hideModelLabel?: boolean;
}) {
  const spec = PIPETTES[model];
  const pct = Math.min(1, Math.max(0, (volume - spec.min) / (spec.max - spec.min)));
  const dial = Math.round(pct * 270 - 135);

  // Stacked mechanical digits.
  // P20  → 3 dígitos, último es décimas (0.1 µL).
  // P100/P200 → 3 dígitos, precisión 1 µL.
  // P1000 → 4 dígitos (miles-centenas-decenas-unidades); el último wheel solo muestra 0 o 5 (paso 5 µL).
  const isP1000 = model === "P1000";
  const isP20 = model === "P20";
  const raw = isP20 ? Math.round(volume * 10) : Math.round(volume);
  const padLen = isP1000 ? 4 : 3;
  const digits = raw.toString().padStart(padLen, "0").slice(-padLen).split("");
  const decimalAt = isP20 ? 2 : -1;
  const digitH = isP1000 ? 16 : 22;
  const digitW = isP1000 ? 16 : 20;
  const startY = 74;
  const totalH = digitH * padLen + 4;
  const boxW = digitW + 10;

  return (
    <div className="flex flex-col items-center gap-2" style={{ width: size }}>
      <motion.svg
        viewBox="0 0 100 320"
        width={size * 0.55}
        height={size}
        initial={false}
        animate={{ scale: highlight ? 1.04 : 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="drop-shadow-md"
      >
        {/* Émbolo */}
        <rect x="42" y="0" width="16" height="22" rx="3" fill="oklch(0.35 0.04 255)" />
        <rect x="38" y="20" width="24" height="10" rx="2" fill="oklch(0.5 0.03 255)" />
        {/* Cuerpo superior */}
        <rect
          x="30"
          y="30"
          width="40"
          height="120"
          rx="6"
          fill="oklch(0.96 0.005 250)"
          stroke="oklch(0.85 0.01 250)"
        />
        {/* Etiqueta modelo */}
        <rect x="28" y="44" width="44" height="26" rx="5" fill={spec.color} />
        <text
          x="50"
          y="63"
          textAnchor="middle"
          fontSize="15"
          fontWeight="800"
          fill="white"
          fontFamily="ui-monospace, monospace"
        >
          {model}
        </text>
        {/* Display volumen — ventanas verticales mecánicas */}
        <rect
          x={50 - boxW / 2}
          y={startY - 4}
          width={boxW}
          height={totalH}
          rx="3"
          fill="oklch(0.15 0.02 250)"
          stroke="oklch(0.3 0.02 250)"
        />
        {digits.map((d, i) => {
          const y = startY + i * digitH;
          return (
            <g key={i}>
              <rect
                x={50 - digitW / 2}
                y={y}
                width={digitW}
                height={digitH - 2}
                rx="1.5"
                fill="oklch(0.98 0.005 250)"
              />
              <text
                x="50"
                y={y + digitH - 5}
                textAnchor="middle"
                fontSize={isP1000 ? 12 : 16}
                fontWeight="800"
                fill="oklch(0.2 0.03 255)"
                fontFamily="ui-monospace, monospace"
              >
                {d}
              </text>

              {i === decimalAt && (
                <circle
                  cx={50 + digitW / 2 + 2}
                  cy={y + digitH - 2}
                  r="1.2"
                  fill="oklch(0.85 0.18 30)"
                />
              )}
            </g>
          );
        })}
        {/* Dial */}
        <g transform="translate(50,160)">
          <circle r="18" fill="oklch(0.92 0.01 250)" stroke="oklch(0.75 0.02 250)" />
          <motion.line
            x1="0"
            y1="0"
            x2="0"
            y2="-14"
            stroke={spec.color}
            strokeWidth="3"
            strokeLinecap="round"
            animate={{ rotate: dial }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            style={{ transformOrigin: "0 0" }}
          />
          <circle r="2" fill="oklch(0.3 0.03 255)" />
        </g>
        {/* Cuerpo inferior cónico */}
        <path
          d="M 32 185 L 68 185 L 60 270 L 40 270 Z"
          fill="oklch(0.94 0.01 250)"
          stroke="oklch(0.82 0.01 250)"
        />
        {/* Cono porta-punta */}
        <path d="M 42 270 L 58 270 L 54 295 L 46 295 Z" fill="oklch(0.4 0.04 255)" />
        {/* Punta */}
        <path
          d="M 44 295 L 56 295 L 50 320 Z"
          fill="oklch(0.92 0.02 220)"
          stroke="oklch(0.75 0.02 220)"
        />
      </motion.svg>
      {!hideModelLabel && (
        <div className="text-center text-sm font-bold uppercase tracking-wider text-foreground">
          {model}
        </div>
      )}
    </div>
  );
}
