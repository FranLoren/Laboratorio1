import { useEffect, useRef } from "react";
import { Minus, Plus } from "lucide-react";
import { PIPETTES, type PipetteModel } from "@/lib/lab-constants";

/**
 * Reusable volume adjuster with +/- buttons and mouse-wheel support.
 * The student must read the volume on the mechanical window of the pipette;
 * no digital readout is shown here on purpose.
 */
export function VolumeAdjuster({
  model,
  value,
  onChange,
  step,
  showValue = false,
  compact = false,
}: {
  model: PipetteModel;
  value: number;
  onChange: (next: number) => void;
  /** Per-click increment in µL. */
  step: number;
  /** Show the current volume next to the controls (digital readout). */
  showValue?: boolean;
  /** Compact: only +/- buttons, no helper label. */
  compact?: boolean;
}) {
  const { min, max } = PIPETTES[model];
  const ref = useRef<HTMLDivElement>(null);

  const clamp = (v: number) => Math.min(max, Math.max(min, +v.toFixed(4)));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dir = e.deltaY < 0 ? 1 : -1;
      onChange(clamp(value + dir * step));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [value, step, min, max, onChange]);

  return (
    <div
      ref={ref}
      className="inline-flex select-none items-center gap-2 rounded-md border border-border bg-background p-1"
      title="Usa los botones o la rueda del mouse para ajustar el volumen"
    >
      <button
        type="button"
        onClick={() => onChange(clamp(value - step))}
        className="grid h-10 w-10 place-items-center rounded-md border border-border bg-background hover:bg-secondary"
        aria-label="Disminuir volumen"
      >
        <Minus className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange(clamp(value + step))}
        className="grid h-10 w-10 place-items-center rounded-md border border-border bg-background hover:bg-secondary"
        aria-label="Aumentar volumen"
      >
        <Plus className="h-4 w-4" />
      </button>
      {!compact && (
        <span className="px-2 text-[10px] uppercase tracking-wider text-muted-foreground">
          ± o rueda del mouse
        </span>
      )}
    </div>
  );
}

/** Per-click step in µL. P1000 uses 5 µL (last wheel = 0 or 5). */
export function pipetteStep(model: PipetteModel, target?: number): number {
  if (model === "P20") return 0.5;
  if (model === "P100") return 1;
  if (model === "P200") return target !== undefined && target % 5 === 0 ? 5 : 1;
  return 5; // P1000
}
