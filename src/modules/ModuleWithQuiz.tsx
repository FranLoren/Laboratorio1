import { useState, useEffect, type ReactNode } from "react";
import { JustifiedQuiz } from "@/components/lab/JustifiedQuiz";
import type { JustifiedQuestion } from "@/lib/quiz-questions";

/**
 * Encadena una actividad práctica con un cuestionario de respuesta + justificación
 * con corrección diferida. El puntaje final es el promedio simple de ambos,
 * capado a 100.
 */
export function ModuleWithQuiz({
  moduleId,
  title,
  questions,
  practical,
  onComplete,
}: {
  moduleId: number;
  title: string;
  questions: JustifiedQuestion[];
  practical: (
    onPracticalDone: (score: number, details?: Record<string, unknown>) => void,
  ) => ReactNode;
  onComplete: (score: number, details?: Record<string, unknown>) => void;
}) {
  const storageKey = `uct-prelab-mwq-${moduleId}`;

  const [phase, setPhase] = useState<"practical" | "quiz">(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.phase === "practical" || parsed.phase === "quiz") {
          return parsed.phase;
        }
      }
    } catch (e) {
      // ignore
    }
    return "practical";
  });

  const [practicalScore, setPracticalScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.practicalScore === "number") {
          return parsed.practicalScore;
        }
      }
    } catch (e) {
      // ignore
    }
    return 0;
  });

  const [practicalDetails, setPracticalDetails] = useState<Record<string, unknown> | undefined>(
    () => {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.practicalDetails) {
            return parsed.practicalDetails;
          }
        }
      } catch (e) {
        // ignore
      }
      return undefined;
    },
  );

  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          phase,
          practicalScore,
          practicalDetails,
        }),
      );
    } catch (e) {
      // ignore
    }
  }, [phase, practicalScore, practicalDetails, storageKey]);

  if (moduleId === 3 || moduleId === 4) {
    return (
      <>
        {practical((score, details) => {
          onComplete(score, details);
        })}
      </>
    );
  }

  if (phase === "practical") {
    return (
      <>
        {practical((s, d) => {
          setPracticalScore(Math.max(0, Math.min(100, s)));
          setPracticalDetails(d);
          setPhase("quiz");
        })}
      </>
    );
  }

  return (
    <JustifiedQuiz
      title={title}
      questions={questions}
      storageKey={`uct-prelab-quiz-m${moduleId}`}
      onFinish={(quizScore) => {
        const final = Math.min(
          100,
          Math.round((practicalScore + Math.max(0, Math.min(100, quizScore))) / 2),
        );
        onComplete(final, {
          puntajePractica: practicalScore,
          puntajeQuiz: Math.max(0, Math.min(100, quizScore)),
          ...(practicalDetails ?? {}),
        });
      }}
    />
  );
}
