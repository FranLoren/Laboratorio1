import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle } from "lucide-react";
import type { JustifiedQuestion } from "@/lib/quiz-questions";

type Selection = { answer: number | null; justification: number | null };
const LETTER = (i: number) => String.fromCharCode(65 + i);

export function JustifiedQuiz({
  title,
  questions,
  onFinish,
  storageKey,
}: {
  title: string;
  questions: JustifiedQuestion[];
  onFinish: (scorePct: number) => void;
  storageKey?: string;
}) {
  const [idx, setIdx] = useState<number>(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(`${storageKey}-idx`);
        if (saved) {
          const num = Number(saved);
          if (!isNaN(num) && num >= 0 && num < questions.length) {
            return num;
          }
        }
      } catch (e) {
        // ignore
      }
    }
    return 0;
  });

  const [picks, setPicks] = useState<Selection[]>(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(`${storageKey}-picks`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length === questions.length) {
            return parsed;
          }
        }
      } catch (e) {
        // ignore
      }
    }
    return questions.map(() => ({ answer: null, justification: null }));
  });

  const [warn, setWarn] = useState<string | null>(null);

  const [submitted, setSubmitted] = useState<boolean>(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(`${storageKey}-submitted`);
        if (saved) {
          return JSON.parse(saved) === true;
        }
      } catch (e) {
        // ignore
      }
    }
    return false;
  });

  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(`${storageKey}-idx`, String(idx));
      localStorage.setItem(`${storageKey}-picks`, JSON.stringify(picks));
      localStorage.setItem(`${storageKey}-submitted`, JSON.stringify(submitted));
    } catch (e) {
      // ignore
    }
  }, [storageKey, idx, picks, submitted]);

  const q = questions[idx];
  const cur = picks[idx];
  const allAnswered = picks.every((p) => p.answer !== null && p.justification !== null);

  const setPick = (patch: Partial<Selection>) => {
    setPicks((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
    setWarn(null);
  };

  const goto = (next: number) => {
    if (cur.answer === null || cur.justification === null) {
      setWarn("⚠️ Debe seleccionar una respuesta y una justificación antes de continuar.");
      return;
    }
    setWarn(null);
    setIdx(Math.max(0, Math.min(questions.length - 1, next)));
  };

  const finalize = () => {
    if (!allAnswered) {
      setWarn("⚠️ Debe seleccionar una respuesta y una justificación antes de continuar.");
      return;
    }
    setSubmitted(true);
  };

  // Cada pregunta vale: 0.5 respuesta + 0.5 justificación
  const correctPoints = picks.reduce((acc, p, i) => {
    const q = questions[i];
    let s = 0;
    if (p.answer === q.correctAnswer) s += 0.5;
    if (p.justification === q.correctJustification) s += 0.5;
    return acc + s;
  }, 0);
  const scorePct = Math.round((correctPoints / questions.length) * 100);

  if (submitted) {
    return (
      <div className="space-y-4">
        <div className="lab-card p-5">
          <h3 className="text-base font-semibold text-foreground">{title} — Retroalimentación</h3>
          <p className="text-xs text-muted-foreground">
            Puntaje del cuestionario: <strong className="text-foreground">{scorePct}/100</strong>
          </p>
        </div>

        {questions.map((qq, i) => {
          const p = picks[i];
          const ansOk = p.answer === qq.correctAnswer;
          const jusOk = p.justification === qq.correctJustification;
          const bothOk = ansOk && jusOk;
          return (
            <div key={qq.id} className="lab-card p-5">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="chip">
                  Pregunta {i + 1} / {questions.length}
                </span>
                <span className={`font-semibold ${bothOk ? "text-success" : "text-destructive"}`}>
                  {bothOk ? "✅ Correcto" : "❌ Incorrecto"}
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground">{qq.prompt}</p>

              <div className="mt-3 grid gap-2 text-xs">
                <div className="rounded-md border border-border bg-background p-2.5">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Tu respuesta
                  </div>
                  <div className={ansOk ? "text-success" : "text-destructive"}>
                    {p.answer !== null ? `${LETTER(p.answer)}. ${qq.answers[p.answer]}` : "—"}{" "}
                    {ansOk ? "✅" : "❌"}
                  </div>
                </div>
                <div className="rounded-md border border-border bg-background p-2.5">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Tu justificación
                  </div>
                  <div className={jusOk ? "text-success" : "text-destructive"}>
                    {p.justification !== null
                      ? `${LETTER(p.justification)}. ${qq.justifications[p.justification]}`
                      : "—"}{" "}
                    {jusOk ? "✅" : "❌"}
                  </div>
                </div>
                <div className="rounded-md border border-success/40 bg-success/10 p-2.5">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Respuesta correcta
                  </div>
                  <div className="text-foreground">
                    {LETTER(qq.correctAnswer)}. {qq.answers[qq.correctAnswer]}
                  </div>
                  <div className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                    Justificación correcta
                  </div>
                  <div className="text-foreground">
                    {LETTER(qq.correctJustification)}. {qq.justifications[qq.correctJustification]}
                  </div>
                  <div className="mt-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                    Explicación
                  </div>
                  <div className="text-foreground">{qq.explanation}</div>
                </div>
              </div>
            </div>
          );
        })}

        <div className="flex justify-end">
          <button
            onClick={() => {
              onFinish(scorePct);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <CheckCircle2 className="h-4 w-4" /> Guardar y continuar
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5">
      <div className="lab-card p-5 sm:p-7 bg-card border-4 border-border shadow-[0_8px_0_var(--border)]">
        <div className="mb-4 flex items-center justify-between text-xs">
          <span className="rounded-full bg-primary px-3.5 py-1 text-xs font-extrabold text-primary-foreground tracking-wide uppercase">
            Pregunta {idx + 1} / {questions.length}
          </span>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground uppercase tracking-wide">
            {title}
          </span>
        </div>

        <h3 className="text-lg font-extrabold leading-snug text-foreground sm:text-xl md:text-2xl font-display my-4 pb-3 border-b border-dashed border-border text-center">
          {q.prompt}
        </h3>

        <div className="mt-6">
          <div className="text-xs font-extrabold uppercase tracking-widest text-primary/80 mb-3 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            1. Seleccione una respuesta
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {q.answers.map((opt, i) => {
              const selected = cur.answer === i;
              return (
                <label
                  key={i}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-b-4 px-4 py-3 text-sm transition-all duration-150 relative ${
                    selected
                      ? "border-primary bg-primary/10 text-foreground font-extrabold translate-y-[2px] shadow-[0_2px_0_var(--color-primary)]"
                      : "border-border bg-background hover:border-primary/40 hover:bg-secondary/40 hover:translate-y-[-1px] shadow-[0_4px_0_var(--color-border)] text-foreground"
                  }`}
                >
                  <input
                    type="radio"
                    name={`ans-${q.id}`}
                    checked={selected}
                    onChange={() => setPick({ answer: i })}
                    className="sr-only"
                  />
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-sm font-black transition-all ${
                      selected
                        ? "bg-primary text-primary-foreground scale-110 rotate-3"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {LETTER(i)}
                  </span>
                  <span className="flex-1 leading-tight">{opt}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="mt-8">
          <div className="text-xs font-extrabold uppercase tracking-widest text-primary/80 mb-3 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            2. Seleccione la justificación que respalda su respuesta
          </div>
          <div className="grid gap-3">
            {q.justifications.map((opt, i) => {
              const selected = cur.justification === i;
              return (
                <label
                  key={i}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-b-4 px-4 py-3.5 text-sm transition-all duration-150 relative ${
                    selected
                      ? "border-primary bg-primary/10 text-foreground font-extrabold translate-y-[2px] shadow-[0_2px_0_var(--color-primary)]"
                      : "border-border bg-background hover:border-primary/40 hover:bg-secondary/40 hover:translate-y-[-1px] shadow-[0_4px_0_var(--color-border)] text-foreground"
                  }`}
                >
                  <input
                    type="radio"
                    name={`jus-${q.id}`}
                    checked={selected}
                    onChange={() => setPick({ justification: i })}
                    className="sr-only"
                  />
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-sm font-black transition-all ${
                      selected
                        ? "bg-primary text-primary-foreground scale-110 rotate-3"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {LETTER(i)}
                  </span>
                  <span className="flex-1 leading-tight">{opt}</span>
                </label>
              );
            })}
          </div>
        </div>

        {warn && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border-2 border-warning/40 bg-warning/10 px-4 py-3 text-sm font-semibold text-warning-foreground animate-shake">
            <AlertTriangle className="h-5 w-5 shrink-0 text-warning" /> {warn}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-3 pt-4 border-t border-dashed border-border">
          <button
            onClick={() => goto(idx - 1)}
            disabled={idx === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-b-4 border-border bg-background px-4 py-2.5 text-xs font-bold text-foreground hover:bg-secondary disabled:opacity-40 transition active:translate-y-[2px] active:border-b-2 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4 stroke-[3]" /> Anterior
          </button>

          <div className="flex gap-2">
            {questions.map((_, i) => {
              const p = picks[i];
              const done = p.answer !== null && p.justification !== null;
              return (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`h-3 w-3 rounded-full transition-all duration-200 ${
                    i === idx ? "bg-primary scale-125 ring-2 ring-primary/30" : done ? "bg-success" : "bg-secondary-foreground/20 hover:bg-secondary-foreground/40"
                  }`}
                  aria-label={`Ir a pregunta ${i + 1}`}
                />
              );
            })}
          </div>

          {idx < questions.length - 1 ? (
            <button
              onClick={() => goto(idx + 1)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-black text-primary-foreground border-b-4 border-primary-foreground/20 hover:brightness-110 active:translate-y-[2px] active:border-b-2 cursor-pointer shadow-md"
            >
              Siguiente <ChevronRight className="h-4 w-4 stroke-[3]" />
            </button>
          ) : (
            <button
              onClick={finalize}
              disabled={!allAnswered}
              className="inline-flex items-center gap-1.5 rounded-xl bg-success px-5 py-2.5 text-xs font-black text-success-foreground border-b-4 border-success-foreground/20 hover:brightness-110 active:translate-y-[2px] active:border-b-2 disabled:opacity-40 cursor-pointer shadow-md"
            >
              Finalizar módulo
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
