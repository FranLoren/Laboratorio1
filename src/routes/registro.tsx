import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/lab/AppShell";
import { useLabStore } from "@/store/lab-store";
import { UserRound, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/registro")({
  head: () => ({
    meta: [
      { title: "Registro · Prelab Bioquímica UCT" },
      {
        name: "description",
        content: "Regístrate para comenzar la simulación del prelaboratorio.",
      },
    ],
  }),
  component: RegistroPage,
});

function RegistroPage() {
  const navigate = useNavigate();
  const existing = useLabStore((s) => s.student);
  const setStudent = useLabStore((s) => s.setStudent);
  const startSession = useLabStore((s) => s.startSession);

  const [nombre, setNombre] = useState(existing?.nombre ?? "");
  const [apellidos, setApellidos] = useState(existing?.apellidos ?? "");
  const [correo, setCorreo] = useState(existing?.correo ?? "");
  const [seccion, setSeccion] = useState(existing?.seccion ?? "");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!nombre.trim() || !apellidos.trim() || !correo.trim() || !seccion.trim()) {
      setError("Completa todos los campos.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      setError("Correo institucional no válido.");
      return;
    }
    setStudent({
      nombre: nombre.trim(),
      apellidos: apellidos.trim(),
      correo: correo.trim(),
      seccion: seccion.trim(),
    });
    startSession();
    navigate({ to: "/modulos" });
  };

  return (
    <AppShell
      title="Registro de estudiante"
      subtitle="Tu progreso se guarda automáticamente en este dispositivo."
      back="/"
    >
      <div className="mx-auto max-w-xl">
        <form onSubmit={submit} className="lab-card space-y-4 p-6 sm:p-8">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-primary">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Identifícate</h2>
              <p className="text-xs text-muted-foreground">Datos requeridos por la asignatura.</p>
            </div>
          </div>

          <Field label="Nombre" value={nombre} onChange={setNombre} placeholder="Camila" />
          <Field
            label="Apellidos"
            value={apellidos}
            onChange={setApellidos}
            placeholder="González Pérez"
          />
          <Field
            label="Correo institucional"
            value={correo}
            onChange={setCorreo}
            placeholder="cgonzalez@alu.uct.cl"
            type="email"
          />
          <Field
            label="Sección"
            value={seccion}
            onChange={setSeccion}
            placeholder="Ej. TM-2025-A"
          />

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Continuar al hub de módulos <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}
