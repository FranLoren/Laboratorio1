import { useState, useEffect } from "react";
import { FINAL_REFLECTION_PROMPTS } from "@/lib/lab-constants";
import { Finished } from "./Module0";
import { useLabStore } from "@/store/lab-store";

export function Module7({
  onComplete,
}: {
  onComplete: (score: number, details?: Record<string, unknown>) => void;
}) {
  const modProgress = useLabStore((s) => s.modules[7]);
  const isCompletedInStore = modProgress?.completed ?? false;
  const historyArr = modProgress?.history ?? [];
  const lastAttempt = historyArr.length > 0 ? historyArr[historyArr.length - 1] : undefined;

  const [reviewMode, setReviewMode] = useState<boolean>(false);

  const [idx, setIdx] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("uct-prelab-draft-m7");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.idx === "number") return parsed.idx;
      }
    } catch (e) {
      console.debug(e);
    }
    return 0;
  });

  const [answers, setAnswers] = useState<string[]>(() => {
    if (isCompletedInStore && Array.isArray(lastAttempt?.data?.respuestas)) {
      return (lastAttempt.data.respuestas as { respuesta?: string }[]).map(
        (r) => r.respuesta || "",
      );
    }
    try {
      const saved = localStorage.getItem("uct-prelab-draft-m7");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.answers)) return parsed.answers;
      }
    } catch (e) {
      console.debug(e);
    }
    return Array(FINAL_REFLECTION_PROMPTS.length).fill("");
  });

  const [submitted, setSubmitted] = useState<boolean>(() => {
    if (isCompletedInStore) return true;
    try {
      const saved = localStorage.getItem("uct-prelab-draft-m7");
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
        "uct-prelab-draft-m7",
        JSON.stringify({
          idx: Math.min(idx, FINAL_REFLECTION_PROMPTS.length - 1),
          answers,
          submitted,
        }),
      );
    } catch (e) {
      console.debug(e);
    }
  }, [idx, answers, submitted]);

  const completed = answers.filter((a) => a.trim().length >= 80).length;
  const score = Math.round((completed / FINAL_REFLECTION_PROMPTS.length) * 100);
  const details = {
    respuestas: FINAL_REFLECTION_PROMPTS.map((pregunta, i) => ({
      pregunta,
      respuesta: answers[i],
      caracteres: answers[i].trim().length,
    })),
  };

  if (submitted && !reviewMode) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Finished
          score={score}
          correct={completed}
          total={FINAL_REFLECTION_PROMPTS.length}
          onComplete={() => {
            setSubmitted(true);
            onComplete(score, details);
          }}
          title="Evaluación final"
          showButton={!isCompletedInStore}
        />

        <div className="mx-auto max-w-lg text-center">
          <button
            onClick={() => setReviewMode(true)}
            className="text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            🔬 Volver a la mesa de trabajo para revisar tus reflexiones (Modo Lectura)
          </button>
        </div>

        {/* Written reflections review list */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-foreground mt-4 px-1">
            Resumen de tus Respuestas Guardadas
          </h3>
          {FINAL_REFLECTION_PROMPTS.map((pregunta, i) => (
            <div key={i} className="lab-card p-5 border border-border space-y-2">
              <span className="chip text-[10px]">Reflexión {i + 1}</span>
              <h4 className="text-sm font-semibold text-foreground leading-snug">{pregunta}</h4>
              <p className="rounded-lg bg-secondary/40 p-4 text-xs text-foreground leading-relaxed whitespace-pre-wrap border border-border">
                {answers[i] || <span className="italic text-muted-foreground">No respondido</span>}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const tabs = FINAL_REFLECTION_PROMPTS.map((_, i) => ({
    id: i,
    label: `Reflexión #${i + 1}`,
  }));

  const firstPendingId = answers.findIndex((ans) => ans.trim().length < 80);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {submitted && reviewMode && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs">
          <span className="text-foreground font-medium">
            🔬 Modo Revisión (Lectura): Estás visualizando tus reflexiones guardadas de manera
            segura.
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
        <strong className="text-foreground">Objetivo:</strong> Integrar los aprendizajes de todos
        los módulos mediante preguntas de reflexión que conectan técnica de pipeteo, errores
        experimentales y cálculos de dilución con la interpretación de los resultados obtenidos.
      </div>

      {/* Unified Tab format */}
      <div className="flex flex-wrap gap-1 border-b border-border pb-px">
        {tabs.map((tab, i) => {
          const active = idx === tab.id;
          const isCompleted = answers[tab.id].trim().length >= 80;
          const isPreviousCompleted = i === 0 || answers[i - 1].trim().length >= 80;
          const isNextPending = tab.id === firstPendingId;

          return (
            <button
              key={tab.id}
              disabled={!isPreviousCompleted && !reviewMode}
              onClick={() => setIdx(tab.id)}
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
                  Listo
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

      <div className="lab-card p-5 sm:p-6">
        <div className="mb-3 flex items-center justify-between text-xs">
          <span className="chip">
            Pregunta {idx + 1} / {FINAL_REFLECTION_PROMPTS.length}
          </span>
          <span className="text-muted-foreground">integración final</span>
        </div>
        <h3 className="text-base font-semibold leading-snug text-foreground sm:text-lg">
          {FINAL_REFLECTION_PROMPTS[idx]}
        </h3>
        <textarea
          value={answers[idx]}
          onChange={(e) =>
            setAnswers((prev) => prev.map((a, i) => (i === idx ? e.target.value : a)))
          }
          disabled={reviewMode}
          rows={7}
          className="mt-4 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none disabled:opacity-85"
          placeholder="Redacta tu respuesta integrando cálculos, observaciones y técnica experimental."
        />
        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
          <span>
            {answers[idx].trim().length} caracteres {reviewMode ? "" : "(mínimo 80)"}
          </span>
          {!reviewMode && (
            <button
              disabled={answers[idx].trim().length < 80}
              onClick={() => {
                if (idx < FINAL_REFLECTION_PROMPTS.length - 1) {
                  setIdx(idx + 1);
                } else {
                  setSubmitted(true);
                  onComplete(score, details);
                }
              }}
              className="rounded-md bg-primary px-4 py-1.5 font-semibold text-primary-foreground disabled:opacity-50 cursor-pointer"
            >
              {idx < FINAL_REFLECTION_PROMPTS.length - 1 ? "Continuar" : "Finalizar Evaluación"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
