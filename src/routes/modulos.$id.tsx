import { createFileRoute, Navigate, useNavigate, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AppShell } from "@/components/lab/AppShell";
import { useLabStore, type ModuleId } from "@/store/lab-store";
import { MODULES } from "@/lib/lab-constants";
import { Module0 } from "@/modules/Module0";
import { Module1 } from "@/modules/Module1";
import { Module2 } from "@/modules/Module2";
import { Module3 } from "@/modules/Module3";
import { Module4 } from "@/modules/Module4";
import { Module5 } from "@/modules/Module5";
import { Module6 } from "@/modules/Module6";
import { Module7 } from "@/modules/Module7";
import { ModuleWithQuiz } from "@/modules/ModuleWithQuiz";
import { M3_QUIZ, M4_QUIZ, M5_QUIZ, M6_QUIZ } from "@/lib/quiz-questions";
import { RotateCcw, ArrowLeft, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/modulos/$id")({
  head: () => ({
    meta: [{ title: "Módulo · Prelab Bioquímica UCT" }],
  }),
  component: ModuleRoute,
});

function ModuleRoute() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const student = useLabStore((s) => s.student);
  const hasHydrated = useLabStore((s) => s._hasHydrated);
  const recordAttempt = useLabStore((s) => s.recordAttempt);
  const resetModule = useLabStore((s) => s.resetModule);

  const numIdRaw = Number(id);
  const safeId = (
    Number.isInteger(numIdRaw) && numIdRaw >= 0 && numIdRaw <= 7 ? numIdRaw : 0
  ) as ModuleId;
  const modProgress = useLabStore((s) => s.modules[safeId]);

  const [mountKey, setMountKey] = useState(0);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const recordedRef = useRef(false);
  const startedRef = useRef(Date.now());

  if (!hasHydrated) return <HydrationFallback />;
  if (!student) return <Navigate to="/registro" />;
  if (!Number.isInteger(numIdRaw) || numIdRaw < 0 || numIdRaw > 7)
    return <Navigate to="/modulos" />;
  const numId = safeId;
  const moduleMeta = MODULES[numId];

  const onComplete = (score: number, details?: Record<string, unknown>) => {
    if (recordedRef.current) return;
    recordedRef.current = true;
    const timeSec = Math.max(1, Math.round((Date.now() - startedRef.current) / 1000));
    const errorsThisAttempt =
      typeof details?.errores === "number" ? (details.errores as number) : 0;
    recordAttempt(numId as ModuleId, { score, errors: errorsThisAttempt, timeSec, data: details });
    setLastScore(score);
    // Automatically navigate back to modules hub
    setTimeout(() => {
      navigate({ to: "/modulos" });
    }, 1500); // Small delay so the user can see the "Completed successfully" screen briefly
  };

  const onReset = () => {
    resetModule(numId as ModuleId);
    try {
      localStorage.removeItem(`uct-prelab-mwq-${numId}`);
      localStorage.removeItem(`uct-prelab-draft-m${numId}`);
      localStorage.removeItem(`uct-prelab-quiz-m${numId}-idx`);
      localStorage.removeItem(`uct-prelab-quiz-m${numId}-picks`);
      localStorage.removeItem(`uct-prelab-quiz-m${numId}-submitted`);
    } catch (e) {
      // ignore
    }
    recordedRef.current = false;
    startedRef.current = Date.now();
    setLastScore(null);
    setMountKey((k) => k + 1);
  };

  const Comp = (() => {
    switch (numId) {
      case 0:
        return <Module0 onComplete={onComplete} />;
      case 1:
        return <Module1 onComplete={onComplete} />;
      case 2:
        return <Module2 onComplete={onComplete} />;
      case 3:
        return (
          <ModuleWithQuiz
            moduleId={numId}
            title="Actividad Experimental I — Errores de pipeteo"
            questions={M3_QUIZ}
            practical={(cb) => <Module3 onComplete={cb} />}
            onComplete={onComplete}
          />
        );
      case 4:
        return (
          <ModuleWithQuiz
            moduleId={numId}
            title="Actividad Experimental II — Pipeteo normal y reverso"
            questions={M4_QUIZ}
            practical={(cb) => <Module4 onComplete={cb} />}
            onComplete={onComplete}
          />
        );
      case 5:
        return (
          <ModuleWithQuiz
            moduleId={numId}
            title="Actividad Experimental III — Dilución simple"
            questions={M5_QUIZ}
            practical={(cb) => <Module5 onComplete={cb} />}
            onComplete={onComplete}
          />
        );
      case 6:
        return (
          <ModuleWithQuiz
            moduleId={numId}
            title="Actividad Experimental IV — Dilución seriada"
            questions={M6_QUIZ}
            practical={(cb) => <Module6 onComplete={cb} />}
            onComplete={onComplete}
          />
        );
      case 7:
        return <Module7 onComplete={onComplete} />;
      default:
        return null;
    }
  })();

  const done = lastScore !== null || modProgress.completed;

  return (
    <AppShell
      title={`${moduleMeta.short} · ${moduleMeta.title}`}
      subtitle={moduleMeta.desc}
      back="/modulos"
      right={
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              if (
                modProgress.attempts > 0 &&
                !confirm(
                  "¿Reiniciar esta actividad? Tu intento actual se conservará en el reporte y comenzará un nuevo intento.",
                )
              )
                return;
              onReset();
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-secondary"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reiniciar módulo
          </button>
          <button
            onClick={() => navigate({ to: "/modulos" })}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Volver a módulos
          </button>
        </div>
      }
    >
      {done && (
        <div className="mx-auto mb-4 flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-lg border border-success/40 bg-success/10 p-3 text-xs text-success">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>
              Módulo guardado. Intento #{modProgress.attempts}:{" "}
              {(() => {
                const h = modProgress.history ?? [];
                return h.length > 0 ? h[h.length - 1]?.score : lastScore;
              })() ?? lastScore}
              /100. Mejor puntaje: {modProgress.score}/100. Intentos totales: {modProgress.attempts}
              .
            </span>
          </div>
          <Link to="/modulos" className="font-semibold underline">
            Ir a módulos →
          </Link>
        </div>
      )}
      <div key={mountKey}>{Comp}</div>
    </AppShell>
  );
}

function HydrationFallback() {
  return (
    <div className="grid min-h-[40vh] place-items-center text-sm text-muted-foreground">
      Cargando tu progreso…
    </div>
  );
}
