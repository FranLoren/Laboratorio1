import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Pipette } from "@/components/lab/Pipette";
import { VolumeAdjuster, pipetteStep } from "@/components/lab/VolumeAdjuster";
import { PIPETTES, type PipetteModel } from "@/lib/lab-constants";
import { Finished } from "./Module0";
import { ChevronRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useLabStore } from "@/store/lab-store";

type Activity = "lectura" | "ajuste" | "seleccion" | "punta";

const ALL_MODELS: PipetteModel[] = ["P1000", "P20", "P200", "P100"];

const ALL_SCENARIOS: { volume: number; correct: PipetteModel; desc: string }[] = [
  { volume: 850, correct: "P1000", desc: "Transferir 850 µL de solución acuosa entre tubos." },
  { volume: 5, correct: "P20", desc: "Transferir 5 µL de solución coloreada a un tubo Khan." },
  { volume: 150, correct: "P200", desc: "Dispensar 150 µL de diluyente en una mezcla." },
  { volume: 75, correct: "P100", desc: "Transferir 75 µL de reactivo a un tubo rotulado." },
  { volume: 18, correct: "P20", desc: "Transferir 18 µL de muestra concentrada a un tubo." },
  { volume: 450, correct: "P1000", desc: "Dispensar 450 µL de buffer en un tubo de reacción." },
  { volume: 90, correct: "P100", desc: "Transferir 90 µL de reactivo a un tubo de mezcla." },
  { volume: 30, correct: "P200", desc: "Dispensar 30 µL de solución coloreada en un tubo." },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const TIP_CHOICES = [
  { id: "white", label: "Blanca" },
  { id: "blue", label: "Azul" },
  { id: "yellow", label: "Amarilla" },
];

const TIP_TARGETS: { volume: number; expected: string }[] = [
  { volume: 12.5, expected: "white" },
  { volume: 180, expected: "yellow" },
  { volume: 750, expected: "blue" },
];

type LecturaAnswer = { model: PipetteModel; real: number; guess: number; ok: boolean };
type AjusteAnswer = { model: PipetteModel; target: number; adjusted: number; ok: boolean };
type SeleccionAnswer = {
  desc: string;
  volume: number;
  correct: PipetteModel;
  selected: PipetteModel;
  ok: boolean;
};
type PuntaAnswer = { volume: number; expected: string; selected: string; ok: boolean };

type Module1Answers = {
  lectura: LecturaAnswer[];
  ajuste: AjusteAnswer[];
  seleccion: SeleccionAnswer[];
  punta: PuntaAnswer[];
};

export function Module1({
  onComplete,
}: {
  onComplete: (score: number, details?: Record<string, unknown>) => void;
}) {
  const modProgress = useLabStore((s) => s.modules[1]);
  const isCompletedInStore = modProgress.completed;
  const historyArr = modProgress.history ?? [];
  const lastAttempt = historyArr.length > 0 ? historyArr[historyArr.length - 1] : undefined;

  const [reviewMode, setReviewMode] = useState(false);

  const [activity, setActivity] = useState<Activity>(() => {
    try {
      const saved = localStorage.getItem("uct-prelab-draft-m1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.activity) return parsed.activity;
      }
    } catch (e) {
      console.debug(e);
    }
    return "lectura";
  });

  const [done, setDone] = useState<Record<Activity, number>>(() => {
    if (isCompletedInStore && lastAttempt?.data?.subactividades) {
      return lastAttempt.data.subactividades as Record<Activity, number>;
    }
    try {
      const saved = localStorage.getItem("uct-prelab-draft-m1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.done) return parsed.done;
      }
    } catch (e) {
      console.debug(e);
    }
    return {
      lectura: -1,
      ajuste: -1,
      seleccion: -1,
      punta: -1,
    };
  });

  const [submitted, setSubmitted] = useState<boolean>(() => {
    if (isCompletedInStore) return true;
    try {
      const saved = localStorage.getItem("uct-prelab-draft-m1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.submitted === "boolean") return parsed.submitted;
      }
    } catch (e) {
      console.debug(e);
    }
    return false;
  });

  const [answers, setAnswers] = useState<Module1Answers>(() => {
    if (isCompletedInStore && lastAttempt?.data?.respuestas_detalladas) {
      return lastAttempt.data.respuestas_detalladas as Module1Answers;
    }
    try {
      const saved = localStorage.getItem("uct-prelab-draft-m1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.answers) return parsed.answers;
      }
    } catch (e) {
      console.debug(e);
    }
    return {
      lectura: [],
      ajuste: [],
      seleccion: [],
      punta: [],
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        "uct-prelab-draft-m1",
        JSON.stringify({
          activity,
          done,
          submitted,
          answers,
        }),
      );
    } catch (e) {
      console.debug(e);
    }
  }, [activity, done, submitted, answers]);

  const setActivityScore = useCallback((activityName: Activity, score: number) => {
    setDone((prev) => (prev[activityName] === score ? prev : { ...prev, [activityName]: score }));
  }, []);

  const totalScore = Math.round(
    ((done.lectura > 0 ? done.lectura : 0) +
      (done.ajuste > 0 ? done.ajuste : 0) +
      (done.seleccion > 0 ? done.seleccion : 0) +
      (done.punta > 0 ? done.punta : 0)) /
      4,
  );

  const completedAll = Object.values(done).every((d) => d >= 0);

  if (submitted && !reviewMode) {
    return (
      <div className="space-y-4">
        <Finished
          score={totalScore}
          correct={totalScore}
          total={100}
          onComplete={() => {
            onComplete(totalScore, {
              subactividades: {
                lectura: done.lectura,
                ajuste: done.ajuste,
                seleccion: done.seleccion,
                punta: done.punta,
              },
              respuestas_detalladas: answers,
            });
          }}
          title="Micropipetas dominadas"
          showButton={!isCompletedInStore}
        />
        <div className="mx-auto max-w-lg text-center">
          <button
            onClick={() => setReviewMode(true)}
            className="text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            🔬 Volver a revisar tus resultados por actividad (Modo Lectura)
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "lectura" as Activity, label: "1. Lectura de volumen" },
    { id: "ajuste" as Activity, label: "2. Ajuste de volumen" },
    { id: "seleccion" as Activity, label: "3. Selección de micropipeta" },
    { id: "punta" as Activity, label: "4. Selección de punta" },
  ];

  const firstPendingId = tabs.find((t) => done[t.id] < 0)?.id;

  return (
    <div className="space-y-5">
      {submitted && reviewMode && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs">
          <span className="text-foreground font-medium">
            🔬 Modo Revisión (Lectura): Estás visualizando tus respuestas guardadas para este módulo
            de manera segura.
          </span>
          <button
            onClick={() => setReviewMode(false)}
            className="rounded-md bg-primary px-3 py-1 font-semibold text-primary-foreground text-[11px] cursor-pointer"
          >
            Volver al Resumen
          </button>
        </div>
      )}

      <div className="lab-panel p-4 text-xs text-muted-foreground sm:text-sm">
        <strong className="text-foreground">Objetivo:</strong> Identificar los modelos de
        micropipeta (P20, P100, P200, P1000), leer y ajustar el volumen dentro del rango operativo,
        seleccionar la micropipeta correcta para cada volumen y asociar cada modelo con su punta
        compatible.
      </div>

      {/* Pestañas de Actividades con diseño unificado estilo M4 */}
      <div className="flex flex-wrap gap-1 border-b border-border pb-px">
        {tabs.map((tab, idx) => {
          const active = activity === tab.id;
          const isCompleted = done[tab.id] >= 0;
          const isPreviousCompleted = idx === 0 || done[tabs[idx - 1].id] >= 0;
          const isNextPending = tab.id === firstPendingId;

          return (
            <button
              key={tab.id}
              disabled={!isPreviousCompleted && !reviewMode}
              onClick={() => setActivity(tab.id)}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition duration-200 -mb-[2px] flex items-center gap-2 ${
                active
                  ? "border-primary text-primary bg-primary/[0.06] font-bold"
                  : isNextPending && !reviewMode
                    ? "border-primary/40 text-primary bg-primary/[0.03] hover:text-primary hover:bg-primary/[0.06] hover:border-primary/60 cursor-pointer"
                    : isPreviousCompleted || reviewMode
                      ? "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 hover:bg-secondary/20 cursor-pointer"
                      : "border-transparent text-muted-foreground/30 cursor-not-allowed"
              }`}
            >
              <span>{tab.label}</span>
              {isCompleted && (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-bold text-success">
                  {done[tab.id]}/100
                </span>
              )}
              {isNextPending && !isCompleted && !reviewMode && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activity === "lectura" && (
        <ActivityLectura
          onScore={(s) => setActivityScore("lectura", s)}
          savedScore={done.lectura}
          answers={answers.lectura}
          onSaveAnswer={(ans) =>
            setAnswers((prev) => ({ ...prev, lectura: [...prev.lectura, ans] }))
          }
          onResetAnswers={() => setAnswers((prev) => ({ ...prev, lectura: [] }))}
          onNextActivity={() => setActivity("ajuste")}
          reviewMode={submitted}
        />
      )}
      {activity === "ajuste" && (
        <ActivityAjuste
          onScore={(s) => setActivityScore("ajuste", s)}
          savedScore={done.ajuste}
          answers={answers.ajuste}
          onSaveAnswer={(ans) => setAnswers((prev) => ({ ...prev, ajuste: [...prev.ajuste, ans] }))}
          onResetAnswers={() => setAnswers((prev) => ({ ...prev, ajuste: [] }))}
          onNextActivity={() => setActivity("seleccion")}
          reviewMode={submitted}
        />
      )}
      {activity === "seleccion" && (
        <ActivitySeleccion
          onScore={(s) => setActivityScore("seleccion", s)}
          savedScore={done.seleccion}
          answers={answers.seleccion}
          onSaveAnswer={(ans) =>
            setAnswers((prev) => ({ ...prev, seleccion: [...prev.seleccion, ans] }))
          }
          onResetAnswers={() => setAnswers((prev) => ({ ...prev, seleccion: [] }))}
          onNextActivity={() => setActivity("punta")}
          reviewMode={submitted}
        />
      )}
      {activity === "punta" && (
        <ActivityPunta
          onScore={(s) => setActivityScore("punta", s)}
          savedScore={done.punta}
          answers={answers.punta}
          onSaveAnswer={(ans) => setAnswers((prev) => ({ ...prev, punta: [...prev.punta, ans] }))}
          onResetAnswers={() => setAnswers((prev) => ({ ...prev, punta: [] }))}
          onCompleteModule={() => {
            setSubmitted(true);
            onComplete(totalScore, {
              subactividades: {
                lectura: done.lectura,
                ajuste: done.ajuste,
                seleccion: done.seleccion,
                punta: done.punta,
              },
              respuestas_detalladas: answers,
            });
          }}
          reviewMode={submitted}
        />
      )}
    </div>
  );
}

function activityLabel(a: Activity) {
  return {
    lectura: "Lectura de volumen",
    ajuste: "Ajuste de volumen",
    seleccion: "Selección de micropipeta",
    punta: "Selección de punta",
  }[a];
}

/* ---------- Actividad 1: Lectura ---------- */
function ActivityLectura({
  onScore,
  savedScore,
  answers,
  onSaveAnswer,
  onResetAnswers,
  onNextActivity,
  reviewMode,
}: {
  onScore: (s: number) => void;
  savedScore?: number;
  answers: LecturaAnswer[];
  onSaveAnswer: (ans: LecturaAnswer) => void;
  onResetAnswers: () => void;
  onNextActivity: () => void;
  reviewMode?: boolean;
}) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(savedScore !== undefined && savedScore >= 0);
  const rounds = [
    { model: "P200" as PipetteModel, real: 125 },
    { model: "P1000" as PipetteModel, real: 750 },
    { model: "P100" as PipetteModel, real: 47 },
  ];
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState<null | { ok: boolean; msg: string }>(null);

  const finished = round >= rounds.length;
  const final = Math.round((score / rounds.length) * 100);
  useEffect(() => {
    if (finished) {
      onScore(final);
      setIsCompleted(true);
    }
  }, [finished, final]);

  useEffect(() => {
    setIsCompleted(savedScore !== undefined && savedScore >= 0);
  }, [savedScore]);

  if (isCompleted) {
    return (
      <div className="lab-card p-6 text-foreground space-y-4">
        <p className="font-semibold text-success flex items-center justify-center gap-1.5 text-base">
          <CheckCircle2 className="h-5 w-5" /> Actividad completada con éxito
        </p>
        <p className="text-center text-sm text-muted-foreground">
          Puntaje obtenido: <strong className="text-foreground">{savedScore ?? final}/100</strong>
        </p>

        <div className="rounded-lg border border-border overflow-hidden mt-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-secondary text-muted-foreground border-b border-border">
                <th className="p-3 font-semibold">Intento</th>
                <th className="p-3 font-semibold">Ejercicio</th>
                <th className="p-3 font-semibold">Modelo</th>
                <th className="p-3 font-semibold text-right">Volumen Real</th>
                <th className="p-3 font-semibold text-right">Tu Lectura</th>
                <th className="p-3 font-semibold text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {answers &&
                answers.map((ans, idx) => {
                  const intentoNum = Math.floor(idx / 3) + 1;
                  const ejercicioNum = (idx % 3) + 1;
                  return (
                    <tr
                      key={idx}
                      className="border-b border-border/50 last:border-0 hover:bg-secondary/35"
                    >
                      <td className="p-3 font-medium text-primary">Intento #{intentoNum}</td>
                      <td className="p-3 font-medium">Ejercicio {ejercicioNum}</td>
                      <td className="p-3 font-mono">{ans.model}</td>
                      <td className="p-3 text-right font-mono">{ans.real} µL</td>
                      <td className="p-3 text-right font-mono">{ans.guess} µL</td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] ${ans.ok ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}
                        >
                          {ans.ok ? "Correcto" : "Incorrecto"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-center gap-3 pt-2">
          {!reviewMode && (
            <button
              onClick={() => {
                setIsCompleted(false);
                setRound(0);
                setScore(0);
                setGuess("");
                setFeedback(null);
                // Preserve answers for attempt column accumulation
              }}
              className="rounded-lg bg-secondary text-foreground border border-border px-4 py-2 text-xs font-semibold hover:bg-secondary/80 cursor-pointer"
            >
              Repetir actividad
            </button>
          )}
          <button
            onClick={onNextActivity}
            className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:bg-primary/90 cursor-pointer"
          >
            {reviewMode ? "Siguiente Actividad" : "Guardar y continuar"}
          </button>
        </div>
      </div>
    );
  }

  const r = rounds[round];
  if (!r) return null;

  return (
    <div className="lab-card grid items-center gap-6 p-6 md:grid-cols-[auto_1fr]">
      <Pipette model={r.model} volume={r.real} hideReadout />
      <div>
        <h3 className="text-base font-semibold text-foreground">¿Qué volumen muestra el visor?</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Lee la pantalla mecánica de la micropipeta {r.model}.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <input
            type="number"
            step="0.1"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="µL"
            className="w-32 rounded-md border border-input bg-background px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none"
          />
          <button
            disabled={!guess}
            onClick={() => {
              const v = Number(guess);
              const ok = Math.abs(v - r.real) <= 1;
              if (ok) setScore(score + 1);
              onSaveAnswer({ model: r.model, real: r.real, guess: v, ok });
              setFeedback({
                ok,
                msg: ok ? "Lectura correcta." : `Lectura esperada: ${r.real} µL.`,
              });
            }}
            className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50 cursor-pointer"
          >
            Verificar
          </button>
        </div>
        {feedback && (
          <div
            className={`mt-3 rounded-md px-3 py-2 text-xs ${feedback.ok ? "bg-success/10 text-success" : "bg-warning/10 text-warning-foreground"}`}
          >
            {feedback.msg}
            <button
              onClick={() => {
                setRound(round + 1);
                setGuess("");
                setFeedback(null);
              }}
              className="ml-3 font-semibold underline cursor-pointer"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Actividad 2: Ajuste de dial ---------- */
function ActivityAjuste({
  onScore,
  savedScore,
  answers,
  onSaveAnswer,
  onResetAnswers,
  onNextActivity,
  reviewMode,
}: {
  onScore: (s: number) => void;
  savedScore?: number;
  answers: AjusteAnswer[];
  onSaveAnswer: (ans: AjusteAnswer) => void;
  onResetAnswers: () => void;
  onNextActivity: () => void;
  reviewMode?: boolean;
}) {
  const targets = [
    { model: "P20" as PipetteModel, target: 12.5 },
    { model: "P200" as PipetteModel, target: 175 },
    { model: "P1000" as PipetteModel, target: 600 },
  ];
  const [round, setRound] = useState(0);
  const [vol, setVol] = useState(targets[0].model === "P20" ? 10 : PIPETTES[targets[0].model].min);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<null | string>(null);
  const [isCompleted, setIsCompleted] = useState(savedScore !== undefined && savedScore >= 0);

  const finished = round >= targets.length;
  const final = Math.round((score / targets.length) * 100);
  useEffect(() => {
    if (finished) {
      onScore(final);
      setIsCompleted(true);
    }
  }, [finished, final]);

  useEffect(() => {
    setIsCompleted(savedScore !== undefined && savedScore >= 0);
  }, [savedScore]);

  if (isCompleted) {
    return (
      <div className="lab-card p-6 text-foreground space-y-4">
        <p className="font-semibold text-success flex items-center justify-center gap-1.5 text-base">
          <CheckCircle2 className="h-5 w-5" /> Actividad completada con éxito
        </p>
        <p className="text-center text-sm text-muted-foreground">
          Puntaje obtenido: <strong className="text-foreground">{savedScore ?? final}/100</strong>
        </p>

        <div className="rounded-lg border border-border overflow-hidden mt-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-secondary text-muted-foreground border-b border-border">
                <th className="p-3 font-semibold">Intento</th>
                <th className="p-3 font-semibold">Ejercicio</th>
                <th className="p-3 font-semibold">Modelo</th>
                <th className="p-3 font-semibold text-right">Volumen Objetivo</th>
                <th className="p-3 font-semibold text-right">Tu Ajuste</th>
                <th className="p-3 font-semibold text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {answers &&
                answers.map((ans, idx) => {
                  const intentoNum = Math.floor(idx / 3) + 1;
                  const ejercicioNum = (idx % 3) + 1;
                  return (
                    <tr
                      key={idx}
                      className="border-b border-border/50 last:border-0 hover:bg-secondary/35"
                    >
                      <td className="p-3 font-medium text-primary">Intento #{intentoNum}</td>
                      <td className="p-3 font-medium">Ejercicio {ejercicioNum}</td>
                      <td className="p-3 font-mono">{ans.model}</td>
                      <td className="p-3 text-right font-mono">{ans.target} µL</td>
                      <td className="p-3 text-right font-mono">{ans.adjusted} µL</td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] ${ans.ok ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}
                        >
                          {ans.ok ? "Correcto" : "Incorrecto"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-center gap-3 pt-2">
          {!reviewMode && (
            <button
              onClick={() => {
                setIsCompleted(false);
                setRound(0);
                setScore(0);
                setVol(targets[0].model === "P20" ? 10 : PIPETTES[targets[0].model].min);
                setFeedback(null);
                // Preserve answers for attempt column accumulation
              }}
              className="rounded-lg bg-secondary text-foreground border border-border px-4 py-2 text-xs font-semibold hover:bg-secondary/80 cursor-pointer"
            >
              Repetir actividad
            </button>
          )}
          <button
            onClick={onNextActivity}
            className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:bg-primary/90 cursor-pointer"
          >
            {reviewMode ? "Siguiente Actividad" : "Guardar y continuar"}
          </button>
        </div>
      </div>
    );
  }

  const t = targets[round];
  if (!t) return null;
  const step = pipetteStep(t.model, t.target);

  return (
    <div className="lab-card grid items-center gap-6 p-6 md:grid-cols-[auto_1fr]">
      <Pipette model={t.model} volume={vol} highlight hideReadout />
      <div>
        <h3 className="text-base font-semibold text-foreground">
          Ajusta el volumen a <span className="text-primary">{t.target} µL</span>
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Gira el dial cuidadosamente hasta que el visor mecánico coincida con el objetivo.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <VolumeAdjuster model={t.model} value={vol} step={step} onChange={setVol} />
          <button
            onClick={() => {
              const ok = Math.abs(vol - t.target) < step;
              if (ok) setScore(score + 1);
              onSaveAnswer({ model: t.model, target: t.target, adjusted: vol, ok });
              setFeedback(
                ok
                  ? "Volumen correctamente ajustado."
                  : `Te alejaste del objetivo (${t.target} µL).`,
              );
            }}
            className="ml-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground cursor-pointer"
          >
            Confirmar
          </button>
        </div>

        {feedback && (
          <div className="mt-3 rounded-md bg-secondary px-3 py-2 text-xs text-foreground">
            {feedback}
            <button
              onClick={() => {
                setRound(round + 1);
                const nm = targets[round + 1]?.model;
                if (nm) setVol(PIPETTES[nm].min);
                setFeedback(null);
              }}
              className="ml-3 font-semibold text-primary underline cursor-pointer"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Actividad 3: Selección ---------- */
function ActivitySeleccion({
  onScore,
  savedScore,
  answers,
  onSaveAnswer,
  onResetAnswers,
  onNextActivity,
  reviewMode,
}: {
  onScore: (s: number) => void;
  savedScore?: number;
  answers: SeleccionAnswer[];
  onSaveAnswer: (ans: SeleccionAnswer) => void;
  onResetAnswers: () => void;
  onNextActivity: () => void;
  reviewMode?: boolean;
}) {
  const [rounds] = useState(() => shuffle(ALL_SCENARIOS).slice(0, 3));
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<null | { ok: boolean; msg: string }>(null);
  const [modelsOrder, setModelsOrder] = useState<PipetteModel[]>(() => shuffle(ALL_MODELS));
  const [isCompleted, setIsCompleted] = useState(savedScore !== undefined && savedScore >= 0);

  const finished = round >= rounds.length;
  const final = Math.round((score / rounds.length) * 100);
  useEffect(() => {
    if (finished) {
      onScore(final);
      setIsCompleted(true);
    }
  }, [finished, final]);

  useEffect(() => {
    setIsCompleted(savedScore !== undefined && savedScore >= 0);
  }, [savedScore]);

  if (isCompleted) {
    return (
      <div className="lab-card p-6 text-foreground space-y-4">
        <p className="font-semibold text-success flex items-center justify-center gap-1.5 text-base">
          <CheckCircle2 className="h-5 w-5" /> Actividad completada con éxito
        </p>
        <p className="text-center text-sm text-muted-foreground">
          Puntaje obtenido: <strong className="text-foreground">{savedScore ?? final}/100</strong>
        </p>

        <div className="rounded-lg border border-border overflow-hidden mt-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-secondary text-muted-foreground border-b border-border">
                <th className="p-3 font-semibold">Intento</th>
                <th className="p-3 font-semibold">Ejercicio</th>
                <th className="p-3 font-semibold">Descripción</th>
                <th className="p-3 font-semibold text-right">Volumen</th>
                <th className="p-3 font-semibold">Tu Elección</th>
                <th className="p-3 font-semibold">Correcta</th>
                <th className="p-3 font-semibold text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {answers &&
                answers.map((ans, idx) => {
                  const intentoNum = Math.floor(idx / 3) + 1;
                  const ejercicioNum = (idx % 3) + 1;
                  return (
                    <tr
                      key={idx}
                      className="border-b border-border/50 last:border-0 hover:bg-secondary/35"
                    >
                      <td className="p-3 font-medium text-primary">Intento #{intentoNum}</td>
                      <td className="p-3 font-medium">Ejercicio {ejercicioNum}</td>
                      <td className="p-3 text-muted-foreground">{ans.desc}</td>
                      <td className="p-3 text-right font-mono">{ans.volume} µL</td>
                      <td
                        className={`p-3 font-mono font-semibold ${ans.ok ? "text-success" : "text-destructive"}`}
                      >
                        {ans.selected}
                      </td>
                      <td className="p-3 font-mono text-muted-foreground">{ans.correct}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] ${ans.ok ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}
                        >
                          {ans.ok ? "Correcto" : "Incorrecto"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-center gap-3 pt-2">
          {!reviewMode && (
            <button
              onClick={() => {
                setIsCompleted(false);
                setRound(0);
                setScore(0);
                setFeedback(null);
                setModelsOrder(shuffle(ALL_MODELS));
                // Preserve answers for attempt column accumulation
              }}
              className="rounded-lg bg-secondary text-foreground border border-border px-4 py-2 text-xs font-semibold hover:bg-secondary/80 cursor-pointer"
            >
              Repetir actividad
            </button>
          )}
          <button
            onClick={onNextActivity}
            className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:bg-primary/90 cursor-pointer"
          >
            {reviewMode ? "Siguiente Actividad" : "Guardar y continuar"}
          </button>
        </div>
      </div>
    );
  }

  const s = rounds[round];
  if (!s) return null;

  return (
    <div className="lab-card p-6">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Escenario {round + 1}/{rounds.length}
      </div>
      <h3 className="mt-1 text-base font-semibold text-foreground">{s.desc}</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Volumen requerido:{" "}
        <span className="font-mono font-bold text-foreground">{s.volume} µL</span>
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {modelsOrder.map((m) => (
          <button
            key={m}
            disabled={feedback !== null}
            onClick={() => {
              const ok = m === s.correct;
              if (ok) setScore(score + 1);
              onSaveAnswer({ desc: s.desc, volume: s.volume, correct: s.correct, selected: m, ok });
              setFeedback({
                ok,
                msg: ok
                  ? `${m} es la elección óptima.`
                  : `${m} no es la opción más adecuada para transferir ${s.volume} µL.`,
              });
            }}
            className="lab-card flex flex-col items-center gap-1 p-3 transition hover:border-primary cursor-pointer"
          >
            <Pipette
              model={m}
              volume={(PIPETTES[m].min + PIPETTES[m].max) / 2}
              size={220}
              hideReadout
              hideModelLabel
            />
          </button>
        ))}
      </div>
      {feedback && (
        <div
          className={`mt-4 rounded-md px-3 py-2 text-xs ${feedback.ok ? "bg-success/10 text-success" : "bg-warning/10 text-warning-foreground"}`}
        >
          {!feedback.ok && <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />}
          {feedback.msg}
          <button
            onClick={() => {
              setRound(round + 1);
              setFeedback(null);
              setModelsOrder(shuffle(ALL_MODELS));
            }}
            className="ml-3 inline-flex items-center gap-1 font-semibold underline cursor-pointer"
          >
            Siguiente <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- Actividad 4: Selección de punta ---------- */
function ActivityPunta({
  onScore,
  savedScore,
  answers,
  onSaveAnswer,
  onResetAnswers,
  onCompleteModule,
  reviewMode,
}: {
  onScore: (s: number) => void;
  savedScore?: number;
  answers: PuntaAnswer[];
  onSaveAnswer: (ans: PuntaAnswer) => void;
  onResetAnswers: () => void;
  onCompleteModule?: () => void;
  reviewMode?: boolean;
}) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(savedScore !== undefined && savedScore >= 0);

  const finished = round >= TIP_TARGETS.length;
  const final = Math.round((score / TIP_TARGETS.length) * 100);
  useEffect(() => {
    if (finished) {
      onScore(final);
      setIsCompleted(true);
    }
  }, [finished, final]);

  useEffect(() => {
    setIsCompleted(savedScore !== undefined && savedScore >= 0);
  }, [savedScore]);

  if (isCompleted) {
    const formatColor = (c: string) => {
      const colors: Record<string, string> = {
        white: "Blanca ⚪",
        yellow: "Amarilla 🟡",
        blue: "Azul 🔵",
      };
      return colors[c] || c;
    };
    return (
      <div className="lab-card p-6 text-foreground space-y-4">
        <p className="font-semibold text-success flex items-center justify-center gap-1.5 text-base">
          <CheckCircle2 className="h-5 w-5" /> Actividad completada con éxito
        </p>
        <p className="text-center text-sm text-muted-foreground">
          Puntaje obtenido: <strong className="text-foreground">{savedScore ?? final}/100</strong>
        </p>

        <div className="rounded-lg border border-border overflow-hidden mt-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-secondary text-muted-foreground border-b border-border">
                <th className="p-3 font-semibold">Intento</th>
                <th className="p-3 font-semibold">Ejercicio</th>
                <th className="p-3 font-semibold text-right">Volumen</th>
                <th className="p-3 font-semibold">Tu Elección</th>
                <th className="p-3 font-semibold">Compatible</th>
                <th className="p-3 font-semibold text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {answers &&
                answers.map((ans, idx) => {
                  const intentoNum = Math.floor(idx / 3) + 1;
                  const ejercicioNum = (idx % 3) + 1;
                  return (
                    <tr
                      key={idx}
                      className="border-b border-border/50 last:border-0 hover:bg-secondary/35"
                    >
                      <td className="p-3 font-medium text-primary">Intento #{intentoNum}</td>
                      <td className="p-3 font-medium">Ejercicio {ejercicioNum}</td>
                      <td className="p-3 text-right font-mono">{ans.volume} µL</td>
                      <td
                        className={`p-3 font-semibold ${ans.ok ? "text-success" : "text-destructive"}`}
                      >
                        {formatColor(ans.selected)}
                      </td>
                      <td className="p-3 text-muted-foreground">{formatColor(ans.expected)}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] ${ans.ok ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}
                        >
                          {ans.ok ? "Correcto" : "Incorrecto"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-center gap-3 pt-2">
          {!reviewMode && (
            <button
              onClick={() => {
                setIsCompleted(false);
                setRound(0);
                setScore(0);
                setPicked(null);
                // Preserve answers for attempt column accumulation
              }}
              className="rounded-lg bg-secondary text-foreground border border-border px-4 py-2 text-xs font-semibold hover:bg-secondary/80 cursor-pointer"
            >
              Repetir actividad
            </button>
          )}
          {onCompleteModule && !reviewMode && (
            <button
              onClick={onCompleteModule}
              className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:bg-primary/90 cursor-pointer"
            >
              Guardar y continuar
            </button>
          )}
        </div>
      </div>
    );
  }

  const target = TIP_TARGETS[round];
  if (!target) return null;

  return (
    <div className="lab-card p-6">
      <h3 className="text-base font-semibold text-foreground">
        Selecciona la punta compatible para transferir{" "}
        <span className="text-primary">{target.volume} µL</span>
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Elige solo por el color visible de la punta.
      </p>
      <div className="mt-5 grid grid-cols-3 gap-3">
        {TIP_CHOICES.map((tip) => (
          <button
            key={tip.id}
            onClick={() => setPicked(tip.id)}
            className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition cursor-pointer ${
              picked === tip.id ? "border-primary bg-primary/5" : "border-border hover:bg-secondary"
            }`}
          >
            <Tip color={tip.id as "white" | "yellow" | "blue"} />
            <span className="text-xs font-semibold text-foreground">{tip.label}</span>
          </button>
        ))}
      </div>
      {picked && (
        <div className="mt-4 flex items-center gap-3 rounded-md bg-secondary px-3 py-2 text-xs text-foreground">
          {picked === target.expected ? (
            <span className="text-success">Compatible para ese volumen.</span>
          ) : (
            <span className="text-warning-foreground">Incompatible para ese volumen.</span>
          )}
          <button
            onClick={() => {
              const ok = picked === target.expected;
              if (ok) setScore(score + 1);
              onSaveAnswer({
                volume: target.volume,
                expected: target.expected,
                selected: picked,
                ok,
              });
              setPicked(null);
              setRound(round + 1);
            }}
            className="ml-auto rounded-md bg-primary px-3 py-1 font-semibold text-primary-foreground cursor-pointer"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}

function Tip({ color }: { color: "white" | "yellow" | "blue" }) {
  const fill =
    color === "white"
      ? "oklch(0.98 0.005 220)"
      : color === "yellow"
        ? "oklch(0.88 0.16 88)"
        : "oklch(0.62 0.16 245)";
  const h = color === "white" ? 50 : color === "yellow" ? 70 : 90;
  return (
    <svg viewBox="0 0 40 100" width="36" height="90">
      <path
        d={`M 12 0 L 28 0 L ${28 - h * 0.1} ${h} L ${12 + h * 0.1} ${h} Z`}
        fill={fill}
        opacity="0.9"
        stroke="oklch(0.4 0.04 255)"
      />
      <path
        d={`M 18 ${h} L 22 ${h} L 20 100 Z`}
        fill="oklch(0.95 0.01 220)"
        stroke="oklch(0.7 0.01 220)"
      />
    </svg>
  );
}
