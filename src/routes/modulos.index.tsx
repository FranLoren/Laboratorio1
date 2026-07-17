import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Lock, Trophy, FileText } from "lucide-react";
import { AppShell } from "@/components/lab/AppShell";
import { ProgressBar } from "@/components/lab/ProgressBar";
import { useLabStore, computeGlobalScore, nivelFromScore } from "@/store/lab-store";
import { MODULES } from "@/lib/lab-constants";

export const Route = createFileRoute("/modulos/")({
  head: () => ({
    meta: [
      { title: "Módulos del prelaboratorio · UCT" },
      { name: "description", content: "Recorrido de los 8 módulos del prelaboratorio." },
    ],
  }),
  component: HubPage,
});

function HubPage() {
  const student = useLabStore((s) => s.student);
  const hasHydrated = useLabStore((s) => s._hasHydrated);
  const modules = useLabStore((s) => s.modules);
  const badges = useLabStore((s) => s.badges);

  if (!hasHydrated) {
    return (
      <AppShell title="Cargando…" subtitle="Recuperando tu progreso guardado.">
        <div className="grid min-h-[30vh] place-items-center text-sm text-muted-foreground">
          Cargando…
        </div>
      </AppShell>
    );
  }
  if (!student) return <Navigate to="/registro" />;

  const score = computeGlobalScore(modules);
  const nivel = nivelFromScore(score);
  const completed = Object.values(modules).filter((m) => m.completed).length;

  return (
    <AppShell
      title={`Hola, ${student.nombre}`}
      subtitle="Avanza por los módulos en orden. Tu progreso se guarda automáticamente."
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="lab-card p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Progreso global
          </div>
          <div className="mt-2 mb-2 text-2xl font-bold text-foreground">{completed}/8 módulos</div>
          <ProgressBar value={(completed / 8) * 100} />
        </div>
        <div className="lab-card p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Puntaje promedio
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {score}
            <span className="text-sm font-medium text-muted-foreground"> / 100</span>
          </div>
          <div className="mt-1 text-xs font-medium text-primary">Nivel: {nivel}</div>
        </div>
        <div className="lab-card p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Insignias
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {badges.length === 0 && (
              <span className="text-xs text-muted-foreground">Aún no tienes insignias.</span>
            )}
            {badges.map((b) => (
              <span
                key={b.id}
                title={b.description}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--color-kmno4)]/15 px-2 py-0.5 text-[11px] font-semibold text-[var(--color-kmno4-deep)]"
              >
                <Trophy className="h-3 w-3" /> {b.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((m, idx) => {
          const state = modules[m.id as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7];
          const prev = idx === 0 ? null : modules[(idx - 1) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7];
          const locked = prev !== null && !prev.completed && !state.completed;
          const Icon = state.completed ? CheckCircle2 : locked ? Lock : Circle;
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.04 }}
            >
              {locked ? (
                <div className="lab-card flex h-full cursor-not-allowed flex-col gap-2 p-4 opacity-50">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-muted-foreground">
                      {m.short}
                    </span>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h3 className="text-base font-semibold leading-tight text-foreground">
                    {m.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">{m.desc}</p>
                  <span className="mt-auto text-[11px] text-muted-foreground">
                    Completa el módulo anterior para desbloquear.
                  </span>
                </div>
              ) : (
                <Link
                  to="/modulos/$id"
                  params={{ id: String(m.id) }}
                  className="lab-card flex h-full flex-col gap-2 p-4 transition hover:border-primary hover:shadow-md"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-muted-foreground">
                      {m.short}
                    </span>
                    <Icon
                      className={`h-4 w-4 ${state.completed ? "text-success" : "text-primary"}`}
                    />
                    {state.completed && (
                      <span className="ml-auto rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">
                        {state.score}/100
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold leading-tight text-foreground">
                    {m.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">{m.desc}</p>
                </Link>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Reporte final</h3>
          <p className="text-xs text-muted-foreground">
            Cuando completes todos los módulos podrás generar y exportar tu reporte.
          </p>
        </div>
        <Link
          to="/reporte"
          className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
        >
          <FileText className="h-4 w-4" /> Ver reporte
        </Link>
      </div>
    </AppShell>
  );
}
