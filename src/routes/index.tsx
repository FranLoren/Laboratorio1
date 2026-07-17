import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Beaker, Microscope } from "lucide-react";
import { useLabStore } from "@/store/lab-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Laboratorio N°1" },
      {
        name: "description",
        content:
          "Simulador inmersivo para el Laboratorio N°1: Diluciones simples, seriadas y análisis de errores de pipeteo.",
      },
      { property: "og:title", content: "Laboratorio N°1" },
      {
        property: "og:description",
        content:
          "Simulador inmersivo para el Laboratorio N°1: Diluciones simples, seriadas y análisis de errores de pipeteo.",
      },
    ],
  }),
  component: WelcomePage,
});

function WelcomePage() {
  const navigate = useNavigate();
  const student = useLabStore((s) => s.student);
  const startSession = useLabStore((s) => s.startSession);

  const handleStart = () => {
    startSession();
    navigate({ to: student ? "/modulos" : "/registro" });
  };

  return (
    <div className="min-h-screen lab-bench">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-8 sm:py-10">
        <header className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/logo-tec-medica.png"
              alt="Universidad Católica de Temuco · Tecnología Médica"
              className="h-14 w-auto object-contain"
            />
            <span className="text-lg font-bold text-foreground">Laboratorio N°1</span>
          </Link>
        </header>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-2 lg:py-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="chip mb-4 bg-accent text-accent-foreground">Laboratorio N°1</span>
            <h1 className="text-3xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
              Diluciones simples, seriadas y análisis de errores de pipeteo
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              Prepárate para el laboratorio presencial con un simulador inmersivo: practica técnica
              de pipeteo, dominio de micropipetas P20–P1000, dilución simple y seriada con
              permanganato de potasio.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                onClick={handleStart}
                className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90 hover:shadow-primary/40"
              >
                {student ? "Continuar mi sesión" : "Iniciar Laboratorio"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              {student && (
                <Link
                  to="/registro"
                  className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Cambiar de estudiante
                </Link>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative"
          >
            <div className="lab-panel relative overflow-hidden p-6 sm:p-8">
              <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[var(--color-kmno4)]/20 blur-3xl" />
              <div className="absolute -bottom-20 -left-12 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
              <div className="relative grid grid-cols-6 items-end gap-2">
                {["#8815BD", "#A043CF", "#B869DB", "#CD92E6", "#DFB8EF", "#EEDAF7"].map(
                  (color, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <svg viewBox="0 0 40 140" width="36" height="120">
                        <rect
                          x="6"
                          y="0"
                          width="28"
                          height="8"
                          rx="2"
                          fill="oklch(0.55 0.02 255)"
                        />
                        <path
                          d="M 8 12 L 32 12 L 32 118 Q 32 134 20 134 Q 8 134 8 118 Z"
                          fill="oklch(0.97 0.005 220)"
                          stroke="oklch(0.78 0.01 220)"
                        />
                        <path
                          d="M 10 50 L 30 50 L 30 117 Q 30 132 20 132 Q 10 132 10 117 Z"
                          fill={color}
                        />
                      </svg>
                      <span className="font-mono text-[10px] font-semibold text-muted-foreground">
                        T{i + 1}
                      </span>
                    </div>
                  ),
                )}
              </div>
              <div className="relative mt-4 text-center text-xs font-medium text-muted-foreground">
                Dilución seriada KMnO₄ · Factor de dilución 2
              </div>
            </div>
          </motion.div>
        </div>

        <footer className="mt-auto flex flex-col items-center justify-between gap-2 border-t border-border/60 pt-5 text-[11px] text-muted-foreground sm:flex-row">
          <span>© Dra. Pía Loren Reyes</span>
          <span>Diseñado para preparar tu laboratorio presencial</span>
        </footer>
      </div>
    </div>
  );
}
