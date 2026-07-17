import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, LayoutGrid } from "lucide-react";
import type { ReactNode } from "react";
import { useLabStore } from "@/store/lab-store";

export function AppShell({
  children,
  title,
  subtitle,
  back,
  right,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  back?: string;
  right?: ReactNode;
}) {
  const student = useLabStore((s) => s.student);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/85 backdrop-blur supports-[backdrop-filter]:bg-card/70">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/logo-tec-medica.png"
              alt="Universidad Católica de Temuco · Tecnología Médica"
              className="h-14 w-auto object-contain"
            />
            <span className="text-lg font-bold text-foreground">Laboratorio N°1</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            {pathname !== "/" && pathname !== "/modulos" && (
              <Link
                to="/modulos"
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-secondary"
              >
                <LayoutGrid className="h-3.5 w-3.5" /> Módulos
              </Link>
            )}
            {student && (
              <div className="hidden text-right sm:block">
                <div className="text-xs font-semibold text-foreground">
                  {student.nombre} {student.apellidos}
                </div>
                <div className="text-[11px] text-muted-foreground">Sección {student.seccion}</div>
              </div>
            )}
          </div>
        </div>
      </header>

      {(title || back) && (
        <div className="border-b border-border bg-card/40">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 sm:px-6">
            {back && (
              <Link
                to={back}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Volver
              </Link>
            )}
            <div>
              {title && (
                <h1 className="text-lg font-semibold leading-tight text-foreground sm:text-xl">
                  {title}
                </h1>
              )}
              {subtitle && <p className="text-xs text-muted-foreground sm:text-sm">{subtitle}</p>}
            </div>
            {right && <div className="ml-auto">{right}</div>}
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
