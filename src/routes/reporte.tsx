import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/lab/AppShell";
import { ProgressBar } from "@/components/lab/ProgressBar";
import { useLabStore, computeGlobalScore, nivelFromScore } from "@/store/lab-store";
import { MODULES } from "@/lib/lab-constants";
import {
  Download,
  Send,
  Trophy,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  FileText,
} from "lucide-react";
import { submitLabReport } from "@/lib/submit-report.functions";

export const Route = createFileRoute("/reporte")({
  head: () => ({
    meta: [{ title: "Reporte final · Prelab Bioquímica UCT" }],
  }),
  component: ReportePage,
});

function ReportePage() {
  const student = useLabStore((s) => s.student);
  const modules = useLabStore((s) => s.modules);
  const badges = useLabStore((s) => s.badges);
  const startedAt = useLabStore((s) => s.startedAt);
  const resetAll = useLabStore((s) => s.resetAll);

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<"ok" | "err" | null>(null);

  if (!student) return <Navigate to="/registro" />;

  const score = computeGlobalScore(modules);
  const nivel = nivelFromScore(score);
  const totalSec = startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0;
  const totalModules = MODULES.length;
  const completed = MODULES.filter(
    (m) => modules[m.id as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7].completed,
  ).length;
  const allCompleted = completed === totalModules;

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m ${sec}s`;
  };

  const frequentErrors = Object.entries(modules)
    .filter(([, m]) => m.errors > 0)
    .map(([id, m]) => ({ id: Number(id), title: MODULES[Number(id)].title, errors: m.errors }))
    .sort((a, b) => b.errors - a.errors)
    .slice(0, 4);

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await submitLabReport({
        data: {
          nombre: student.nombre,
          apellidos: student.apellidos,
          correo: student.correo,
          seccion: student.seccion,
          puntaje_global: score,
          nivel,
          tiempo_total_seg: totalSec,
          progreso: modules,
        },
      });
      setSent(res.ok ? "ok" : "err");
    } catch {
      setSent("err");
    } finally {
      setSending(false);
    }
  };

  const exportPDF = () => {
    // Forzar apertura de todos los <details> para incluir el detalle del intento
    document.querySelectorAll("details").forEach((d) => d.setAttribute("open", ""));
    setTimeout(() => window.print(), 50);
  };

  const tubeSvgString = (t: TubeImg) => {
    const h = Math.max(0, Math.min(1, t.fillPct)) * 140;
    const topY = 192 - h;
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
      <svg viewBox="0 0 60 200" width="48" height="140">
        <rect x="10" y="0" width="40" height="12" rx="2" fill="#7f7f8a"/>
        <path d="M 12 18 L 48 18 L 48 170 Q 48 192 30 192 Q 12 192 12 170 Z" fill="#fafafa" stroke="#aaa" stroke-width="1.2"/>
        ${h > 0 ? `<rect x="14" y="${topY}" width="32" height="${h}" fill="${t.color}"/>` : ""}
      </svg>
      <div style="font-family:ui-monospace,monospace;font-size:10px;font-weight:700;">${escapeHtml(t.label)}</div>
    </div>`;
  };

  const exportDetalle = () => {
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    const rowsHtml = MODULES.map((m) => {
      const st = modules[m.id as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7];
      const hist = (st.history ?? []).filter((h) => h.data);
      if (hist.length === 0) return "";
      const attempts = hist
        .map((h) => {
          const data = h.data as Record<string, unknown>;
          const tubesImgs = data?.imagenes_tubos as TubeImg[] | undefined;
          const tubesHtml = isTubeImgArray(tubesImgs)
            ? `<div style="display:flex;flex-wrap:wrap;gap:8px;background:#f3f0f7;padding:8px;border-radius:6px;margin:8px 0;">${tubesImgs.map(tubeSvgString).join("")}</div>`
            : "";
          const rest = { ...(data ?? {}) };
          delete (rest as Record<string, unknown>).imagenes_tubos;
          return `
          <div style="margin:12px 0;padding:10px;border:1px solid #ddd;border-radius:8px;">
            <div style="font-weight:700;margin-bottom:6px;">Intento #${h.attemptNumber} — ${new Date(h.at).toLocaleString()} · Puntaje ${h.score}/100 · Errores ${h.errors}</div>
            ${tubesHtml}
            <pre style="white-space:pre-wrap;font-family:ui-monospace,monospace;font-size:12px;background:#f7f7f9;padding:8px;border-radius:6px;">${escapeHtml(JSON.stringify(rest, null, 2))}</pre>
          </div>`;
        })
        .join("");

      return `<section style="margin-bottom:24px;"><h2 style="font-family:Fredoka,system-ui;border-bottom:2px solid #333;padding-bottom:4px;">${m.short} · ${m.title}</h2>${attempts}</section>`;
    }).join("");
    win.document
      .write(`<!doctype html><html><head><meta charset="utf-8"><title>Detalle de intentos · ${student.nombre} ${student.apellidos}</title>
      <style>body{font-family:Nunito,system-ui,sans-serif;font-size:14px;color:#1a1a2e;max-width:900px;margin:24px auto;padding:0 24px;line-height:1.5;}h1{font-family:Fredoka,system-ui;}</style>
      </head><body>
      <h1>Detalle de intentos por módulo</h1>
      <p><strong>${student.nombre} ${student.apellidos}</strong> — ${student.correo} · Sección ${student.seccion}</p>
      ${rowsHtml || "<p>No hay detalles registrados aún.</p>"}
      <script>window.onload=()=>setTimeout(()=>window.print(),200);</script>
      </body></html>`);
    win.document.close();
  };

  return (
    <AppShell
      title="Reporte final"
      subtitle="Resumen de tu desempeño en el prelaboratorio."
      back="/modulos"
      right={
        <div className="flex flex-col items-end gap-1 print:hidden">
          <div className="flex flex-wrap gap-2 justify-end">
            <button
              onClick={exportPDF}
              disabled={!allCompleted}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-semibold hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" /> Exportar PDF (con detalle)
            </button>
            <button
              onClick={exportDetalle}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-semibold hover:bg-secondary"
            >
              <FileText className="h-4 w-4" /> Descargar detalle
            </button>
            <button
              onClick={handleSend}
              disabled={!allCompleted || sending || sent === "ok"}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />{" "}
              {sent === "ok" ? "Enviado" : sending ? "Enviando…" : "Generar y enviar reporte"}
            </button>
          </div>
          {!allCompleted && (
            <div className="text-xs text-muted-foreground">
              Completa los {totalModules} módulos para generar el reporte ({completed}/
              {totalModules} listos).
            </div>
          )}
        </div>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="lab-card p-6 print:shadow-none">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Estudiante
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                {student.nombre} {student.apellidos}
              </h2>
              <div className="text-xs text-muted-foreground">
                {student.correo} · Sección {student.seccion}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Nivel alcanzado
              </div>
              <div className="text-2xl font-bold text-primary">{nivel}</div>
              <div className="text-xs text-muted-foreground">
                {score}/100 · {completed}/{totalModules} módulos
              </div>
            </div>
          </div>

          <div className="my-4">
            <ProgressBar value={score} label="Puntaje global" />
          </div>

          <h3 className="mt-6 text-sm font-semibold text-foreground">Detalle por módulo</h3>
          <div className="mt-3 space-y-2">
            {MODULES.map((m) => {
              const st = modules[m.id as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7];
              return (
                <div key={m.id} className="rounded-lg border border-border bg-background p-3">
                  <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-md bg-secondary text-xs font-bold text-foreground">
                      {m.short}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">{m.title}</div>
                      <div className="text-xs text-muted-foreground">{m.desc}</div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-mono text-sm font-bold ${st.completed ? "text-success" : "text-muted-foreground"}`}
                      >
                        {st.score}/100
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {st.completed ? (
                          <>
                            <CheckCircle2 className="inline h-3 w-3" /> {st.attempts} intento
                            {st.attempts === 1 ? "" : "s"}
                          </>
                        ) : (
                          "pendiente"
                        )}
                      </div>
                    </div>
                  </div>
                  {(st.history ?? []).length > 0 && (
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-[11px]">
                        <thead className="text-muted-foreground">
                          <tr className="border-b border-border">
                            <th className="py-1 text-left font-medium">Intento</th>
                            <th className="py-1 text-right font-medium">Puntaje</th>
                            <th className="py-1 text-right font-medium">Errores</th>
                            <th className="py-1 text-right font-medium">Tiempo</th>
                            <th className="py-1 text-right font-medium">Fecha</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(st.history ?? []).map((h) => (
                            <tr
                              key={h.attemptNumber}
                              className="border-b border-border/50 last:border-0"
                            >
                              <td className="py-1">#{h.attemptNumber}</td>
                              <td className="py-1 text-right font-mono">{h.score}/100</td>
                              <td className="py-1 text-right font-mono">{h.errors}</td>
                              <td className="py-1 text-right font-mono">{formatTime(h.timeSec)}</td>
                              <td className="py-1 text-right text-muted-foreground">
                                {new Date(h.at).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {(st.history ?? []).some((h) => h.data) && (
                        <div className="mt-3 space-y-2">
                          {(st.history ?? [])
                            .filter((h) => h.data)
                            .map((h) => (
                              <details
                                key={`d-${h.attemptNumber}`}
                                className="rounded-md border border-border bg-secondary/30 p-2 text-[11px]"
                              >
                                <summary className="cursor-pointer font-semibold text-foreground">
                                  Detalle del intento #{h.attemptNumber} — resultados
                                </summary>
                                <div className="mt-2">
                                  <AttemptDetails data={h.data!} />
                                </div>
                              </details>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {frequentErrors.length > 0 && (
            <>
              <h3 className="mt-6 text-sm font-semibold text-foreground">Errores frecuentes</h3>
              <ul className="mt-2 space-y-1.5 text-xs">
                {frequentErrors.map((e) => (
                  <li key={e.id} className="flex items-center gap-2 text-foreground">
                    <AlertTriangle className="h-3.5 w-3.5 text-warning-foreground" /> {e.title} —{" "}
                    {e.errors} errores
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <aside className="space-y-4 print:hidden">
          <div className="lab-card p-5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Tiempo total
            </div>
            <div className="mt-1 font-mono text-2xl font-bold text-foreground">
              {formatTime(totalSec)}
            </div>
          </div>

          <div className="lab-card p-5">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Insignias
            </div>
            {badges.length === 0 ? (
              <div className="text-xs text-muted-foreground">Aún no tienes insignias.</div>
            ) : (
              <ul className="space-y-2">
                {badges.map((b) => (
                  <li key={b.id} className="flex items-start gap-2 text-xs text-foreground">
                    <Trophy className="mt-0.5 h-3.5 w-3.5 text-[var(--color-kmno4)]" />
                    <div>
                      <div className="font-semibold">{b.label}</div>
                      <div className="text-muted-foreground">{b.description}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {sent === "ok" && (
            <div className="rounded-lg border border-success/40 bg-success/10 p-3 text-xs text-success">
              Reporte enviado correctamente. Tu docente lo recibirá.
            </div>
          )}
          {sent === "err" && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
              No pudimos enviar el reporte. Inténtalo nuevamente o exporta PDF.
            </div>
          )}

          <div className="lab-card p-5">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Sesión
            </div>
            <Link to="/modulos" className="block text-xs font-medium text-primary hover:underline">
              ← Volver a módulos
            </Link>
            <button
              onClick={() => {
                if (confirm("¿Reiniciar todo el progreso?")) resetAll();
              }}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-destructive hover:underline"
            >
              <RotateCcw className="h-3 w-3" /> Reiniciar progreso
            </button>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function TubeMini({ label, color, fillPct }: { label: string; color: string; fillPct: number }) {
  const h = Math.max(0, Math.min(1, fillPct)) * 140;
  const topY = 192 - h;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 60 200" width={42} height={120}>
        <rect x="10" y="0" width="40" height="12" rx="2" fill="#7f7f8a" />
        <path
          d="M 12 18 L 48 18 L 48 170 Q 48 192 30 192 Q 12 192 12 170 Z"
          fill="#fafafa"
          stroke="#aaa"
          strokeWidth="1.2"
        />
        <defs>
          <clipPath id={`tm-${label}`}>
            <path d="M 14 20 L 46 20 L 46 169 Q 46 190 30 190 Q 14 190 14 169 Z" />
          </clipPath>
        </defs>
        {h > 0 && (
          <rect x="14" y={topY} width="32" height={h} fill={color} clipPath={`url(#tm-${label})`} />
        )}
      </svg>
      <div className="font-mono text-[10px] font-semibold">{label}</div>
    </div>
  );
}

type TubeImg = { label: string; color: string; fillPct: number };
function isTubeImgArray(v: unknown): v is TubeImg[] {
  return (
    Array.isArray(v) &&
    v.every((r) => r && typeof r === "object" && "label" in r && "color" in r && "fillPct" in r)
  );
}

function AttemptDetails({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data);
  if (entries.length === 0) return <div className="text-muted-foreground">Sin datos.</div>;
  return (
    <div className="space-y-2">
      {entries.map(([key, value]) => {
        if (key === "imagenes_tubos" && isTubeImgArray(value)) {
          return (
            <div key={key}>
              <div className="mb-1 font-semibold text-foreground">Tubos</div>
              <div className="flex flex-wrap gap-2 rounded border border-border bg-secondary/40 p-2">
                {value.map((t) => (
                  <TubeMini key={t.label} {...t} />
                ))}
              </div>
            </div>
          );
        }
        return <DetailField key={key} label={key} value={value} />;
      })}
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: unknown }) {
  const prettyLabel = label.replace(/_/g, " ");
  if (value === null || value === undefined || value === "") {
    return (
      <div className="grid grid-cols-[140px_1fr] gap-2">
        <span className="font-semibold capitalize text-muted-foreground">{prettyLabel}:</span>
        <span className="text-muted-foreground">—</span>
      </div>
    );
  }
  if (Array.isArray(value)) {
    const isObjectArr = value.length > 0 && typeof value[0] === "object" && value[0] !== null;
    if (isObjectArr) {
      const rows = value as Record<string, unknown>[];
      const cols = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
      return (
        <div>
          <div className="mb-1 font-semibold capitalize text-foreground">{prettyLabel}</div>
          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full text-[10.5px]">
              <thead className="bg-secondary text-muted-foreground">
                <tr>
                  {cols.map((c) => (
                    <th key={c} className="px-2 py-1 text-left font-medium capitalize">
                      {c.replace(/_/g, " ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t border-border">
                    {cols.map((c) => (
                      <td key={c} className="px-2 py-1 align-top font-mono text-foreground">
                        {formatPrimitive(r[c])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    function escapeHtml(s: string): string {
      return s.replace(
        /[&<>"']/g,
        (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
      );
    }
    return (
      <div className="grid grid-cols-[140px_1fr] gap-2">
        <span className="font-semibold capitalize text-muted-foreground">{prettyLabel}:</span>
        <span className="font-mono text-foreground">
          {(value as unknown[]).map(formatPrimitive).join(", ")}
        </span>
      </div>
    );
  }
  if (typeof value === "object") {
    return (
      <div>
        <div className="mb-1 font-semibold capitalize text-foreground">{prettyLabel}</div>
        <div className="ml-3 space-y-1 border-l border-border pl-3">
          {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
            <DetailField key={k} label={k} value={v} />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2">
      <span className="font-semibold capitalize text-muted-foreground">{prettyLabel}:</span>
      <span className="font-mono text-foreground">{formatPrimitive(value)}</span>
    </div>
  );
}

function formatPrimitive(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "sí" : "no";
  if (typeof v === "number") return String(v);
  return String(v);
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}
