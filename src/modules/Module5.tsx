import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Tube } from "@/components/lab/Tube";
import { Pipette } from "@/components/lab/Pipette";
import {
  M5_TUBES,
  M5_STOCK_LABEL,
  M5_STOCK_mM,
  M5_VFINAL_uL,
  PIPETTES,
  type PipetteModel,
} from "@/lib/lab-constants";
import { VolumeAdjuster } from "@/components/lab/VolumeAdjuster";
import { Finished } from "./Module0";
import { Check } from "lucide-react";
import { useLabStore } from "@/store/lab-store";

const MODELS: PipetteModel[] = ["P20", "P100", "P200", "P1000"];
const TUBE_COLORS = [
  "#8815BD", // S1
  "#A043CF", // S2
  "#B869DB", // S3
  "#CD92E6", // S4
  "#DFB8EF", // S5
  "#EEDAF7", // S6
  "#F8F0FC", // S7
];
type Reagent = "stock" | "agua";

function bestPipette(volume: number): PipetteModel {
  for (const m of MODELS) {
    if (volume >= PIPETTES[m].min && volume <= PIPETTES[m].max) return m;
  }
  return "P1000";
}

function volumeStep(model: PipetteModel, target: number) {
  const isDecimal = target % 1 !== 0;
  if (model === "P20") return isDecimal ? 0.1 : 0.5;
  if (model === "P100") return isDecimal ? 0.5 : 1;
  if (model === "P200") return isDecimal ? 0.5 : target % 5 === 0 ? 5 : 1;
  // P1000: incremento de 1 µL para permitir ajuste fino.
  return 1;
}

function concentrationLabel(id: string, cFinal_mM: number) {
  if (id === "S1" || id === "S5") return `${(cFinal_mM / 1000).toFixed(id === "S1" ? 2 : 6)} M`;
  return `${cFinal_mM} mM`;
}

export function Module5({
  onComplete,
}: {
  onComplete: (score: number, details?: Record<string, unknown>) => void;
}) {
  const modProgress = useLabStore((s) => s.modules[5]);
  const isCompletedInStore = modProgress?.completed ?? false;

  const storageKey = "uct-prelab-draft-m5";

  const draft = useMemo(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return null;
  }, []);

  const [submitted, setSubmitted] = useState<boolean>(() => {
    if (isCompletedInStore) return true;
    if (draft?.submitted === true) return true;
    return false;
  });
  const [reviewMode, setReviewMode] = useState<boolean>(false);

  const [idx, setIdx] = useState(() => {
    if (isCompletedInStore || draft?.submitted === true) {
      return 0; // Pre-select first tube for review
    }
    return draft?.idx ?? 0;
  });

  const [savedPrep, setSavedPrep] = useState<Record<string, unknown>[]>(() => {
    if (draft?.savedPrep) return draft.savedPrep;
    return Array(M5_TUBES.length)
      .fill(null)
      .map((_, i) => ({
        vStockInput: M5_TUBES[i].vStock_uL.toString(),
        vAguaInput: M5_TUBES[i].vAgua_uL.toString(),
        fdInput: M5_TUBES[i].FD.toString(),
        calcOk: true,
        reagentPipette: {
          stock: bestPipette(M5_TUBES[i].vStock_uL),
          agua: bestPipette(M5_TUBES[i].vAgua_uL),
        },
        dispensed: { stock: true, agua: true },
        vortexed: true,
      }));
  });

  const [vStock, setVStock] = useState(draft?.vStock ?? "");
  const [vAgua, setVAgua] = useState(draft?.vAgua ?? "");
  const [fd, setFd] = useState(draft?.fd ?? "");
  const [reagentPipette, setReagentPipette] = useState<Record<Reagent, PipetteModel | null>>(
    draft?.reagentPipette ?? { stock: null, agua: null },
  );
  const [pipetteVols, setPipetteVols] = useState<Partial<Record<PipetteModel, number>>>(
    draft?.pipetteVols ?? {},
  );
  const [reagent, setReagent] = useState<Reagent>(draft?.reagent ?? "stock");
  const [dispensed, setDispensed] = useState<Record<Reagent, boolean>>(
    draft?.dispensed ?? { stock: false, agua: false },
  );
  const [vortexed, setVortexed] = useState(draft?.vortexed ?? false);
  const [feedback, setFeedback] = useState<string | null>(draft?.feedback ?? null);
  const [scores, setScores] = useState<number[]>(draft?.scores ?? []);
  const [phase, setPhase] = useState<"calc" | "pipeteo" | "done">(draft?.phase ?? "calc");

  const [lastSaved, setLastSaved] = useState<string>(() => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  });

  useEffect(() => {
    try {
      const state = {
        idx,
        vStock,
        vAgua,
        fd,
        reagentPipette,
        pipetteVols,
        reagent,
        dispensed,
        vortexed,
        feedback,
        scores,
        phase,
        submitted,
        savedPrep,
      };
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (e) {
      // ignore
    }
  }, [
    idx,
    vStock,
    vAgua,
    fd,
    reagentPipette,
    pipetteVols,
    reagent,
    dispensed,
    vortexed,
    feedback,
    scores,
    phase,
    submitted,
    savedPrep,
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setLastSaved(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      );
    }, 25000);
    return () => clearInterval(interval);
  }, []);

  if (submitted && !reviewMode) {
    const final = Math.round(scores.reduce((a, b) => a + b, 0) / (scores.length || 1));
    const details = {
      tubos: M5_TUBES.map((tube, i) => ({
        tubo: tube.id,
        c_final_mM: tube.cFinal_mM,
        v_stock_uL: tube.vStock_uL,
        v_agua_uL: tube.vAgua_uL,
        FD: tube.FD,
        puntaje: scores[i] ?? 100,
      })),
      imagenes_tubos: M5_TUBES.map((tube, i) => ({
        label: tube.id,
        color: TUBE_COLORS[i] ?? "#CBEBF8",
        fillPct: 0.7,
      })),
    };

    return (
      <div className="space-y-4">
        <Finished
          score={final || 100}
          correct={final || 100}
          total={100}
          onComplete={() => onComplete(final || 100, details)}
          title="Diluciones simples completadas"
        />
        <div className="mx-auto max-w-lg text-center">
          <button
            onClick={() => {
              setReviewMode(true);
              setIdx(0); // Show S1 first
            }}
            className="text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            🔬 Volver a la mesa de trabajo para revisar tus cálculos y tubos
          </button>
        </div>
      </div>
    );
  }

  const t = M5_TUBES[idx] || M5_TUBES[0];

  const calcOk = (() => {
    const vs = Number(vStock),
      va = Number(vAgua),
      f = Number(fd);
    return (
      Math.abs(vs - t.vStock_uL) < 1 && Math.abs(va - t.vAgua_uL) < 1 && Math.abs(f - t.FD) < 0.5
    );
  })();

  const targetVolume = reagent === "stock" ? t.vStock_uL : t.vAgua_uL;
  const recommendedPipette = bestPipette(targetVolume);
  const pipette = reagentPipette[reagent];
  const adjVol = pipette ? (pipetteVols[pipette] ?? PIPETTES[pipette].min) : 0;
  const bothDispensed = dispensed.stock && dispensed.agua;
  const canAdvance = bothDispensed && vortexed;

  const setPipette = (m: PipetteModel) => {
    setReagentPipette((prev) => ({ ...prev, [reagent]: m }));
    setPipetteVols((prev) => (prev[m] !== undefined ? prev : { ...prev, [m]: PIPETTES[m].min }));
  };
  const setAdjVol = (v: number) => {
    if (!pipette) return;
    setPipetteVols((prev) => ({ ...prev, [pipette]: v }));
  };

  const advance = () => {
    let s = 0;
    if (calcOk) s += 60;
    if (bothDispensed) s += 30;
    if (vortexed) s += 10;
    const newScores = [...scores, s];
    setScores(newScores);

    // Save current tube prep to savedPrep state
    const currentPrep = {
      vStockInput: vStock,
      vAguaInput: vAgua,
      fdInput: fd,
      calcOk: calcOk,
      reagentPipette: { ...reagentPipette },
      dispensed: { ...dispensed },
      vortexed: vortexed,
    };
    const newSavedPrep = [...savedPrep];
    newSavedPrep[idx] = currentPrep;
    setSavedPrep(newSavedPrep);

    if (idx + 1 >= M5_TUBES.length) {
      setSubmitted(true);
    } else {
      setIdx(idx + 1);
      setVStock("");
      setVAgua("");
      setFd("");
      setReagentPipette({ stock: null, agua: null });
      // pipetteVols se conserva entre tubos para recordar el último ajuste por modelo
      setReagent("stock");
      setDispensed({ stock: false, agua: false });
      setVortexed(false);
      setFeedback(null);
      setPhase("calc");
    }
  };

  return (
    <div className="space-y-5">
      {submitted && reviewMode && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs">
          <span className="text-foreground font-medium">
            🔬 Modo Revisión: Haz clic en cualquier tubo de abajo para inspeccionar los cálculos y
            la preparación correcta.
          </span>
          <button
            onClick={() => setReviewMode(false)}
            className="rounded-md bg-primary px-3 py-1 font-semibold text-primary-foreground text-[11px] cursor-pointer"
          >
            Volver al Resumen
          </button>
        </div>
      )}
      <div className="lab-panel p-4 text-xs text-muted-foreground sm:text-sm flex flex-wrap items-center justify-between gap-2">
        <div>
          <strong className="text-foreground">Objetivo:</strong> Aplicar la ecuación C₁V₁ = C₂V₂
          para preparar diluciones simples de KMnO₄ a partir de un stock {M5_STOCK_LABEL}, eligiendo
          la micropipeta adecuada para cada volumen y verificando el factor de dilución obtenido.
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Progreso guardado (cada 25s) · {lastSaved}</span>
        </div>
      </div>
      {/* rack overview */}
      <div className="lab-card p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Rack S1–S7 · Stock {M5_STOCK_LABEL} · Vfinal {M5_VFINAL_uL} µL
        </div>
        <div className="mt-3 grid grid-cols-7 gap-2">
          {M5_TUBES.map((tube, i) => {
            const isCurrent = i === idx;
            const done = submitted || i < idx;
            const showUnmixed = isCurrent && bothDispensed && !vortexed && !submitted;
            const showMixed = (isCurrent && bothDispensed && vortexed) || submitted || done;
            const partialFill =
              isCurrent && !bothDispensed && !submitted
                ? (dispensed.stock ? 0.05 : 0) + (dispensed.agua ? 0.8 : 0)
                : 0;
            return (
              <div
                key={tube.id}
                onClick={() => {
                  if (submitted) {
                    setIdx(i);
                  }
                }}
                className={submitted ? "cursor-pointer" : ""}
              >
                <Tube
                  label={tube.id}
                  intensity={done || showMixed ? tube.cFinal_mM / M5_STOCK_mM : 0}
                  fillPct={done ? 0.85 : showUnmixed || showMixed ? 0.85 : partialFill}
                  hue={partialFill > 0 && !dispensed.stock ? "water" : "kmno4"}
                  color={done || showMixed ? TUBE_COLORS[i] : undefined}
                  unmixed={showUnmixed}
                  kmno4Frac={showUnmixed ? 0.15 : 0}
                  selected={isCurrent}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="lab-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-foreground">
            Tubo <span className="text-primary">{t.id}</span> — preparar{" "}
            {concentrationLabel(t.id, t.cFinal_mM)} (Vfinal {M5_VFINAL_uL} µL)
          </h3>
          <span className="chip">
            {submitted
              ? "Resultados del Tubo"
              : phase === "calc"
                ? "Paso 1: Cálculo"
                : "Paso 2: Pipeteo"}
          </span>
        </div>

        {submitted ? (
          <div className="mt-4 grid gap-5 md:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-secondary/40 p-3 text-center border border-border">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Volumen Stock (V₁)
                  </span>
                  <span className="mt-1 block font-mono text-base font-bold text-foreground">
                    {t.vStock_uL} µL
                  </span>
                  <span className="block text-[9px] text-muted-foreground mt-0.5">
                    Tu respuesta:{" "}
                    <strong
                      className={
                        savedPrep[idx]?.vStockInput === t.vStock_uL.toString()
                          ? "text-success"
                          : "text-destructive"
                      }
                    >
                      {savedPrep[idx]?.vStockInput || "—"} µL
                    </strong>
                  </span>
                </div>
                <div className="rounded-lg bg-secondary/40 p-3 text-center border border-border">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Volumen Agua
                  </span>
                  <span className="mt-1 block font-mono text-base font-bold text-foreground">
                    {t.vAgua_uL} µL
                  </span>
                  <span className="block text-[9px] text-muted-foreground mt-0.5">
                    Tu respuesta:{" "}
                    <strong
                      className={
                        savedPrep[idx]?.vAguaInput === t.vAgua_uL.toString()
                          ? "text-success"
                          : "text-destructive"
                      }
                    >
                      {savedPrep[idx]?.vAguaInput || "—"} µL
                    </strong>
                  </span>
                </div>
                <div className="rounded-lg bg-secondary/40 p-3 text-center border border-border">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Factor Dilución (FD)
                  </span>
                  <span className="mt-1 block font-mono text-base font-bold text-foreground">
                    {t.FD}
                  </span>
                  <span className="block text-[9px] text-muted-foreground mt-0.5">
                    Tu respuesta:{" "}
                    <strong
                      className={
                        savedPrep[idx]?.fdInput === t.FD.toString()
                          ? "text-success"
                          : "text-destructive"
                      }
                    >
                      {savedPrep[idx]?.fdInput || "—"}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-success/30 bg-success/5 p-4 text-xs space-y-2">
                <p className="font-semibold text-success flex items-center gap-1.5">
                  <Check className="h-4 w-4" /> Preparación del tubo completada
                </p>
                <div className="text-muted-foreground space-y-1">
                  <p>
                    Para obtener una concentración de{" "}
                    <strong>{concentrationLabel(t.id, t.cFinal_mM)}</strong> en un volumen final de{" "}
                    <strong>{M5_VFINAL_uL} µL</strong> a partir del stock de {M5_STOCK_LABEL}:
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>
                      Se calcula el volumen de stock necesario usando{" "}
                      <code className="font-mono bg-secondary/60 px-1 rounded">C₁V₁ = C₂V₂</code>:{" "}
                      <br />
                      <span className="pl-4 font-mono text-[11px] text-foreground">
                        V₁ = ({t.cFinal_mM} mM * {M5_VFINAL_uL} µL) / {M5_STOCK_mM} mM ={" "}
                        <strong>{t.vStock_uL} µL</strong>
                      </span>
                    </li>
                    <li>
                      El volumen de agua es el restante:{" "}
                      <code className="font-mono bg-secondary/60 px-1 rounded">
                        V_agua = V_final - V₁
                      </code>
                      : <br />
                      <span className="pl-4 font-mono text-[11px] text-foreground">
                        V_agua = {M5_VFINAL_uL} µL - {t.vStock_uL} µL ={" "}
                        <strong>{t.vAgua_uL} µL</strong>
                      </span>
                    </li>
                    <li>
                      La micropipeta recomendada para pipetear <strong>{t.vStock_uL} µL</strong> es
                      la <strong className="text-foreground">{bestPipette(t.vStock_uL)}</strong>.
                    </li>
                    <li>
                      La micropipeta recomendada para pipetear <strong>{t.vAgua_uL} µL</strong> es
                      la <strong className="text-foreground">{bestPipette(t.vAgua_uL)}</strong>.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-4 bg-secondary/10 border border-border/60 rounded-xl">
              <span className="text-xs font-semibold text-muted-foreground mb-2">
                Simulación de Pipeteo
              </span>
              <div className="flex gap-4 items-center">
                <Tube
                  label={t.id}
                  intensity={t.cFinal_mM / M5_STOCK_mM}
                  fillPct={0.85}
                  color={TUBE_COLORS[idx]}
                  selected={true}
                />
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-foreground">Material Utilizado:</p>
                  <p className="text-muted-foreground font-mono">
                    · {savedPrep[idx]?.reagentPipette?.stock || bestPipette(t.vStock_uL)} (Stock)
                  </p>
                  <p className="text-muted-foreground font-mono">
                    · {savedPrep[idx]?.reagentPipette?.agua || bestPipette(t.vAgua_uL)} (Agua)
                  </p>
                  <p className="mt-2 text-primary font-semibold">
                    Tubo homogeneizado con Vortex 🌀
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {phase === "calc" && (
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <NumField
                  label="Volumen stock (µL)"
                  value={vStock}
                  onChange={setVStock}
                  hint="C1·V1 = C2·V2"
                />
                <NumField
                  label="Volumen agua (µL)"
                  value={vAgua}
                  onChange={setVAgua}
                  hint="Vfinal − Vstock"
                />
                <NumField
                  label="Factor de dilución"
                  value={fd}
                  onChange={setFd}
                  hint="C inicial / C final"
                />
                <div className="sm:col-span-3 flex items-center justify-between gap-3 rounded-md bg-secondary/60 p-3 text-xs">
                  <span className="text-foreground">
                    {calcOk
                      ? "Cálculo correcto."
                      : vStock && vAgua && fd
                        ? "Revisa la ecuación C₁V₁=C₂V₂ y el FD."
                        : "Completa los tres campos."}
                  </span>
                  <button
                    disabled={!calcOk}
                    onClick={() => setPhase("pipeteo")}
                    className="rounded-md bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    Continuar a pipeteo
                  </button>
                </div>
              </div>
            )}

            {phase === "pipeteo" && (
              <div className="mt-4 grid gap-5 md:grid-cols-[1fr_1fr]">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Selecciona líquido a dispensar
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {(["stock", "agua"] as Reagent[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => setReagent(r)}
                        className={`rounded-lg border p-2 text-xs font-semibold ${
                          reagent === r
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background hover:bg-secondary"
                        }`}
                      >
                        {r === "stock" ? "KMnO₄ stock" : "H₂O"} {dispensed[r] && "✓"}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Selecciona la micropipeta
                  </div>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {MODELS.map((m) => (
                      <button
                        key={m}
                        onClick={() => setPipette(m)}
                        className={`rounded-lg border p-2 text-xs font-semibold ${
                          pipette === m
                            ? m === recommendedPipette
                              ? "border-success bg-success/10 text-success"
                              : "border-destructive bg-destructive/10 text-destructive"
                            : "border-border bg-background hover:bg-secondary"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      disabled={!pipette || dispensed[reagent]}
                      onClick={() => {
                        const tol = targetVolume < 20 ? 0.5 : targetVolume % 1 !== 0 ? 2.5 : 1;
                        const ok =
                          pipette === recommendedPipette && Math.abs(adjVol - targetVolume) <= tol;
                        if (ok) {
                          setDispensed((prev) => ({ ...prev, [reagent]: true }));
                          setFeedback(
                            `${reagent === "stock" ? "KMnO₄" : "H₂O"} dispensado correctamente.`,
                          );
                        } else {
                          setFeedback(
                            "Revisa la micropipeta y el volumen ajustado antes de dispensar.",
                          );
                        }
                      }}
                      className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" /> Dispensar{" "}
                      {reagent === "stock" ? "KMnO₄" : "H₂O"}
                    </button>
                    <button
                      disabled={!bothDispensed || vortexed}
                      onClick={() => {
                        setVortexed(true);
                        setFeedback(
                          `Tubo ${t.id} vortexeado: los líquidos se mezclan homogéneamente.`,
                        );
                      }}
                      className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground disabled:opacity-50"
                    >
                      🌀 Vortexear {t.id}
                    </button>
                    <button
                      disabled={!canAdvance}
                      onClick={advance}
                      className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                    >
                      Pasar al siguiente
                    </button>
                  </div>
                  <div className="mt-3 text-[11px] text-muted-foreground">
                    Estado: KMnO₄ {dispensed.stock ? "✅" : "⏳"} · H₂O{" "}
                    {dispensed.agua ? "✅" : "⏳"} · Vortex {vortexed ? "✅" : "⏳"}
                  </div>
                  {feedback && (
                    <div className="mt-2 rounded-md bg-secondary/60 p-2 text-[11px] text-foreground">
                      {feedback}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-center gap-3">
                  <motion.div
                    animate={{ scale: pipette ? 1 : 0.95, opacity: pipette ? 1 : 0.6 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Pipette
                      model={pipette ?? "P200"}
                      volume={pipette ? adjVol : 0}
                      highlight={!!pipette}
                    />
                  </motion.div>
                  {pipette && (
                    <VolumeAdjuster
                      model={pipette}
                      value={adjVol}
                      step={volumeStep(pipette, targetVolume)}
                      onChange={setAdjVol}
                      compact
                    />
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        type="number"
        step="0.1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none"
      />
      {hint && <span className="mt-1 block text-[10px] text-muted-foreground">{hint}</span>}
    </label>
  );
}
