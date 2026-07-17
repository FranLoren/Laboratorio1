import { motion } from "framer-motion";
import { useState } from "react";
import { Check, X, ChevronRight } from "lucide-react";
import type { Question } from "@/lib/lab-constants";

const KAHOOT_OPTIONS = [
  {
    color: "#e21b3c",
    bg: "bg-[#e21b3c]",
    hoverBg: "hover:bg-[#c61330]",
    activeBg: "active:bg-[#a31027]",
    shadow: "shadow-[#a31027]",
    border: "border-[#a31027]",
    icon: (
      <svg className="h-6 w-6 fill-white stroke-none shrink-0" viewBox="0 0 24 24">
        <polygon points="12,3 2,21 22,21" />
      </svg>
    ),
  },
  {
    color: "#1368ce",
    bg: "bg-[#1368ce]",
    hoverBg: "hover:bg-[#1056ab]",
    activeBg: "active:bg-[#0d478f]",
    shadow: "shadow-[#0d478f]",
    border: "border-[#0d478f]",
    icon: (
      <svg className="h-6 w-6 fill-white stroke-none shrink-0" viewBox="0 0 24 24">
        <polygon points="12,2 22,12 12,22 2,12" />
      </svg>
    ),
  },
  {
    color: "#d89e00",
    bg: "bg-[#d89e00]",
    hoverBg: "hover:bg-[#b58500]",
    activeBg: "active:bg-[#946d00]",
    shadow: "shadow-[#946d00]",
    border: "border-[#946d00]",
    icon: (
      <svg className="h-6 w-6 fill-white stroke-none shrink-0" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
  },
  {
    color: "#26890c",
    bg: "bg-[#26890c]",
    hoverBg: "hover:bg-[#1f700a]",
    activeBg: "active:bg-[#175407]",
    shadow: "shadow-[#175407]",
    border: "border-[#175407]",
    icon: (
      <svg className="h-6 w-6 fill-white stroke-none shrink-0" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" />
      </svg>
    ),
  },
];

export function QuizQuestion({
  q,
  index,
  total,
  onAnswered,
}: {
  q: Question;
  index: number;
  total: number;
  onAnswered: (correct: boolean, pickedIdx: number) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const isCorrect = picked === q.correct;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="lab-card p-5 sm:p-7 bg-card border-4 border-border shadow-[0_8px_0_var(--border)] overflow-hidden"
    >
      <div className="mb-4 flex items-center justify-between text-xs">
        <span className="rounded-full bg-primary px-3.5 py-1 text-xs font-extrabold text-primary-foreground tracking-wide uppercase">
          Pregunta {index + 1} / {total}
        </span>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground uppercase tracking-wide">
          ⚡ {q.topic}
        </span>
      </div>
      
      <h3 className="text-lg font-extrabold leading-snug text-foreground sm:text-xl md:text-2xl font-display text-center my-4 py-2 border-b border-dashed border-border">
        {q.prompt}
      </h3>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {q.options.map((opt, i) => {
          const isPicked = picked === i;
          const isRight = i === q.correct;
          const show = picked !== null;
          const style = KAHOOT_OPTIONS[i % 4];

          // Determine styling based on state
          let btnClass = `${style.bg} ${style.hoverBg} ${style.activeBg} text-white ${style.border} shadow-[0_6px_0_rgba(0,0,0,0.25)]`;
          let opacityClass = "opacity-100 scale-100";
          let borderOverlay = "border-transparent";

          if (show) {
            if (isRight) {
              btnClass = `bg-success border-success-foreground/15 text-white shadow-[0_6px_0_rgba(0,0,0,0.2)] scale-[1.02]`;
            } else if (isPicked) {
              btnClass = `bg-destructive border-destructive-foreground/15 text-white shadow-[0_6px_0_rgba(0,0,0,0.2)]`;
            } else {
              opacityClass = "opacity-40 scale-[0.96]";
              btnClass = "bg-muted border-muted-foreground/10 text-muted-foreground shadow-[0_2px_0_rgba(0,0,0,0.1)]";
            }
          }

          return (
            <motion.button
              key={i}
              disabled={picked !== null}
              onClick={() => setPicked(i)}
              whileHover={!show ? { scale: 1.02, y: -2 } : {}}
              whileTap={!show ? { scale: 0.98, y: 2 } : {}}
              className={`flex items-center gap-4 rounded-2xl border-b-4 px-5 py-4 text-left text-sm font-extrabold transition-all duration-150 relative cursor-pointer ${btnClass} ${opacityClass}`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs">
                {show && isRight ? (
                  <Check className="h-6 w-6 text-white stroke-[3.5]" />
                ) : show && isPicked ? (
                  <X className="h-6 w-6 text-white stroke-[3.5]" />
                ) : (
                  style.icon
                )}
              </div>
              <span className="flex-1 text-base leading-tight font-sans tracking-wide">
                {opt}
              </span>
            </motion.button>
          );
        })}
      </div>

      {picked !== null && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className={`mt-6 rounded-2xl border-4 p-5 text-sm ${
            isCorrect 
              ? "border-success bg-success/10 text-success-foreground" 
              : "border-warning bg-warning/10 text-warning-foreground"
          } shadow-[0_4px_0_currentColor]`}
        >
          <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider">
            <span>{isCorrect ? "🎉 ¡Excelente trabajo!" : "💡 Aprendamos más"}</span>
          </div>
          <p className="text-base font-medium text-foreground leading-relaxed">{q.explanation}</p>
          <button
            onClick={() => onAnswered(isCorrect, picked!)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-black text-primary-foreground hover:brightness-110 active:translate-y-0.5 border-b-4 border-primary-foreground/20 cursor-pointer shadow-md transition"
          >
            Continuar <ChevronRight className="h-4 w-4 stroke-[3]" />
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
