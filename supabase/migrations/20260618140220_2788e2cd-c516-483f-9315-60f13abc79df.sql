
CREATE TABLE public.lab_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  correo TEXT NOT NULL,
  seccion TEXT NOT NULL,
  puntaje_global NUMERIC NOT NULL DEFAULT 0,
  nivel TEXT NOT NULL DEFAULT 'Iniciado',
  tiempo_total_seg INTEGER NOT NULL DEFAULT 0,
  progreso JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT, SELECT ON public.lab_submissions TO anon;
GRANT SELECT, INSERT ON public.lab_submissions TO authenticated;
GRANT ALL ON public.lab_submissions TO service_role;

ALTER TABLE public.lab_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a lab report"
  ON public.lab_submissions FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read their own submission by email match disabled"
  ON public.lab_submissions FOR SELECT TO anon, authenticated
  USING (false);
