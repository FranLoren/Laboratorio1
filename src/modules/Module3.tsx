import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Pipette } from "@/components/lab/Pipette";
import { VolumeAdjuster } from "@/components/lab/VolumeAdjuster";
import { Tube } from "@/components/lab/Tube";
import { M3_TUBES, PIPETTES, type ErrorTube, type PipetteModel } from "@/lib/lab-constants";
import { Finished } from "./Module0";
import { Lock, CheckCircle2 } from "lucide-react";
import { JustifiedQuiz } from "@/components/lab/JustifiedQuiz";
import { M3_QUIZ } from "@/lib/quiz-questions";

type Reagent = "kmno4" | "agua";
type Technique = "forward" | "reverse";
type TubePrep = {
  kmno4: boolean;
  agua: boolean;
  kmno4Vol: number;
  aguaVol: number;
  kmno4Tech?: Technique;
  aguaTech?: Technique;
};
type PrepState = Record<string, TubePrep>;

const MODELS: PipetteModel[] = ["P20", "P100", "P200", "P1000"];
const EMPTY_PREP: TubePrep = { kmno4: false, agua: false, kmno4Vol: 0, aguaVol: 0 };
const VOLUME_TO_TUBE_FILL = 0.5 / 1000;

// Técnica esperada por tubo y reactivo. Si no se indica, se asume "forward".
const EXPECTED_TECH: Record<string, { kmno4?: Technique; agua?: Technique }> = {
  H: { agua: "reverse" }, // H: pipeteo inverso del agua es lo correcto
};

function expectedTechFor(tubeId: string, reagent: Reagent): Technique {
  return EXPECTED_TECH[tubeId]?.[reagent] ?? "forward";
}

function reagentStatus(prep: TubePrep, tubeId: string, reagent: Reagent): "pending" | "ok" | "bad" {
  const done = reagent === "kmno4" ? prep.kmno4 : prep.agua;
  if (!done) return "pending";
  const used = reagent === "kmno4" ? prep.kmno4Tech : prep.aguaTech;
  if (used && used !== expectedTechFor(tubeId, reagent)) return "bad";
  return "ok";
}

function statusIcon(s: "pending" | "ok" | "bad") {
  return s === "ok" ? "✅" : s === "bad" ? "❌" : "⏳";
}

function bestPipette(volume: number): PipetteModel {
  return MODELS.find((m) => volume >= PIPETTES[m].min && volume <= PIPETTES[m].max) ?? "P1000";
}

function visualForTube(t: ErrorTube, state: TubePrep | undefined, vortexed: boolean) {
  const prep = state ?? EMPTY_PREP;
  const bothDispensed = prep.kmno4 && prep.agua;

  // E: caso especial — gota retenida en la pared superior; el líquido del tubo es solo agua.
  if (t.id === "E") {
    if (!prep.kmno4 && !prep.agua) {
      return {
        fillPct: 0,
        color: undefined,
        unmixed: false,
        kmno4Frac: 0,
        hue: "water" as const,
        intensity: 0,
        rimDeposit: false,
      };
    }
    return {
      fillPct: prep.agua ? t.fillRel : Math.min(0.95, prep.kmno4Vol * VOLUME_TO_TUBE_FILL),
      color: "#CBEBF8",
      unmixed: false,
      kmno4Frac: 0,
      hue: "water" as const,
      intensity: 0,
      rimDeposit: prep.kmno4,
    };
  }

  if (bothDispensed && vortexed) {
    return {
      fillPct: t.fillRel,
      color: t.color,
      unmixed: false,
      kmno4Frac: 0,
      hue: "kmno4" as const,
      intensity: 1,
      rimDeposit: false,
    };
  }

  if (bothDispensed && !vortexed) {
    // Fracción exagerada (~30%) para que la capa de KMnO4 sea visible antes del vortex
    // (en la realidad es ~5%).
    return {
      fillPct: t.fillRel,
      color: undefined,
      unmixed: true,
      kmno4Frac: 0.3,
      hue: "water" as const,
      intensity: 0,
      rimDeposit: false,
    };
  }

  const totalDispensed = (prep.kmno4 ? prep.kmno4Vol : 0) + (prep.agua ? prep.aguaVol : 0);
  return {
    fillPct: Math.min(0.95, totalDispensed * VOLUME_TO_TUBE_FILL),
    color: prep.kmno4 && !prep.agua ? "#8815BD" : "#CBEBF8",
    unmixed: false,
    kmno4Frac: 0,
    hue: prep.kmno4 ? ("kmno4" as const) : ("water" as const),
    intensity: prep.kmno4 ? 0.85 : 0,
    rimDeposit: false,
  };
}

export function Module3({
  onComplete,
}: {
  onComplete: (score: number, details?: Record<string, unknown>) => void;
}) {
  const storageKey = "uct-prelab-draft-m3";

  const draft = useMemo(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return null;
  }, []);

  const [activeTab, setActiveTab] = useState<"preparar" | "diagnosticar" | "cuestionario">(
    draft?.activeTab ?? "preparar",
  );
  const [phase, setPhase] = useState<"prepare" | "classify">(
    draft?.phase ?? (draft?.activeTab === "diagnosticar" ? "classify" : "prepare"),
  );
  const [selected, setSelected] = useState(draft?.selected ?? M3_TUBES[0].id);
  const [reagent, setReagent] = useState<Reagent>(draft?.reagent ?? "kmno4");
  const [pipette, setPipette] = useState<PipetteModel>(draft?.pipette ?? "P100");
  const [pipetteVolumes, setPipetteVolumes] = useState<Record<PipetteModel, number>>(
    draft?.pipetteVolumes ?? {
      P20: PIPETTES.P20.min,
      P100: 100,
      P200: PIPETTES.P200.min,
      P1000: PIPETTES.P1000.min,
    },
  );
  const volume = pipetteVolumes[pipette];
  const setVolume = (v: number) => setPipetteVolumes((prev) => ({ ...prev, [pipette]: v }));
  const [technique, setTechnique] = useState<Technique>(draft?.technique ?? "forward");
  const [prepared, setPrepared] = useState<PrepState>(draft?.prepared ?? {});
  const [vortexed, setVortexed] = useState<Record<string, boolean>>(draft?.vortexed ?? {});
  const [feedback, setFeedback] = useState<string | null>(draft?.feedback ?? null);
  const [classifications, setClassifications] = useState<Record<string, ErrorTube["errorType"]>>(
    draft?.classifications ?? {},
  );
  const [submitted, setSubmitted] = useState(draft?.submitted ?? false);

  const handleTabChange = (tab: "preparar" | "diagnosticar" | "cuestionario") => {
    setActiveTab(tab);
    if (tab === "preparar") {
      setPhase("prepare");
    } else if (tab === "diagnosticar") {
      setPhase("classify");
    }
  };

  const [lastSaved, setLastSaved] = useState<string>(() => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  });

  useEffect(() => {
    try {
      const state = {
        phase,
        activeTab,
        selected,
        reagent,
        pipette,
        pipetteVolumes,
        technique,
        prepared,
        vortexed,
        feedback,
        classifications,
        submitted,
      };
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (e) {
      // ignore
    }
  }, [
    phase,
    activeTab,
    selected,
    reagent,
    pipette,
    pipetteVolumes,
    technique,
    prepared,
    vortexed,
    feedback,
    classifications,
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

  const tube = M3_TUBES.find((t) => t.id === selected) ?? M3_TUBES[0];
  const targetVolume = reagent === "kmno4" ? tube.kmno4 : tube.agua;
  const recommended = bestPipette(targetVolume);
  const prep = prepared[tube.id] ?? EMPTY_PREP;
  const allPrepared = M3_TUBES.every((t) => prepared[t.id]?.kmno4 && prepared[t.id]?.agua);
  const tubeVortexed = !!vortexed[tube.id];
  const allVortexed = M3_TUBES.every((t) => vortexed[t.id]);
  const canVortex = prep.kmno4 && prep.agua && !tubeVortexed;

  const allTubesReady = M3_TUBES.every((t) => {
    const p = prepared[t.id] ?? EMPTY_PREP;
    const kmno4Ok = reagentStatus(p, t.id, "kmno4") === "ok";
    const aguaOk = reagentStatus(p, t.id, "agua") === "ok";
    const vortexOk = !!vortexed[t.id];
    return kmno4Ok && aguaOk && vortexOk;
  });

  const score = useMemo(() => {
    const total = M3_TUBES.length;
    let correct = 0;
    for (const t of M3_TUBES) if (classifications[t.id] === t.errorType) correct++;
    return Math.round((correct / total) * 100);
  }, [classifications]);

  const allClassified = M3_TUBES.every((t) => classifications[t.id]);

  const buildM3Details = () => ({
    clasificaciones: M3_TUBES.map((t) => ({
      tubo: t.label,
      esperado: t.errorType,
      respuesta: classifications[t.id] ?? "—",
      correcto: classifications[t.id] === t.errorType,
    })),
    aciertos: M3_TUBES.filter((t) => classifications[t.id] === t.errorType).length,
    total: M3_TUBES.length,
  });
  const selectPipette = (model: PipetteModel) => {
    setPipette(model);
    setFeedback(null);
  };

  const dispense = () => {
    const okPipette = pipette === recommended;
    const okVolume = Math.abs(volume - targetVolume) <= (targetVolume < 20 ? 0.5 : 1);
    const expectedTech = expectedTechFor(tube.id, reagent);
    const okTech = technique === expectedTech;
    setPrepared((prev) => ({
      ...prev,
      [tube.id]: {
        ...(prev[tube.id] ?? EMPTY_PREP),
        [reagent]: true,
        [reagent === "kmno4" ? "kmno4Vol" : "aguaVol"]: volume,
        [reagent === "kmno4" ? "kmno4Tech" : "aguaTech"]: technique,
      },
    }));
    const baseOk = okPipette && okVolume && okTech;
    setFeedback(
      baseOk
        ? `${reagent === "kmno4" ? "KMnO₄" : "H₂O"} dispensado en ${tube.label} (${volume} µL, técnica ${technique === "forward" ? "normal" : "reverso"}).`
        : `Atención: revisa micropipeta (${recommended}), volumen objetivo (${targetVolume} µL) y técnica esperada (${expectedTech === "forward" ? "normal" : "reverso"}). El líquido se agregó igualmente.`,
    );
  };

  const resetTube = () => {
    setPrepared((prev) => {
      const next = { ...prev };
      delete next[tube.id];
      return next;
    });
    setVortexed((v) => {
      const next = { ...v };
      delete next[tube.id];
      return next;
    });
    setFeedback(`Tubo ${tube.label} reiniciado.`);
  };

  const tabs: Array<{
    id: "preparar" | "diagnosticar" | "cuestionario";
    label: string;
    unlocked: boolean;
  }> = [
    { id: "preparar", label: "1. Preparar Tubos", unlocked: true },
    { id: "diagnosticar", label: "2. Diagnóstico de Errores", unlocked: allTubesReady },
    { id: "cuestionario", label: "3. Cuestionario", unlocked: submitted },
  ];

  return (
    <div className="space-y-5">
      <div className="lab-panel p-4 text-xs text-muted-foreground sm:text-sm">
        <strong className="text-foreground">Objetivo:</strong> Reconocer y clasificar errores
        frecuentes de pipeteo (sistemáticos vs aleatorios) usando KMnO₄ como indicador visual.
        Prepara cada tubo respetando el volumen y la técnica correctos, compara su color con el
        CONTROL y diagnostica el tipo de error.
      </div>
      <div className="lab-panel p-4 text-xs text-muted-foreground sm:text-sm flex flex-wrap items-center justify-between gap-2">
        <div>
          <strong className="text-foreground">Stock:</strong> KMnO₄ acuoso ·{" "}
          <strong className="text-foreground">Volumen final:</strong> 950–1050 µL según réplica ·{" "}
          <strong className="text-foreground">Diluyente:</strong> H₂O destilada
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Progreso guardado (cada 25s) · {lastSaved}</span>
        </div>
      </div>

      {/* Pestañas de Actividades con diseño unificado estilo M4 */}
      <div className="flex flex-wrap gap-1 border-b border-border pb-px">
        {tabs.map((tab, idx) => {
          const active = activeTab === tab.id;

          // Determine if this tab is the "next pending" action
          const isNextPending =
            (tab.id === "preparar" && !allTubesReady) ||
            (tab.id === "diagnosticar" && allTubesReady && !submitted) ||
            (tab.id === "cuestionario" && submitted);

          return (
            <button
              key={tab.id}
              disabled={!tab.unlocked}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition duration-200 -mb-[2px] flex items-center gap-2 ${
                active
                  ? "border-primary text-primary bg-primary/[0.06] font-bold"
                  : isNextPending
                    ? "border-primary/40 text-primary bg-primary/[0.03] hover:text-primary hover:bg-primary/[0.06] hover:border-primary/60 cursor-pointer"
                    : tab.unlocked
                      ? "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 hover:bg-secondary/20 cursor-pointer"
                      : "border-transparent text-muted-foreground/30 cursor-not-allowed"
              }`}
            >
              <span>{tab.label}</span>
              {!tab.unlocked && <Lock className="h-3 w-3 text-muted-foreground/30" />}
              {tab.id === "preparar" && allTubesReady && (
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              )}
              {tab.id === "diagnosticar" && submitted && (
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              )}
              {isNextPending && !active && (tab.id !== "cuestionario" || !submitted) && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* PESTAÑAS 1 & 2: PREPARACIÓN Y DIAGNÓSTICO (TUBOS) */}
      <div className={activeTab !== "cuestionario" ? "space-y-5 block" : "hidden"}>
        <div className="lab-card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {activeTab === "preparar"
                  ? "Prepara cada tubo seleccionando micropipeta, volumen y técnica"
                  : "Clasifica el tipo de error de cada réplica"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {activeTab === "preparar"
                  ? "Dispensa KMnO₄ y H₂O por separado; la intensidad aparece al completar ambos líquidos."
                  : "Compara con el CONTROL y asigna error sistemático, aleatorio o ninguno."}
              </p>
            </div>
            {activeTab === "preparar" && (
              <button
                disabled={!allTubesReady}
                onClick={() => handleTabChange("diagnosticar")}
                title={
                  !allTubesReady
                    ? "Asegúrate de que todos los tubos tengan ✅ en KMnO₄, H₂O y Vortex"
                    : ""
                }
                className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
              >
                Continuar a clasificación
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
            {M3_TUBES.map((t) => {
              const visual = visualForTube(t, prepared[t.id], !!vortexed[t.id]);
              return (
                <Tube
                  key={t.id}
                  label={t.label}
                  intensity={visual.intensity}
                  fillPct={visual.fillPct}
                  hue={visual.hue}
                  color={visual.color}
                  unmixed={visual.unmixed}
                  kmno4Frac={visual.kmno4Frac}
                  rimDeposit={visual.rimDeposit}
                  selected={selected === t.id}
                  onClick={() => {
                    setSelected(t.id);
                    setFeedback(null);
                  }}
                />
              );
            })}
          </div>

          {activeTab === "preparar" && (
            <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_auto]">
              <div className="space-y-4">
                <div className="rounded-lg bg-secondary/60 p-3 text-xs text-foreground">
                  <strong>Tubo {tube.label}</strong>: objetivo actual {targetVolume} µL de{" "}
                  {reagent === "kmno4" ? "KMnO₄" : "H₂O"}.
                  <span className="ml-2 text-muted-foreground">
                    Estado: KMnO₄ {statusIcon(reagentStatus(prep, tube.id, "kmno4"))} · H₂O{" "}
                    {statusIcon(reagentStatus(prep, tube.id, "agua"))} · Vortex{" "}
                    {tubeVortexed ? "✅" : "⏳"}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Líquido
                    </div>
                    <div className="flex gap-2">
                      {(["kmno4", "agua"] as Reagent[]).map((r) => (
                        <button
                          key={r}
                          onClick={() => {
                            setReagent(r);
                            setFeedback(null);
                          }}
                          className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold ${reagent === r ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}
                        >
                          {r === "kmno4" ? "KMnO₄" : "H₂O"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Técnica
                    </div>
                    <div className="flex gap-2">
                      {(["forward", "reverse"] as Technique[]).map((t) => (
                        <button
                          key={t}
                          onClick={() => setTechnique(t)}
                          className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold ${technique === t ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}
                        >
                          {t === "forward" ? "Normal" : "Reverso"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Micropipeta
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {MODELS.map((m) => (
                        <button
                          key={m}
                          onClick={() => selectPipette(m)}
                          className={`rounded-md border px-2 py-2 text-xs font-semibold ${pipette === m ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-foreground"}`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={dispense}
                    className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
                  >
                    Dispensar en tubo {tube.label}
                  </button>
                  <button
                    onClick={() => {
                      setVortexed((v) => ({ ...v, [tube.id]: true }));
                      setFeedback(
                        `Tubo ${tube.label} vortexeado: los líquidos se mezclan homogéneamente.`,
                      );
                    }}
                    disabled={!canVortex}
                    className="rounded-md bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground disabled:opacity-50"
                  >
                    🌀 Vortexear {tube.label}
                  </button>
                  <button
                    onClick={resetTube}
                    className="rounded-md border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary"
                  >
                    ↺ Reiniciar {tube.label}
                  </button>
                </div>
                {feedback && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-md bg-secondary px-3 py-2 text-xs text-foreground"
                  >
                    {feedback}
                  </motion.div>
                )}
              </div>

              <div className="flex flex-col items-center gap-2">
                <Pipette model={pipette} volume={volume} hideReadout highlight />
                <VolumeAdjuster
                  model={pipette}
                  value={volume}
                  step={
                    pipette === "P20"
                      ? 0.5
                      : pipette === "P100"
                        ? 1
                        : pipette === "P200"
                          ? targetVolume % 5 === 0
                            ? 5
                            : 1
                          : 5
                  }
                  onChange={setVolume}
                  compact
                />
                <p className="text-center text-[10px] text-muted-foreground max-w-[180px]">
                  Lee el volumen en la ventana mecánica de la micropipeta.
                </p>
              </div>
            </div>
          )}
        </div>

        {activeTab === "diagnosticar" && (
          <div className="lab-card p-5">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Clasificación</h3>
            <div className="space-y-2">
              {M3_TUBES.map((t) => {
                const pick = classifications[t.id];
                const correct = pick === t.errorType;
                const showResult = submitted && !!pick;
                return (
                  <div
                    key={t.id}
                    className="grid items-center gap-2 rounded-lg border border-border bg-background p-3 sm:grid-cols-[80px_1fr_auto]"
                  >
                    <span className="font-mono text-sm font-bold text-foreground">
                      {t.label} {showResult ? (correct ? "✅" : "❌") : pick ? "•" : "⏳"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {showResult && !correct ? (
                        <>
                          Respuesta esperada:{" "}
                          <strong className="text-foreground capitalize">{t.errorType}</strong>.{" "}
                          {t.errorDesc}
                        </>
                      ) : (
                        t.errorDesc
                      )}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(["ninguno", "sistematico", "aleatorio"] as const).map((opt) => {
                        const isPick = pick === opt;
                        const cls =
                          showResult && isPick
                            ? correct
                              ? "bg-success text-success-foreground"
                              : "bg-destructive text-destructive-foreground"
                            : isPick
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-foreground hover:bg-secondary/70";
                        return (
                          <button
                            key={opt}
                            disabled={submitted}
                            onClick={() => setClassifications({ ...classifications, [t.id]: opt })}
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold capitalize transition disabled:cursor-not-allowed ${cls}`}
                          >
                            {showResult && isPick && (correct ? "✅ " : "❌ ")}
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {submitted
                  ? `Resultado: ${score}% (${M3_TUBES.filter((t) => classifications[t.id] === t.errorType).length}/${M3_TUBES.length} correctos).`
                  : `Selecciona una opción para cada tubo y luego revisa tus respuestas.`}
              </p>
              {!submitted ? (
                <button
                  disabled={!allClassified}
                  onClick={() => setSubmitted(true)}
                  className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                >
                  Verificar respuestas
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleTabChange("cuestionario");
                  }}
                  className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
                >
                  Continuar al Cuestionario
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* PESTAÑA 3: CUESTIONARIO */}
      <div className={activeTab === "cuestionario" ? "block" : "hidden"}>
        <JustifiedQuiz
          title="Actividad Experimental I — Errores de pipeteo"
          questions={M3_QUIZ}
          storageKey="uct-prelab-quiz-m3"
          onFinish={(quizScore) => {
            const final = Math.min(100, Math.round((score + quizScore) / 2));
            onComplete(final, {
              puntajePractica: score,
              puntajeQuiz: quizScore,
              ...buildM3Details(),
            });
          }}
        />
      </div>
    </div>
  );
}
