import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Student = {
  nombre: string;
  apellidos: string;
  correo: string;
  seccion: string;
};

export type ModuleId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type AttemptRecord = {
  attemptNumber: number;
  score: number;
  errors: number;
  timeSec: number;
  at: number;
  data?: Record<string, unknown>;
};

export type ModuleProgress = {
  completed: boolean;
  score: number; // 0..100 (best across attempts)
  attempts: number; // total attempt count
  errors: number; // cumulative errors across attempts
  timeSec: number;
  history: AttemptRecord[];
  data?: Record<string, unknown>;
};

export type Badge = {
  id: string;
  label: string;
  description: string;
  earnedAt: number;
};

type LabState = {
  student: Student | null;
  startedAt: number | null;
  modules: Record<ModuleId, ModuleProgress>;
  badges: Badge[];
  currentModule: ModuleId | null;
  _hasHydrated: boolean;

  setStudent: (s: Student) => void;
  resetAll: () => void;
  startSession: () => void;

  updateModule: (id: ModuleId, patch: Partial<ModuleProgress>) => void;
  completeModule: (id: ModuleId, score: number) => void;
  recordAttempt: (id: ModuleId, a: Omit<AttemptRecord, "attemptNumber" | "at">) => void;
  resetModule: (id: ModuleId) => void;
  addBadge: (b: Omit<Badge, "earnedAt">) => void;
  setCurrentModule: (id: ModuleId | null) => void;
  _setHasHydrated: (v: boolean) => void;
};

const emptyModule = (): ModuleProgress => ({
  completed: false,
  score: 0,
  attempts: 0,
  errors: 0,
  timeSec: 0,
  history: [],
});

const emptyModules = (): Record<ModuleId, ModuleProgress> => ({
  0: emptyModule(),
  1: emptyModule(),
  2: emptyModule(),
  3: emptyModule(),
  4: emptyModule(),
  5: emptyModule(),
  6: emptyModule(),
  7: emptyModule(),
});

export const useLabStore = create<LabState>()(
  persist(
    (set, get) => ({
      student: null,
      startedAt: null,
      modules: emptyModules(),
      badges: [],
      currentModule: null,
      _hasHydrated: false,
      _setHasHydrated: (v) => set({ _hasHydrated: v }),

      setStudent: (s) => set({ student: s }),
      resetAll: () =>
        set({
          student: null,
          startedAt: null,
          modules: emptyModules(),
          badges: [],
          currentModule: null,
        }),
      startSession: () => {
        if (!get().startedAt) set({ startedAt: Date.now() });
      },

      updateModule: (id, patch) =>
        set((state) => ({
          modules: {
            ...state.modules,
            [id]: { ...state.modules[id], ...patch },
          },
        })),

      completeModule: (id, score) =>
        set((state) => {
          const next = {
            ...state.modules[id],
            completed: true,
            score: Math.max(state.modules[id].score, score),
          };
          const badges = [...state.badges];
          const badgeMap: Record<number, { id: string; label: string; description: string }> = {
            0: {
              id: "diagnostico",
              label: "Diagnóstico completo",
              description: "Identificaste tus brechas iniciales.",
            },
            1: {
              id: "micropipetas",
              label: "Maestro de micropipetas",
              description: "Dominas P20, P100, P200 y P1000.",
            },
            2: {
              id: "tecnica",
              label: "Técnica impecable",
              description: "Forward y reverse pipetting sin errores críticos.",
            },
            3: {
              id: "errores",
              label: "Detector de errores",
              description: "Clasificas errores sistemáticos y aleatorios.",
            },
            4: {
              id: "precision",
              label: "Precisión analítica",
              description: "Réplicas con bajo error porcentual.",
            },
            5: {
              id: "dilucion-simple",
              label: "Cálculo C1V1=C2V2",
              description: "Dominas la dilución simple.",
            },
            6: {
              id: "dilucion-seriada",
              label: "Dilución seriada",
              description: "Gradiente de color perfecto.",
            },
            7: {
              id: "certificacion",
              label: "Prelaboratorio aprobado",
              description: "Listo para el laboratorio presencial.",
            },
          };
          const b = badgeMap[id];
          if (b && !badges.find((x) => x.id === b.id)) {
            badges.push({ ...b, earnedAt: Date.now() });
          }
          return { modules: { ...state.modules, [id]: next }, badges };
        }),

      addBadge: (b) =>
        set((state) => {
          if (state.badges.find((x) => x.id === b.id)) return state;
          return { badges: [...state.badges, { ...b, earnedAt: Date.now() }] };
        }),

      setCurrentModule: (id) => set({ currentModule: id }),
      recordAttempt: (id, a) =>
        set((state) => {
          const prev = state.modules[id];
          const attemptNumber = prev.history.length + 1;
          const rec: AttemptRecord = { ...a, attemptNumber, at: Date.now() };
          const history = [...prev.history, rec];
          const bestScore = Math.max(prev.score, a.score);
          const totalErrors = history.reduce((s, h) => s + h.errors, 0);
          const totalTime = history.reduce((s, h) => s + h.timeSec, 0);
          const next: ModuleProgress = {
            ...prev,
            completed: true,
            score: bestScore,
            attempts: history.length,
            errors: totalErrors,
            timeSec: totalTime,
            history,
          };
          const badges = [...state.badges];
          const badgeMap: Record<number, { id: string; label: string; description: string }> = {
            0: {
              id: "diagnostico",
              label: "Diagnóstico completo",
              description: "Identificaste tus brechas iniciales.",
            },
            1: {
              id: "micropipetas",
              label: "Maestro de micropipetas",
              description: "Dominas P20, P100, P200 y P1000.",
            },
            2: {
              id: "tecnica",
              label: "Técnica impecable",
              description: "Forward y reverse pipetting sin errores críticos.",
            },
            3: {
              id: "errores",
              label: "Detector de errores",
              description: "Clasificas errores sistemáticos y aleatorios.",
            },
            4: {
              id: "precision",
              label: "Precisión analítica",
              description: "Réplicas con bajo error porcentual.",
            },
            5: {
              id: "dilucion-simple",
              label: "Cálculo C1V1=C2V2",
              description: "Dominas la dilución simple.",
            },
            6: {
              id: "dilucion-seriada",
              label: "Dilución seriada",
              description: "Gradiente de color perfecto.",
            },
            7: {
              id: "certificacion",
              label: "Prelaboratorio aprobado",
              description: "Listo para el laboratorio presencial.",
            },
          };
          const b = badgeMap[id];
          if (b && !badges.find((x) => x.id === b.id)) {
            badges.push({ ...b, earnedAt: Date.now() });
          }
          return { modules: { ...state.modules, [id]: next }, badges };
        }),

      resetModule: (id) =>
        set((state) => ({
          modules: {
            ...state.modules,
            [id]: { ...state.modules[id], completed: false },
          },
        })),
    }),
    {
      name: "uct-prelab-bioq-1",
      version: 2,
      migrate: (persisted: unknown, _version: number) => {
        const s = (persisted as { modules?: Record<string, Partial<ModuleProgress>> }) ?? {};
        if (s.modules) {
          for (const k of Object.keys(s.modules)) {
            const m = s.modules[k];
            if (m && !Array.isArray(m.history)) m.history = [];
          }
        }
        return persisted as never;
      },
      partialize: (s) => ({
        student: s.student,
        startedAt: s.startedAt,
        modules: s.modules,
        badges: s.badges,
        currentModule: s.currentModule,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.modules) {
          for (const id of Object.keys(state.modules) as unknown as ModuleId[]) {
            const m = state.modules[id];
            if (m && !Array.isArray(m.history)) m.history = [];
          }
        }
        state?._setHasHydrated(true);
      },
    },
  ),
);

export const computeGlobalScore = (modules: Record<ModuleId, ModuleProgress>) => {
  const arr = Object.values(modules);
  const sum = arr.reduce((a, m) => a + m.score, 0);
  return Math.round(sum / arr.length);
};

export const nivelFromScore = (s: number) => {
  if (s >= 90) return "Experto";
  if (s >= 75) return "Avanzado";
  if (s >= 60) return "Competente";
  if (s >= 40) return "En desarrollo";
  return "Iniciado";
};
