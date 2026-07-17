import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Check, X, AlertTriangle, ArrowRight, Lock } from "lucide-react";
import { QuizQuestion } from "@/components/lab/QuizQuestion";
import { QUESTIONS_M0, SAFETY_RULES } from "@/lib/lab-constants";
import { useLabStore } from "@/store/lab-store";

export function Module0({
  onComplete,
}: {
  onComplete: (score: number, details?: Record<string, unknown>) => void;
}) {
  const updateModule = useLabStore((s) => s.updateModule);
  const questions = useMemo(() => QUESTIONS_M0, []);

  const modProgress = useLabStore((s) => s.modules[0]);
  const isCompletedInStore = modProgress.completed;
  const historyArr = modProgress.history ?? [];
  const lastAttempt = historyArr.length > 0 ? historyArr[historyArr.length - 1] : undefined;

  const [idx, setIdx] = useState<number>(() => {
    if (isCompletedInStore) return QUESTIONS_M0.length;
    try {
      const saved = localStorage.getItem("uct-prelab-draft-m0");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.idx === "number") return parsed.idx;
      }
    } catch (e) {
      console.debug(e);
    }
    return 0;
  });

  const [correct, setCorrect] = useState<number>(() => {
    if (isCompletedInStore && typeof lastAttempt?.data?.aciertos === "number") {
      return lastAttempt.data.aciertos as number;
    }
    try {
      const saved = localStorage.getItem("uct-prelab-draft-m0");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.correct === "number") return parsed.correct;
      }
    } catch (e) {
      console.debug(e);
    }
    return 0;
  });

  const [acknowledged, setAcknowledged] = useState<boolean>(() => {
    if (isCompletedInStore) return true;
    try {
      const saved = localStorage.getItem("uct-prelab-draft-m0");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.acknowledged === "boolean") return parsed.acknowledged;
      }
    } catch (e) {
      console.debug(e);
    }
    return false;
  });

  const [answers, setAnswers] = useState<Record<number, number>>(() => {
    if (isCompletedInStore && lastAttempt?.data?.answers) {
      return lastAttempt.data.answers as Record<number, number>;
    }
    try {
      const saved = localStorage.getItem("uct-prelab-draft-m0");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.answers) return parsed.answers;
      }
    } catch (e) {
      console.debug(e);
    }
    return {};
  });

  const [submitted, setSubmitted] = useState<boolean>(() => {
    if (isCompletedInStore) return true;
    try {
      const saved = localStorage.getItem("uct-prelab-draft-m0");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.submitted === "boolean") return parsed.submitted;
      }
    } catch (e) {
      console.debug(e);
    }
    return false;
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        "uct-prelab-draft-m0",
        JSON.stringify({
          idx,
          correct,
          acknowledged,
          answers,
          submitted,
        }),
      );
    } catch (e) {
      console.debug(e);
    }
  }, [idx, correct, acknowledged, answers, submitted]);

  const [reviewMode, setReviewMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"seguridad" | "diagnostico">(() => {
    if (isCompletedInStore) return "diagnostico";
    return acknowledged ? "diagnostico" : "seguridad";
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        "uct-prelab-draft-m0",
        JSON.stringify({
          idx,
          correct,
          acknowledged,
          answers,
          submitted,
        }),
      );
    } catch (e) {
      console.debug(e);
    }
  }, [idx, correct, acknowledged, answers, submitted]);

  const score = Math.round((correct / questions.length) * 100);

  const tabs = [
    { id: "seguridad" as const, label: "1. Bioseguridad", unlocked: true },
    { id: "diagnostico" as const, label: "2. Evaluación Diagnóstica", unlocked: acknowledged },
  ];

  if (submitted && !reviewMode) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Finished
          score={score}
          correct={correct}
          total={questions.length}
          onComplete={() => {
            setSubmitted(true);
            onComplete(score, { aciertos: correct, totalPreguntas: questions.length, answers });
          }}
          showButton={!isCompletedInStore && !submitted}
          title="Módulo 0 Completado"
        />
        <div className="mx-auto max-w-lg text-center">
          <button
            onClick={() => {
              setReviewMode(true);
              setActiveTab("diagnostico");
            }}
            className="text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            🔬 Volver a la mesa de trabajo para revisar tus respuestas y las reglas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {submitted && reviewMode && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs">
          <span className="text-foreground font-medium">
            🔬 Modo Revisión: Puedes examinar las reglas de bioseguridad y tus respuestas al
            diagnóstico.
          </span>
          <button
            onClick={() => setReviewMode(false)}
            className="rounded-md bg-primary px-3 py-1 font-semibold text-primary-foreground text-[11px] cursor-pointer"
          >
            Volver al Resumen
          </button>
        </div>
      )}

      {/* Pestañas de Actividades con diseño unificado estilo M4 */}
      <div className="flex flex-wrap gap-1 border-b border-border pb-px">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          const isNextPending =
            (tab.id === "seguridad" && !acknowledged) ||
            (tab.id === "diagnostico" && acknowledged && !submitted);

          return (
            <button
              key={tab.id}
              disabled={!tab.unlocked}
              onClick={() => setActiveTab(tab.id)}
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
              {tab.id === "seguridad" && acknowledged && (
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              )}
              {tab.id === "diagnostico" && submitted && (
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              )}
              {isNextPending && !active && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeTab === "seguridad" && (
        <div className="lab-card mx-auto max-w-2xl p-6 sm:p-8 space-y-4">
          <div className="rounded-lg border border-border bg-secondary/40 p-3 text-xs text-muted-foreground sm:text-sm">
            <strong className="text-foreground">Objetivo:</strong> Diagnosticar tus conocimientos
            previos sobre micropipetas, rangos de volumen, diluciones y bioseguridad antes de
            comenzar las actividades experimentales.
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Antes de comenzar — Bioseguridad
          </h2>
          <p className="text-sm text-muted-foreground">
            Recuerda estas reglas que aplicarán en el laboratorio presencial.
          </p>
          <ul className="space-y-2">
            {SAFETY_RULES.map((r) => (
              <li key={r} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                {r}
              </li>
            ))}
          </ul>
          {!acknowledged && (
            <button
              onClick={() => {
                setAcknowledged(true);
                setActiveTab("diagnostico");
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 cursor-pointer"
            >
              Entendido, comenzar diagnóstico
            </button>
          )}
          {acknowledged && (
            <div className="text-success text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Ya has confirmado la lectura de las normas de
              bioseguridad.
            </div>
          )}
        </div>
      )}

      {activeTab === "diagnostico" && (
        <div className="mx-auto max-w-2xl space-y-6">
          {submitted || idx >= questions.length ? (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-foreground mt-4 px-1">
                Revisión de tus Respuestas
              </h3>
              {questions.map((q, qIdx) => {
                const picked = answers[qIdx];
                const isCorrect = picked === q.correct;
                return (
                  <div key={qIdx} className="lab-card p-5 border border-border space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="chip">Pregunta {qIdx + 1}</span>
                      <span
                        className={`font-semibold ${isCorrect ? "text-success" : "text-destructive"}`}
                      >
                        {isCorrect ? "Correcto" : "Incorrecto"}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-foreground">{q.prompt}</h4>
                    <div className="grid gap-2 text-xs">
                      {q.options.map((opt, oIdx) => {
                        const isPicked = picked === oIdx;
                        const isRight = oIdx === q.correct;
                        return (
                          <div
                            key={oIdx}
                            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left ${
                              isRight
                                ? "border-success bg-success/10 text-foreground"
                                : isPicked
                                  ? "border-destructive bg-destructive/10 text-foreground"
                                  : "border-border bg-background text-muted-foreground"
                            }`}
                          >
                            <span
                              className={`grid h-5 w-5 place-items-center rounded-full border text-[10px] font-bold ${
                                isRight
                                  ? "border-success bg-success text-success-foreground"
                                  : isPicked
                                    ? "border-destructive bg-destructive text-destructive-foreground"
                                    : "border-border bg-secondary text-muted-foreground"
                              }`}
                            >
                              {isRight ? (
                                <Check className="h-3 w-3" />
                              ) : isPicked ? (
                                <X className="h-3 w-3" />
                              ) : (
                                String.fromCharCode(65 + oIdx)
                              )}
                            </span>
                            <span>{opt}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground border border-border">
                      <span className="font-semibold block text-foreground mb-0.5">
                        Explicación:
                      </span>
                      {q.explanation}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <QuizQuestion
              key={idx}
              q={questions[idx]}
              index={idx}
              total={questions.length}
              onAnswered={(ok, pickedIdx) => {
                setAnswers((prev) => ({ ...prev, [idx]: pickedIdx }));
                updateModule(0, { attempts: idx + 1, errors: idx + 1 - (correct + (ok ? 1 : 0)) });
                if (ok) setCorrect(correct + 1);
                setIdx(idx + 1);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

export function Finished({
  score,
  correct,
  total,
  onComplete,
  title = "Módulo completado",
  showButton = true,
}: {
  score: number;
  correct: number;
  total: number;
  onComplete: () => void;
  title?: string;
  showButton?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="lab-card mx-auto max-w-lg p-8 text-center"
    >
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success/15 text-success">
        <CheckCircle2 className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-xl font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Acertaste {correct} de {total}.
      </p>
      <div className="my-4 text-4xl font-bold text-primary">
        {score}
        <span className="text-base text-muted-foreground">/100</span>
      </div>
      {showButton && (
        <button
          onClick={onComplete}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 cursor-pointer"
        >
          Guardar y continuar
        </button>
      )}
    </motion.div>
  );
}
