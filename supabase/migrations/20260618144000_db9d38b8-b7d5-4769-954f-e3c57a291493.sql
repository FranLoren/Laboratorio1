DROP POLICY IF EXISTS "Anyone can submit a lab report" ON public.lab_submissions;
CREATE POLICY "Anyone can submit a validated lab report"
ON public.lab_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(nombre) BETWEEN 1 AND 80
  AND char_length(apellidos) BETWEEN 1 AND 120
  AND char_length(correo) BETWEEN 3 AND 160
  AND correo ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND char_length(seccion) BETWEEN 1 AND 40
  AND puntaje_global >= 0 AND puntaje_global <= 100
  AND char_length(nivel) BETWEEN 1 AND 40
  AND tiempo_total_seg >= 0 AND tiempo_total_seg <= 86400
);