import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Pipette } from "@/components/lab/Pipette";
import { Check, Lock, CheckCircle2 } from "lucide-react";
import { JustifiedQuiz } from "@/components/lab/JustifiedQuiz";
import { M4_QUIZ } from "@/lib/quiz-questions";

type Technique = "forward" | "reverse";
type Liquid = "agua" | "glicerol";

const DENSITIES: Record<Liquid, number> = { agua: 1.0, glicerol: 1.261 };
const TARGET_VOL_uL = 500;

type RowKey = "fwd-gli" | "rev-gli" | "fwd-agua" | "rev-agua";

const ROWS: { key: RowKey; tech: Technique; liquid: Liquid; label: string }[] = [
  { key: "fwd-gli", tech: "forward", liquid: "glicerol", label: "Normal · Glicerol" },
  { key: "rev-gli", tech: "reverse", liquid: "glicerol", label: "Reverso · Glicerol" },
  { key: "fwd-agua", tech: "forward", liquid: "agua", label: "Normal · Agua" },
  { key: "rev-agua", tech: "reverse", liquid: "agua", label: "Reverso · Agua" },
];

// Réplicas experimentales reales (g) — se convierten a mg y se aplica un jitter ±5%.
const REPLICAS_g: Record<RowKey, [number, number, number]> = {
  "fwd-gli": [0.483, 0.474, 0.491],
  "rev-gli": [0.641, 0.643, 0.654],
  "fwd-agua": [0.503, 0.502, 0.499],
  "rev-agua": [0.563, 0.598, 0.586],
};

function modelForVolume(volume: number) {
  if (volume <= 20) return "P20" as const;
  if (volume <= 100) return "P100" as const;
  if (volume <= 200) return "P200" as const;
  return "P1000" as const;
}

/** Devuelve la masa (mg) simulada para la réplica idx (0..2). */
function simulateMass_mg(key: RowKey, idx: number): number {
  const base_mg = REPLICAS_g[key][idx] * 1000;
  const noise = (Math.random() - 0.5) * 0.1; // ±5%
  return +(base_mg * (1 + noise)).toFixed(2);
}

type RowState = {
  replicas: (number | null)[]; // R1, R2, R3 en mg
  avgInput: string; // promedio calculado por el alumno
  teoricaInput: string; // masa teórica calculada por el alumno
  errInput: string; // error % calculado por el alumno
};

const emptyRow = (): RowState => ({
  replicas: [null, null, null],
  avgInput: "",
  teoricaInput: "",
  errInput: "",
});

export function Module4({
  onComplete,
}: {
  onComplete: (score: number, details?: Record<string, unknown>) => void;
}) {
  const storageKey = "uct-prelab-draft-m4";

  const draft = useMemo(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return null;
  }, []);

  const [data, setData] = useState<Record<RowKey, RowState>>(() => {
    if (draft?.data) {
      // Migrate old drafts if they don't have teoricaInput
      const migrated = { ...draft.data };
      for (const key of Object.keys(migrated)) {
        if (migrated[key] && migrated[key].teoricaInput === undefined) {
          migrated[key] = { ...migrated[key], teoricaInput: "" };
        }
      }
      return migrated;
    }
    return {
      "fwd-gli": emptyRow(),
      "rev-gli": emptyRow(),
      "fwd-agua": emptyRow(),
      "rev-agua": emptyRow(),
    };
  });

  const [activeTab, setActiveTab] = useState<"practica" | "cuestionario">(() => {
    if (draft?.activeTab === "cuestionario") return "cuestionario";
    return "practica";
  });

  const [submitted, setSubmitted] = useState<boolean>(draft?.submitted ?? false);

  const [lastSaved, setLastSaved] = useState<string>(() => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          data,
          activeTab,
          submitted,
        }),
      );
    } catch (e) {
      // ignore
    }
  }, [data, activeTab, submitted]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setLastSaved(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      );
    }, 25000);
    return () => clearInterval(interval);
  }, []);

  const weigh = (row: (typeof ROWS)[number]) => {
    setData((prev) => {
      const r = prev[row.key];
      const idx = r.replicas.findIndex((v) => v === null);
      if (idx === -1) return prev;
      const next = [...r.replicas];
      next[idx] = simulateMass_mg(row.key, idx);
      return { ...prev, [row.key]: { ...r, replicas: next } };
    });
  };

  const reset = (key: RowKey) => setData((prev) => ({ ...prev, [key]: emptyRow() }));

  /** Mide cuántas filas tienen 3 réplicas, promedio, masa teórica y error correctamente calculados (±10% prom, ±2% teo, ±10% err). */
  const scoring = useMemo(() => {
    let okRows = 0;
    let avgOk = 0;
    let teoricaOk = 0;
    let errOk = 0;
    let filledRows = 0;
    for (const row of ROWS) {
      const r = data[row.key];
      const teorica_mg = TARGET_VOL_uL * DENSITIES[row.liquid];
      const fullReps = r.replicas.every((v) => v !== null);
      if (fullReps) filledRows++;
      if (!fullReps) continue;
      const masses = r.replicas as number[];
      const realAvg = masses.reduce((a, b) => a + b, 0) / masses.length;
      const realErr = Math.abs((realAvg - teorica_mg) / teorica_mg) * 100;

      const userAvg = Number(r.avgInput);
      const userTeorica = Number(r.teoricaInput ?? "");
      const userErr = Number(r.errInput);

      const avgOkVal = r.avgInput && Math.abs(userAvg - realAvg) / realAvg <= 0.1;
      const teoricaOkVal =
        r.teoricaInput && Math.abs(userTeorica - teorica_mg) / teorica_mg <= 0.02; // ±2% tolerance
      const errOkVal = r.errInput && Math.abs(userErr - realErr) <= Math.max(0.5, realErr * 0.1);

      if (avgOkVal) avgOk++;
      if (teoricaOkVal) teoricaOk++;
      if (errOkVal) errOk++;
      if (avgOkVal && teoricaOkVal && errOkVal) okRows++;
    }
    return { okRows, avgOk, teoricaOk, errOk, filledRows };
  }, [data]);

  const allFilled = scoring.filledRows === ROWS.length;
  const score = Math.round(
    ((scoring.avgOk + scoring.teoricaOk + scoring.errOk) / (ROWS.length * 3)) * 100,
  );
  const canFinish = allFilled && scoring.okRows === ROWS.length;

  const buildM4Details = () => ({
    filas: ROWS.map((row) => {
      const r = data[row.key];
      return {
        tecnica: row.label,
        replicas_mg: r.replicas,
        promedio_mg: r.avgInput || null,
        teorica_mg: r.teoricaInput || null,
        error_pct: r.errInput || null,
      };
    }),
  });

  const handleTabChange = (tab: "practica" | "cuestionario") => {
    setActiveTab(tab);
  };

  const tabs: Array<{
    id: "practica" | "cuestionario";
    label: string;
    unlocked: boolean;
  }> = [
    { id: "practica", label: "1. Actividad Práctica", unlocked: true },
    { id: "cuestionario", label: "2. Cuestionario", unlocked: submitted },
  ];

  return (
    <div className="space-y-5">
      <div className="lab-panel p-4 text-xs text-muted-foreground sm:text-sm flex flex-wrap items-center justify-between gap-2">
        <div>
          <strong className="text-foreground">Objetivo:</strong> Comparar la exactitud del pipeteo
          normal vs reverso para agua y glicerol pipeteando{" "}
          <strong className="text-foreground">{TARGET_VOL_uL} µL</strong> por réplica. Pesa 3
          réplicas por técnica, calcula tú mismo la{" "}
          <strong className="text-foreground">masa promedio</strong> y el{" "}
          <strong className="text-foreground">error absoluto %</strong>. Se acepta hasta ±10%
          respecto al valor real.
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

          // Determine if this tab is the next pending action
          const isNextPending =
            (tab.id === "practica" && !submitted) || (tab.id === "cuestionario" && submitted);

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
              {tab.id === "practica" && submitted && (
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

      {/* PESTAÑA 1: ACTIVIDAD PRÁCTICA */}
      <div className={activeTab === "practica" ? "space-y-5 block" : "hidden"}>
        <div className="lab-card p-5">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Balanza analítica virtual — {TARGET_VOL_uL} µL por réplica
            </h3>
            <p className="text-xs text-muted-foreground">
              Dispensa 3 réplicas para cada combinación de técnica y líquido para pesar la masa
              transferida.
            </p>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-4">
            {ROWS.map((row) => {
              const r = data[row.key];
              const next = r.replicas.findIndex((v) => v === null);
              const filled = next === -1;
              return (
                <div
                  key={row.key}
                  className="rounded-lg border border-border bg-background p-3 text-xs"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <strong className="text-foreground">{row.label}</strong>
                    <span className="text-muted-foreground">{filled ? "✓" : `R${next + 1}`}</span>
                  </div>
                  <div className="grid place-items-center">
                    <Pipette
                      model={modelForVolume(TARGET_VOL_uL)}
                      volume={TARGET_VOL_uL}
                      size={120}
                      hideReadout
                    />
                  </div>
                  <button
                    disabled={filled || submitted}
                    onClick={() => weigh(row)}
                    className="mt-2 w-full rounded-md bg-[var(--color-kmno4)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {filled ? "Réplicas completas" : `Dispensar y pesar R${next + 1}`}
                  </button>
                  {filled && !submitted && (
                    <button
                      onClick={() => reset(row.key)}
                      className="mt-1 w-full text-[10px] text-muted-foreground underline"
                    >
                      Reiniciar réplicas
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="lab-card p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Tabla de resultados</h3>
            <p className="text-xs text-muted-foreground">
              Registra las réplicas pesadas, calcula la masa teórica para cada caso, y completa el
              promedio y el error absoluto % en cada fila.
            </p>
          </div>

          <div className="mb-4 text-xs text-muted-foreground bg-secondary/30 p-3 rounded-lg border border-border">
            <span className="font-semibold block text-foreground mb-1">
              Cálculo de Masa Teórica:
            </span>
            Usa la densidad de cada líquido para calcular la masa teórica correspondiente a un
            volumen de <strong className="text-foreground">{TARGET_VOL_uL} µL</strong>:
            <ul className="list-disc pl-4 mt-1 space-y-0.5">
              <li>
                <strong>Agua destilada:</strong> densidad = 1.00 g/mL (1.00 mg/µL)
              </li>
              <li>
                <strong>Glicerol:</strong> densidad = 1.261 g/mL (1.261 mg/µL)
              </li>
            </ul>
            <p className="mt-1.5 italic">
              Fórmula: Masa teórica (mg) = Volumen (µL) × Densidad (mg/µL)
            </p>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[760px] text-xs">
              <thead className="bg-secondary text-muted-foreground">
                <tr>
                  <th className="px-2 py-2 text-left">Técnica</th>
                  <th className="px-2 py-2 text-right">R1 (mg)</th>
                  <th className="px-2 py-2 text-right">R2 (mg)</th>
                  <th className="px-2 py-2 text-right">R3 (mg)</th>
                  <th className="px-2 py-2 text-right">Promedio (mg)</th>
                  <th className="px-2 py-2 text-right">Masa teórica (mg)</th>
                  <th className="px-2 py-2 text-right">Error (%)</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => {
                  const r = data[row.key];
                  const teorica_mg = TARGET_VOL_uL * DENSITIES[row.liquid];
                  const filled = r.replicas.every((v) => v !== null);
                  const realAvg = filled
                    ? (r.replicas as number[]).reduce((a, b) => a + b, 0) / 3
                    : 0;
                  const realErr = filled ? Math.abs((realAvg - teorica_mg) / teorica_mg) * 100 : 0;
                  const userAvg = Number(r.avgInput);
                  const userTeorica = Number(r.teoricaInput ?? "");
                  const userErr = Number(r.errInput);
                  const avgOk = r.avgInput && Math.abs(userAvg - realAvg) / realAvg <= 0.1;
                  const teoricaOk =
                    r.teoricaInput && Math.abs(userTeorica - teorica_mg) / teorica_mg <= 0.02;
                  const errOk =
                    r.errInput && Math.abs(userErr - realErr) <= Math.max(0.5, realErr * 0.1);
                  return (
                    <tr key={row.key} className="border-t border-border">
                      <td className="px-2 py-2 text-foreground font-medium">{row.label}</td>
                      {r.replicas.map((v, i) => (
                        <td key={i} className="px-2 py-2 text-right font-mono text-foreground">
                          {v === null ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            v.toFixed(2)
                          )}
                        </td>
                      ))}
                      {/* PROMEDIO (mg) */}
                      <td className="px-2 py-2 text-right">
                        <input
                          type="number"
                          step="0.01"
                          disabled={!filled || submitted}
                          value={r.avgInput}
                          onChange={(e) =>
                            setData((p) => ({
                              ...p,
                              [row.key]: { ...p[row.key], avgInput: e.target.value },
                            }))
                          }
                          className={`w-24 rounded-md border bg-background px-2 py-1 text-right font-mono text-xs disabled:opacity-50 ${
                            r.avgInput
                              ? avgOk
                                ? "border-success"
                                : "border-destructive"
                              : "border-input"
                          }`}
                          placeholder="—"
                        />
                      </td>
                      {/* MASA TEÓRICA (mg) (INPUT calculated by student using density) */}
                      <td className="px-2 py-2 text-right">
                        <input
                          type="number"
                          step="0.01"
                          disabled={!filled || submitted}
                          value={r.teoricaInput ?? ""}
                          onChange={(e) =>
                            setData((p) => ({
                              ...p,
                              [row.key]: { ...p[row.key], teoricaInput: e.target.value },
                            }))
                          }
                          className={`w-24 rounded-md border bg-background px-2 py-1 text-right font-mono text-xs disabled:opacity-50 ${
                            r.teoricaInput
                              ? teoricaOk
                                ? "border-success"
                                : "border-destructive"
                              : "border-input"
                          }`}
                          placeholder="Calcular..."
                        />
                      </td>
                      {/* ERROR (%) */}
                      <td className="px-2 py-2 text-right">
                        <input
                          type="number"
                          step="0.01"
                          disabled={!filled || submitted}
                          value={r.errInput}
                          onChange={(e) =>
                            setData((p) => ({
                              ...p,
                              [row.key]: { ...p[row.key], errInput: e.target.value },
                            }))
                          }
                          className={`w-20 rounded-md border bg-background px-2 py-1 text-right font-mono text-xs disabled:opacity-50 ${
                            r.errInput
                              ? errOk
                                ? "border-success"
                                : "border-destructive"
                              : "border-input"
                          }`}
                          placeholder="—"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 flex flex-wrap items-center justify-between gap-4 text-xs"
          >
            <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
              <span>
                Filas correctas:{" "}
                <strong className="text-foreground font-semibold">
                  {scoring.okRows}/{ROWS.length}
                </strong>
              </span>
              <span>
                Promedios:{" "}
                <strong className="text-foreground">
                  {scoring.avgOk}/{ROWS.length}
                </strong>
              </span>
              <span>
                Masa teórica:{" "}
                <strong className="text-foreground font-semibold">
                  {scoring.teoricaOk}/{ROWS.length}
                </strong>
              </span>
              <span>
                Errores:{" "}
                <strong className="text-foreground font-semibold">
                  {scoring.errOk}/{ROWS.length}
                </strong>
              </span>
            </div>
            {!submitted ? (
              <button
                disabled={!canFinish}
                onClick={() => {
                  setSubmitted(true);
                }}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50 transition cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" /> Finalizar práctica y verificar resultados
              </button>
            ) : (
              <button
                onClick={() => {
                  handleTabChange("cuestionario");
                }}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition cursor-pointer"
              >
                Continuar al Cuestionario
              </button>
            )}
          </motion.div>

          {submitted && (
            <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg text-xs sm:text-sm flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="font-semibold block">¡Logro Práctico Completado!</span>
                Has registrado y calculado todas las réplicas, masas teóricas y errores
                correctamente. Ya puedes continuar con el cuestionario final.
              </div>
              <button
                onClick={() => handleTabChange("cuestionario")}
                className="px-3 py-1.5 bg-emerald-500 text-white rounded-md font-semibold text-xs hover:bg-emerald-600 transition cursor-pointer"
              >
                Ir al Cuestionario
              </button>
            </div>
          )}
        </div>
      </div>

      {/* PESTAÑA 2: CUESTIONARIO */}
      <div className={activeTab === "cuestionario" ? "block" : "hidden"}>
        <JustifiedQuiz
          title="Actividad Experimental II — Pipeteo normal y reverso"
          questions={M4_QUIZ}
          storageKey="uct-prelab-quiz-m4"
          onFinish={(quizScore) => {
            const final = Math.min(100, Math.round((score + quizScore) / 2));
            onComplete(final, {
              puntajePractica: score,
              puntajeQuiz: quizScore,
              ...buildM4Details(),
            });
          }}
        />
      </div>
    </div>
  );
}
