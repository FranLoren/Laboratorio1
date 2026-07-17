import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tube } from "@/components/lab/Tube";
import { Pipette } from "@/components/lab/Pipette";
import { VolumeAdjuster, pipetteStep } from "@/components/lab/VolumeAdjuster";
import { PIPETTES, type PipetteModel } from "@/lib/lab-constants";
import { Finished } from "./Module0";
import { Check, Zap, ArrowRightLeft, AlertTriangle, Droplet } from "lucide-react";
import { useLabStore } from "@/store/lab-store";

const MODELS: PipetteModel[] = ["P20", "P100", "P200", "P1000"];
const TUBE_COLORS = [
  "#8815BD", // T1
  "#A043CF", // T2
  "#B869DB", // T3
  "#CD92E6", // T4
  "#DFB8EF", // T5
  "#EEDAF7", // T6
];
const STOCK_COLOR = "#8815BD";
const TRANSFER_VOL = 500; // µL
const STOCK_M = 0.1; // M (100 mM)
// Concentración esperada en cada tubo (mM) después de la mezcla:
// T1 = stock·V / Vtotal = 100·500/1000 = 50 mM, y luego /2 por cada paso.
const EXPECTED_mM = [50, 25, 12.5, 6.25, 3.125, 1.5625];

function bestPipette(v: number): PipetteModel {
  for (const m of MODELS) if (v >= PIPETTES[m].min && v <= PIPETTES[m].max) return m;
  return "P1000";
}

type TubeState = {
  hasWater: boolean;
  /** Origen del segundo líquido para representar las dos fases: índice del tubo previo o "stock". */
  source: "stock" | number | null;
  mixed: boolean;
  /** "lleno" = 2/4, "medio" = 1/4 */
  level: "empty" | "half" | "full";
};

type Phase = "concs" | "lab" | "done";

export function Module6({
  onComplete,
}: {
  onComplete: (score: number, details?: Record<string, unknown>) => void;
}) {
  const modProgress = useLabStore((s) => s.modules[6]);
  const isCompletedInStore = modProgress?.completed ?? false;

  const storageKey = "uct-prelab-draft-m6";

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
    if (draft?.phase === "done" || draft?.submitted === true) return true;
    return false;
  });
  const [reviewMode, setReviewMode] = useState<boolean>(false);

  const [phase, setPhase] = useState<Phase>(() => {
    if (isCompletedInStore || draft?.phase === "done" || draft?.submitted === true) return "done";
    return draft?.phase ?? "concs";
  });
  const [concInputs, setConcInputs] = useState<string[]>(draft?.concInputs ?? Array(6).fill(""));
  const [concUnit, setConcUnit] = useState<"mM" | "M">(draft?.concUnit ?? "mM");
  const [errors, setErrors] = useState(draft?.errors ?? 0);
  const [alerts, setAlerts] = useState<string[]>(draft?.alerts ?? []);

  const [pipette, setPipette] = useState<PipetteModel | null>(draft?.pipette ?? null);
  const [pipetteVols, setPipetteVols] = useState<Partial<Record<PipetteModel, number>>>(
    draft?.pipetteVols ?? {},
  );

  const [kmno4Added, setKmno4Added] = useState(draft?.kmno4Added ?? false);
  const [finalDiscarded, setFinalDiscarded] = useState(draft?.finalDiscarded ?? false);

  const [tubes, setTubes] = useState<TubeState[]>(
    draft?.tubes ??
      Array.from({ length: 6 }, () => ({
        hasWater: false,
        source: null,
        mixed: false,
        level: "empty",
      })),
  );

  const [lastSaved, setLastSaved] = useState<string>(() => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  });

  useEffect(() => {
    try {
      const state = {
        phase,
        concInputs,
        concUnit,
        errors,
        alerts,
        pipette,
        pipetteVols,
        kmno4Added,
        finalDiscarded,
        tubes,
        submitted,
      };
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (e) {
      // ignore
    }
  }, [
    phase,
    concInputs,
    concUnit,
    errors,
    alerts,
    pipette,
    pipetteVols,
    kmno4Added,
    finalDiscarded,
    tubes,
    submitted,
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

  const adjVol = pipette ? (pipetteVols[pipette] ?? PIPETTES[pipette].min) : 0;
  const setAdjVol = (v: number) => {
    if (!pipette) return;
    setPipetteVols((prev) => ({ ...prev, [pipette]: v }));
  };
  const choosePipette = (m: PipetteModel) => {
    setPipette(m);
    setPipetteVols((prev) => (prev[m] !== undefined ? prev : { ...prev, [m]: PIPETTES[m].min }));
  };

  function pushAlert(msg: string) {
    setAlerts((a) => [msg, ...a].slice(0, 6));
    setErrors((e) => e + 1);
  }

  // --- VALIDACIÓN CONCENTRACIONES ---
  const concsCorrect = useMemo(() => {
    return concInputs.every((raw, i) => {
      const n = Number(raw);
      if (!raw || !Number.isFinite(n)) return false;
      const valueInmM = concUnit === "mM" ? n : n * 1000;
      const expected = EXPECTED_mM[i];
      const tol = expected * 0.02 + 0.01;
      return Math.abs(valueInmM - expected) <= tol;
    });
  }, [concInputs, concUnit]);

  function validatePipette(): boolean {
    const recommended = bestPipette(TRANSFER_VOL);
    if (!pipette) {
      pushAlert("Selecciona una micropipeta antes de pipetear.");
      return false;
    }
    if (pipette !== recommended) {
      pushAlert(`Micropipeta inadecuada para ${TRANSFER_VOL} µL. Usa la ${recommended}.`);
      return false;
    }
    if (Math.abs(adjVol - TRANSFER_VOL) > 1) {
      pushAlert(`Volumen mal ajustado (${adjVol} µL). Debe ser ${TRANSFER_VOL} µL.`);
      return false;
    }
    return true;
  }

  // --- ACCIONES (siempre disponibles) ---
  function dispenseWater() {
    if (!validatePipette()) return;
    const idx = tubes.findIndex((t) => !t.hasWater);
    if (idx === -1) {
      pushAlert("Todos los tubos ya tienen agua.");
      return;
    }
    setTubes((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], hasWater: true, level: "half", mixed: true };
      return next;
    });
  }

  function dispenseKmno4() {
    if (!validatePipette()) return;
    if (!tubes[0].hasWater) {
      pushAlert("T1 no tiene agua precargada.");
      return;
    }
    if (kmno4Added) {
      pushAlert("Ya añadiste KMnO₄ a T1.");
      return;
    }
    setTubes((prev) => {
      const next = [...prev];
      next[0] = { ...next[0], source: "stock", level: "full", mixed: false };
      return next;
    });
    setKmno4Added(true);
  }

  function vortexAction() {
    // Vortexea el tubo con dos fases (origen != null, no mezclado, lleno).
    const idx = tubes.findIndex((t) => t.source !== null && !t.mixed && t.level === "full");
    if (idx === -1) {
      pushAlert("No hay ningún tubo con dos fases para vortexear.");
      return;
    }
    setTubes((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], mixed: true };
      return next;
    });
  }

  function transferAction() {
    if (!validatePipette()) return;
    // Tubo origen: el más avanzado que esté mezclado, lleno y con source != null.
    let from = -1;
    for (let i = tubes.length - 1; i >= 0; i--) {
      const t = tubes[i];
      if (t.source !== null && t.mixed && t.level === "full") {
        from = i;
        break;
      }
    }
    if (from === -1) {
      pushAlert("No hay un tubo mezclado listo para transferir.");
      return;
    }
    if (from + 1 >= 6) {
      // Último tubo: se descarta el sobrante (queda a 1/4)
      setTubes((prev) => {
        const next = [...prev];
        next[from] = { ...next[from], level: "half" };
        return next;
      });
      setFinalDiscarded(true);
      setPhase("done");
      setSubmitted(true);
      return;
    }
    const target = from + 1;
    if (!tubes[target].hasWater) {
      pushAlert(`T${target + 1} no tiene agua precargada.`);
      return;
    }
    setTubes((prev) => {
      const next = [...prev];
      next[from] = { ...next[from], level: "half" };
      next[target] = { ...next[target], source: from, level: "full", mixed: false };
      return next;
    });
  }

  // --- RENDER ---
  const score = useMemo(() => {
    if (phase !== "done" && !submitted) return 0;
    let s = 100;
    s -= errors * 5;
    return Math.max(0, s);
  }, [phase, errors, submitted]);

  if ((phase === "done" || submitted) && !reviewMode) {
    const details = {
      stock_M: STOCK_M,
      concentraciones: EXPECTED_mM.map((expected, i) => ({
        tubo: `T${i + 1}`,
        esperado_mM: expected,
        respuesta: concInputs[i],
        unidad: concUnit,
      })),
      imagenes_tubos: tubes.map((t, i) => ({
        label: `T${i + 1}`,
        color: TUBE_COLORS[i] ?? "#CBEBF8",
        fillPct: t.level === "full" ? 0.7 : t.level === "half" ? 0.4 : 0,
      })),
      errores: errors,
      transferenciaFinalDescartada: finalDiscarded,
    };

    return (
      <div className="space-y-4">
        <Finished
          score={score}
          correct={score}
          total={100}
          onComplete={() => {
            setSubmitted(true);
            onComplete(score, details);
          }}
          title="Dilución seriada lograda"
        />
        <div className="mx-auto max-w-lg text-center">
          <button
            onClick={() => setReviewMode(true)}
            className="text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            🔬 Volver a la mesa de trabajo para revisar tus resultados y la mesa
          </button>
        </div>
      </div>
    );
  }

  const recommended = bestPipette(TRANSFER_VOL);

  return (
    <div className="space-y-5">
      {submitted && reviewMode && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs">
          <span className="text-foreground font-medium">
            🔬 Modo Revisión: Puedes examinar los tubos de la dilución seriada, los cálculos de
            concentración ingresados y el estado final de los tubos.
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
          <strong className="text-foreground">Objetivo:</strong> Construir una dilución seriada
          FD=2. Primero carga 500 µL de H₂O en T1–T6, luego añade 500 µL de KMnO₄ (stock {STOCK_M}{" "}
          M) a T1, vortexea y transfiere 500 µL al siguiente tubo. Antes de pipetear debes declarar
          la concentración esperada de cada tubo.
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Progreso guardado (cada 25s) · {lastSaved}</span>
        </div>
      </div>

      {/* RACK */}
      <div className="lab-card p-5">
        <div className="grid grid-cols-6 gap-2">
          {tubes.map((t, i) => {
            const fill = t.level === "empty" ? 0 : t.level === "half" ? 0.25 : 0.5;
            const isUnmixed = t.source !== null && !t.mixed;
            const sourceColor =
              t.source === "stock"
                ? STOCK_COLOR
                : typeof t.source === "number"
                  ? TUBE_COLORS[t.source]
                  : undefined;
            const mixedColor =
              t.mixed && t.source !== null
                ? TUBE_COLORS[i]
                : t.mixed && t.hasWater
                  ? "#CBEBF8"
                  : undefined;
            const isActive = phase === "lab" && t.source !== null && !t.mixed;
            return (
              <motion.div key={i} animate={{ scale: isActive ? 1.03 : 1 }}>
                <Tube
                  label={`T${i + 1}`}
                  fillPct={fill}
                  hue="water"
                  color={isUnmixed ? sourceColor : mixedColor}
                  unmixed={isUnmixed}
                  kmno4Frac={isUnmixed ? 0.5 : 0}
                  selected={isActive}
                />
                <div className="mt-1 text-center font-mono text-[10px] text-muted-foreground">
                  {phase === "concs" || !concsCorrect
                    ? "—"
                    : `${EXPECTED_mM[i] >= 1 ? EXPECTED_mM[i] : EXPECTED_mM[i].toFixed(3)} mM`}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* TABLA DE CONCENTRACIONES */}
        <div className="mt-5 rounded-md border border-border bg-secondary/40 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Paso previo · Declara la concentración esperada de cada tubo
            </div>
            <div className="inline-flex rounded border border-border bg-background text-[11px]">
              {(["mM", "M"] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => setConcUnit(u)}
                  className={`px-2 py-1 ${concUnit === u ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
                  disabled={phase !== "concs"}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {concInputs.map((v, i) => (
              <label key={i} className="block">
                <span className="block text-center text-[10px] font-semibold text-muted-foreground">
                  T{i + 1}
                </span>
                <input
                  type="number"
                  step="0.001"
                  value={v}
                  disabled={phase !== "concs"}
                  onChange={(e) => {
                    const next = [...concInputs];
                    next[i] = e.target.value;
                    setConcInputs(next);
                  }}
                  className="mt-1 w-full rounded border border-input bg-background px-1 py-1 text-center font-mono text-xs focus:border-primary focus:outline-none disabled:opacity-60"
                />
              </label>
            ))}
          </div>
          {phase === "concs" && (
            <div className="mt-3 flex items-center justify-between gap-2 text-[11px]">
              <span className="text-muted-foreground">
                Stock KMnO₄ = {STOCK_M} M. Recuerda C₁V₁ = C₂V₂ con V₁ = V₂ = {TRANSFER_VOL} µL.
              </span>
              <button
                disabled={!concsCorrect}
                onClick={() => setPhase("lab")}
                className="rounded-md bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground disabled:opacity-50"
              >
                Confirmar y comenzar pipeteo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* PIPETEO */}
      {phase !== "concs" && (
        <>
          {submitted ? (
            <div className="lab-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-foreground">
                  Dilución Seriada Completada
                </h3>
                <span className="chip text-success">Estado: Finalizado con éxito</span>
              </div>
              <div className="mt-4 rounded-lg border border-success/30 bg-success/5 p-4 text-xs space-y-3 text-muted-foreground">
                <p className="font-semibold text-success flex items-center gap-1.5 text-sm">
                  <Check className="h-5 w-5" /> Resumen de la dilución seriada (FD=2)
                </p>
                <div className="space-y-2">
                  <p>
                    Has construido una dilución seriada de factor de dilución <strong>FD=2</strong>{" "}
                    utilizando un volumen de transferencia de <strong>500 µL</strong> de KMnO₄ stock
                    (100 mM) y <strong>500 µL</strong> de agua destilada como diluyente en cada
                    paso:
                  </p>
                  <ul className="list-disc list-inside space-y-1 mt-1 pl-1">
                    <li>
                      <strong>Tubo T1:</strong> Se añaden 500 µL de stock a 500 µL de agua (Vtotal =
                      1000 µL). La concentración se reduce a la mitad: <strong>50 mM</strong>.
                    </li>
                    <li>
                      <strong>Tubo T2 a T6:</strong> Se transfieren 500 µL del tubo anterior a un
                      tubo con 500 µL de agua. La concentración se reduce a la mitad en cada paso
                      sucesivo:
                      <ul className="list-disc list-inside pl-6 mt-1 space-y-0.5 font-mono text-[11px] text-foreground">
                        <li>T2: 25.0 mM</li>
                        <li>T3: 12.5 mM</li>
                        <li>T4: 6.25 mM</li>
                        <li>T5: 3.125 mM</li>
                        <li>T6: 1.5625 mM</li>
                      </ul>
                    </li>
                    <li>
                      La micropipeta adecuada para dispensar y transferir <strong>500 µL</strong> es
                      la <strong>{bestPipette(500)}</strong>.
                    </li>
                    <li>
                      <strong>Sobrante de T6:</strong> Se descartan 500 µL del último tubo para que
                      todos los tubos de la dilución mantengan el mismo volumen final de 500 µL.
                    </li>
                  </ul>
                  <div className="border-t border-border mt-3 pt-3 flex items-center justify-between gap-2 text-[11px]">
                    <span className="inline-flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      Total de errores de pipeteo o técnica en este intento:{" "}
                      <strong className="text-foreground">{errors}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="lab-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-foreground">
                  Laboratorio · ejecuta la dilución seriada
                </h3>
                <span className="chip">Recomendada: {recommended}</span>
              </div>

              <div className="mt-4 grid gap-5 md:grid-cols-[1fr_1fr]">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Micropipeta
                  </div>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {MODELS.map((m) => (
                      <button
                        key={m}
                        onClick={() => choosePipette(m)}
                        className={`rounded-lg border p-2 text-xs font-semibold ${
                          pipette === m
                            ? m === recommended
                              ? "border-success bg-success/10 text-success"
                              : "border-destructive bg-destructive/10 text-destructive"
                            : "border-border bg-background hover:bg-secondary"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <button
                      onClick={dispenseWater}
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
                    >
                      <Droplet className="h-4 w-4" /> Dispensar 500 µL H₂O
                    </button>
                    <button
                      onClick={dispenseKmno4}
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
                    >
                      <Check className="h-4 w-4" /> Dispensar 500 µL KMnO₄ (T1)
                    </button>
                    <button
                      onClick={vortexAction}
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground"
                    >
                      <Zap className="h-4 w-4" /> Vortex
                    </button>
                    <button
                      onClick={transferAction}
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
                    >
                      <ArrowRightLeft className="h-4 w-4" /> Transferir 500 µL
                    </button>
                  </div>

                  <div className="mt-4 flex items-center gap-3 text-xs">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                      Errores detectados: <strong className="text-foreground">{errors}</strong>
                    </span>
                  </div>
                  {alerts.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {alerts.map((a, i) => (
                        <li
                          key={i}
                          className="rounded bg-destructive/10 px-2 py-1 text-[11px] text-destructive"
                        >
                          {a}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex flex-col items-center gap-3">
                  <motion.div animate={{ opacity: pipette ? 1 : 0.6, scale: pipette ? 1 : 0.95 }}>
                    <Pipette
                      model={pipette ?? "P1000"}
                      volume={pipette ? adjVol : 0}
                      highlight={!!pipette}
                    />
                  </motion.div>
                  {pipette && (
                    <VolumeAdjuster
                      model={pipette}
                      value={adjVol}
                      step={pipetteStep(pipette, TRANSFER_VOL)}
                      onChange={setAdjVol}
                      compact
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
