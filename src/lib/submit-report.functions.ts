import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SubmissionSchema = z.object({
  nombre: z.string().min(1).max(80),
  apellidos: z.string().min(1).max(120),
  correo: z.string().email().max(160),
  seccion: z.string().min(1).max(40),
  puntaje_global: z.number().min(0).max(100),
  nivel: z.string().min(1).max(40),
  tiempo_total_seg: z
    .number()
    .int()
    .min(0)
    .max(60 * 60 * 24),
  progreso: z.record(z.any()),
});

export const submitLabReport = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SubmissionSchema.parse(input))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false, storage: undefined } },
    );
    const { error } = await supabase.from("lab_submissions").insert({
      nombre: data.nombre,
      apellidos: data.apellidos,
      correo: data.correo,
      seccion: data.seccion,
      puntaje_global: data.puntaje_global,
      nivel: data.nivel,
      tiempo_total_seg: data.tiempo_total_seg,
      progreso: data.progreso,
    });
    if (error) {
      console.error("[submitLabReport]", error);
      return { ok: false as const, error: "No se pudo enviar el reporte." };
    }
    return { ok: true as const };
  });
