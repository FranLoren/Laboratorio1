// Datos del protocolo de laboratorio N°1
// Bioquímica Humana TEMD1143 — UCT

export const MODULES = [
  {
    id: 0,
    slug: "diagnostico",
    title: "Diagnóstico Inicial",
    short: "M0",
    desc: "Evalúa tus conocimientos previos.",
  },
  {
    id: 1,
    slug: "micropipetas",
    title: "Micropipetas",
    short: "M1",
    desc: "Conoce tipos, rangos y partes de las micropipetas.",
  },
  {
    id: 2,
    slug: "tecnica-pipeteo",
    title: "Técnica de Pipeteo",
    short: "M2",
    desc: "Aprende la técnica correcta de pipeteo.",
  },
  {
    id: 3,
    slug: "errores-pipeteo",
    title: "Errores de Pipeteo",
    short: "M3",
    desc: "Identifica errores comunes al pipetear.",
  },
  {
    id: 4,
    slug: "normal-vs-reverso",
    title: "Pipeteo Normal vs Reverso",
    short: "M4",
    desc: "Compara pipeteo normal y reverso.",
  },
  {
    id: 5,
    slug: "dilucion-simple",
    title: "Dilución Simple",
    short: "M5",
    desc: "Realiza una dilución simple paso a paso.",
  },
  {
    id: 6,
    slug: "dilucion-seriada",
    title: "Dilución Seriada",
    short: "M6",
    desc: "Ejecuta una dilución seriada.",
  },
  {
    id: 7,
    slug: "evaluacion-final",
    title: "Evaluación Final",
    short: "M7",
    desc: "Pon a prueba lo aprendido.",
  },
] as const;

// --- Micropipetas ---
export type PipetteModel = "P20" | "P100" | "P200" | "P1000";
export const PIPETTES: Record<
  PipetteModel,
  { min: number; max: number; unit: "µL"; color: string }
> = {
  P20: { min: 2, max: 20, unit: "µL", color: "oklch(0.62 0.16 155)" }, // verde
  P100: { min: 10, max: 100, unit: "µL", color: "oklch(0.55 0.18 258)" }, // azul
  P200: { min: 20, max: 200, unit: "µL", color: "oklch(0.65 0.16 75)" }, // amarillo
  P1000: { min: 100, max: 1000, unit: "µL", color: "oklch(0.5 0.22 27)" }, // rojo/coral
};

// --- Módulo 3: Errores de Pipeteo (KMnO4) ---
// CONTROL + A..H con volúmenes (µL) de KMnO4 y agua. Concentración relativa (0..1).
export type ErrorTube = {
  id: string;
  label: string;
  kmno4: number;
  agua: number;
  volTotal: number;
  concRel: number;
  fillRel: number;
  color: string;
  errorType: "ninguno" | "sistematico" | "aleatorio";
  errorDesc: string;
};

export const M3_TUBES: ErrorTube[] = [
  {
    id: "CTRL",
    label: "CONTROL",
    kmno4: 50,
    agua: 950,
    volTotal: 1000,
    concRel: 1.0,
    fillRel: 0.5,
    color: "#8815BD",
    errorType: "ninguno",
    errorDesc:
      "Sin error: 950 µL H₂O + 50 µL KMnO₄ con puntas sumergidas. Violeta homogéneo de referencia (≈ 2/4 del tubo).",
  },
  {
    id: "A",
    label: "A",
    kmno4: 25,
    agua: 975,
    volTotal: 1000,
    concRel: 0.5,
    fillRel: 0.5,
    color: "#D7A8F0",
    errorType: "sistematico",
    errorDesc:
      "Volumen menor: 25 µL KMnO₄ + 975 µL H₂O. Violeta tenue, claramente menos intenso (≈ 2/4 del tubo, −50%).",
  },
  {
    id: "B",
    label: "B",
    kmno4: 100,
    agua: 900,
    volTotal: 1000,
    concRel: 2.0,
    fillRel: 0.5,
    color: "#4A006E",
    errorType: "sistematico",
    errorDesc:
      "Volumen mayor: 100 µL KMnO₄ + 900 µL H₂O. Violeta muy intenso, más oscuro que el control (≈ 2/4 del tubo, +100%).",
  },
  {
    id: "C",
    label: "C",
    kmno4: 50,
    agua: 950,
    volTotal: 1000,
    concRel: 0.8,
    fillRel: 0.375,
    color: "#C58BE6",
    errorType: "aleatorio",
    errorDesc:
      "Punta parcialmente fuera del solvente: aspirado con burbujas, intensidad menor e inconsistente (≈ 3/8 del tubo, −10 a −30%).",
  },
  {
    id: "D",
    label: "D",
    kmno4: 50,
    agua: 950,
    volTotal: 1000,
    concRel: 1.0,
    fillRel: 0.5,
    color: "#8815BD",
    errorType: "ninguno",
    errorDesc:
      "KMnO₄ primero (50 µL) y luego 950 µL H₂O. Color prácticamente indistinguible del control (≈ 2/4 del tubo).",
  },
  {
    id: "E",
    label: "E",
    kmno4: 50,
    agua: 950,
    volTotal: 1000,
    concRel: 0.93,
    fillRel: 0.5,
    color: "#CBEBF8",
    errorType: "aleatorio",
    errorDesc:
      "KMnO₄ dispensado en la pared superior del tubo: gota retenida en la pared, ligeramente más clara (≈ 2/4, −2 a −10%).",
  },
  {
    id: "F",
    label: "F",
    kmno4: 50,
    agua: 950,
    volTotal: 1000,
    concRel: 0.95,
    fillRel: 0.375,
    color: "#9A53C6",
    errorType: "aleatorio",
    errorDesc:
      "Aspiración/dispensación muy rápida (burbujas): color impredecible y pueden observarse burbujas durante la preparación (≈ 3/8 del tubo, −20 a +10%).",
  },
  {
    id: "G",
    label: "G",
    kmno4: 50,
    agua: 950,
    volTotal: 1000,
    concRel: 1.2,
    fillRel: 0.75,
    color: "#65108F",
    errorType: "sistematico",
    errorDesc:
      "Aspiración hasta el segundo tope: violeta más intenso que el control (≈ 3/4 del tubo, +10 a +30%).",
  },
  {
    id: "H",
    label: "H",
    kmno4: 50,
    agua: 950,
    volTotal: 1000,
    concRel: 1.04,
    fillRel: 0.75,
    color: "#7A12AB",
    errorType: "sistematico",
    errorDesc:
      "Pipeteo inverso incorrecto del agua: diferencia sutil, ligeramente más oscura que el control (≈ 3/4 del tubo, +2 a +5%).",
  },
];

// --- Módulo 5: Dilución Simple ---
// Stock KMnO4 0.1 M. Volumen final 1000 µL por tubo.
export type SimpleTube = {
  id: string;
  cFinal_mM: number; // concentración objetivo en mM
  vStock_uL: number; // volumen de stock necesario
  vAgua_uL: number; // volumen de agua
  FD: number; // factor de dilución
};
const STOCK_M5 = 100; // mM = 0.1 M
const VFINAL_M5 = 1000; // µL
export const M5_TUBES: SimpleTube[] = [
  {
    id: "S1",
    cFinal_mM: 50,
    vStock_uL: VFINAL_M5 * (50 / STOCK_M5),
    vAgua_uL: VFINAL_M5 - VFINAL_M5 * (50 / STOCK_M5),
    FD: STOCK_M5 / 50,
  },
  {
    id: "S2",
    cFinal_mM: 25,
    vStock_uL: VFINAL_M5 * (25 / STOCK_M5),
    vAgua_uL: VFINAL_M5 - VFINAL_M5 * (25 / STOCK_M5),
    FD: STOCK_M5 / 25,
  },
  {
    id: "S3",
    cFinal_mM: 12.5,
    vStock_uL: VFINAL_M5 * (12.5 / STOCK_M5),
    vAgua_uL: VFINAL_M5 - VFINAL_M5 * (12.5 / STOCK_M5),
    FD: STOCK_M5 / 12.5,
  },
  {
    id: "S4",
    cFinal_mM: 6.25,
    vStock_uL: VFINAL_M5 * (6.25 / STOCK_M5),
    vAgua_uL: VFINAL_M5 - VFINAL_M5 * (6.25 / STOCK_M5),
    FD: STOCK_M5 / 6.25,
  },
  {
    id: "S5",
    cFinal_mM: 3.125,
    vStock_uL: VFINAL_M5 * (3.125 / STOCK_M5),
    vAgua_uL: VFINAL_M5 - VFINAL_M5 * (3.125 / STOCK_M5),
    FD: STOCK_M5 / 3.125,
  },
  {
    id: "S6",
    cFinal_mM: 1.5625,
    vStock_uL: VFINAL_M5 * (1.5625 / STOCK_M5),
    vAgua_uL: VFINAL_M5 - VFINAL_M5 * (1.5625 / STOCK_M5),
    FD: STOCK_M5 / 1.5625,
  },
  {
    id: "S7",
    cFinal_mM: 0.78125,
    vStock_uL: VFINAL_M5 * (0.78125 / STOCK_M5),
    vAgua_uL: VFINAL_M5 - VFINAL_M5 * (0.78125 / STOCK_M5),
    FD: STOCK_M5 / 0.78125,
  },
];
export const M5_STOCK_mM = STOCK_M5;
export const M5_STOCK_LABEL = "0.1 M";
export const M5_VFINAL_uL = VFINAL_M5;

// --- Módulo 6: Dilución Seriada FD=2 ---
export type SerialTube = { id: string; conc: number };
export const M6_INITIAL = 1.0;
export const M6_TUBES: SerialTube[] = Array.from({ length: 6 }, (_, i) => ({
  id: `T${i + 1}`,
  conc: M6_INITIAL / Math.pow(2, i),
}));

// --- Módulo 0 & 7: preguntas ---
export type Question = {
  id: string;
  prompt: string;
  options: string[];
  correct: number;
  explanation: string;
  topic:
    "micropipetas" | "rangos" | "volumenes" | "diluciones" | "bioseguridad" | "errores" | "pipeteo";
};

export const QUESTIONS_M0: Question[] = [
  {
    id: "m0-1",
    prompt: "¿Cuál es el rango operativo de una micropipeta P200?",
    options: ["0.5 – 10 µL", "2 – 20 µL", "20 – 200 µL", "100 – 1000 µL"],
    correct: 2,
    explanation:
      "La P200 trabaja entre 20 y 200 µL. Usarla fuera de rango compromete exactitud y precisión.",
    topic: "rangos",
  },
  {
    id: "m0-2",
    prompt: "Para medir 8 µL, la micropipeta de elección es:",
    options: ["P20", "P100", "P200", "P1000"],
    correct: 0,
    explanation:
      "La P20 (2–20 µL) es la única adecuada. Volúmenes pequeños en pipetas grandes tienen alto error.",
    topic: "micropipetas",
  },
  {
    id: "m0-3",
    prompt:
      "Si quiero preparar 1 mL de KMnO₄ 0.01 M a partir de stock 0.1 M, ¿qué volumen de stock uso?",
    options: ["10 µL", "50 µL", "100 µL", "200 µL"],
    correct: 2,
    explanation: "C1V1=C2V2 ⇒ V1 = (0.01·1000)/0.1 = 100 µL de stock + 900 µL de agua.",
    topic: "diluciones",
  },
  {
    id: "m0-4",
    prompt: "El factor de dilución (FD) de una dilución 1:10 es:",
    options: ["0.1", "1", "10", "100"],
    correct: 2,
    explanation: "FD = C inicial / C final = volumen final / volumen de muestra = 10.",
    topic: "diluciones",
  },
  {
    id: "m0-5",
    prompt: "En bioseguridad de laboratorio, lo prioritario antes de pipetear es:",
    options: [
      "Calibrar la balanza",
      "Usar EPP y verificar el área",
      "Etiquetar tubos",
      "Encender el vórtex",
    ],
    correct: 1,
    explanation:
      "Equipo de protección personal y verificación del área son siempre el primer paso.",
    topic: "bioseguridad",
  },
  {
    id: "m0-6",
    prompt: "Un error sistemático se caracteriza por:",
    options: [
      "Variar al azar entre réplicas",
      "Repetirse en la misma dirección y magnitud",
      "Aparecer solo en muestras biológicas",
      "No tener causa identificable",
    ],
    correct: 1,
    explanation:
      "Los errores sistemáticos son reproducibles (sesgo); los aleatorios son impredecibles.",
    topic: "errores",
  },
];

export const QUESTIONS_M7: Question[] = [
  {
    id: "m7-1",
    prompt: "En pipeteo reverso, ¿cuándo se utiliza el 2° tope?",
    options: ["Al aspirar", "Al dispensar", "Al purgar", "Nunca"],
    correct: 0,
    explanation:
      "En reverso se aspira hasta el 2° tope (volumen + exceso) y se dispensa solo al 1° tope.",
    topic: "pipeteo",
  },
  {
    id: "m7-2",
    prompt: "Una dilución seriada con FD=2 partiendo de C=1 M, ¿qué concentración tiene T4?",
    options: ["1/4", "1/8", "1/16", "1/32"],
    correct: 1,
    explanation: "C_n = C₀ / 2^(n-1). T4 = 1 / 2³ = 1/8 M.",
    topic: "diluciones",
  },
  {
    id: "m7-3",
    prompt: "Una pipeta que entrega siempre 105 µL al ajustarla a 100 µL presenta:",
    options: ["Error aleatorio", "Error sistemático", "Buen funcionamiento", "Falla del usuario"],
    correct: 1,
    explanation: "Es un sesgo reproducible — error sistemático típico de descalibración.",
    topic: "errores",
  },
  {
    id: "m7-4",
    prompt: "Al pipetear líquidos viscosos como glicerol, lo recomendable es:",
    options: ["Pipeteo forward", "Pipeteo reverso", "Cualquiera", "Pipeta serológica"],
    correct: 1,
    explanation:
      "El reverso compensa la viscosidad y mejora la exactitud con líquidos densos o espumosos.",
    topic: "pipeteo",
  },
  {
    id: "m7-5",
    prompt: "Si calculas error % = ((real − teórico)/teórico)·100 y obtienes +6%, esto indica:",
    options: ["Sobreestimación sistemática", "Buen resultado", "Error aleatorio", "Contaminación"],
    correct: 0,
    explanation: "Un sesgo positivo y reproducible es un error sistemático por sobreestimación.",
    topic: "errores",
  },
];

export const FINAL_REFLECTION_PROMPTS = [
  "Si se pipetea un volumen menor al calculado en un tubo, ¿cómo afecta esto a la concentración final y al factor de dilución? Explique con un ejemplo concreto de sus tubos.",
  "Compare la uniformidad de color en los tubos S1–S6. ¿Qué inferencia puede hacer sobre la precisión de la pipeta y la técnica de mezcla?",
  "Identifique qué tipo de error es más probable en cada actividad: sistemático (constante) o aleatorio (variable). Justifique su respuesta usando los resultados obtenidos.",
  "Compare las concentraciones finales obtenidas en los tubos de la dilución simple y en los de la dilución seriada. ¿Son iguales? Si observa diferencias, ¿a qué podrían atribuirse?",
  "Si se deseara preparar una concentración muy baja (por ejemplo, 0,0005 M), ¿qué método sería más conveniente y por qué?",
  "Reflexione sobre cómo la técnica de pipeteo y la homogeneización influyen en la interpretación de los resultados experimentales en ambas actividades.",
];

// --- Bioseguridad / introducción ---
export const SAFETY_RULES = [
  "Prohibido el uso de dispositivos electrónicos.",
  "Usar guantes y delantal en todo momento.",
  "Mantener mesón limpio y ordenado, y libre de elementos personales.",
  "Rotular claramente los tubos con marcador indeleble.",
  "Descartar puntas en contenedor de residuos biológicos.",
];
