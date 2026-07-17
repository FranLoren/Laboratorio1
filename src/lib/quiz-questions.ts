// Banco de preguntas con justificación para los módulos experimentales (M3-M6).
// Cada pregunta tiene alternativas de respuesta y de justificación.
// `correctAnswer` y `correctJustification` son los índices correctos (0-based).
// `explanation` se muestra SOLO al finalizar el módulo.

export type JustifiedQuestion = {
  id: string;
  prompt: string;
  answers: string[];
  justifications: string[];
  correctAnswer: number;
  correctJustification: number;
  explanation: string;
};

export const M3_QUIZ: JustifiedQuestion[] = [
  {
    id: "m3-q1",
    prompt:
      "¿Cuáles de los errores observados produjeron cambios más evidentes en la intensidad del color respecto al control?",
    answers: [
      "Tubos B y G",
      "Tubos C y F",
      "Tubos D y E",
      "Todos los tubos mostraron el mismo cambio",
    ],
    justifications: [
      "Porque fueron los únicos tubos preparados sin agua.",
      "Porque aumentaron la cantidad efectiva de KMnO₄ respecto al control.",
      "Porque el orden de adición determina la concentración final.",
      "Porque contienen burbujas visibles.",
    ],
    correctAnswer: 0,
    correctJustification: 1,
    explanation:
      "Los tubos B y G producen un aumento de la cantidad efectiva de KMnO₄ respecto al control, generando una coloración más intensa.",
  },
  {
    id: "m3-q2",
    prompt: "¿Qué diferencia existe entre un error sistemático y un error aleatorio?",
    answers: [
      "El sistemático afecta la exactitud y el aleatorio la precisión.",
      "El sistemático afecta la precisión y el aleatorio la exactitud.",
      "Ambos afectan exactamente lo mismo.",
      "Ninguno modifica los resultados experimentales.",
    ],
    justifications: [
      "Porque los errores aleatorios siempre aumentan la concentración.",
      "Porque el error sistemático produce un sesgo constante, mientras el aleatorio genera variabilidad impredecible.",
      "Porque los errores sistemáticos sólo ocurren en soluciones coloreadas.",
      "Porque los errores aleatorios pueden corregirse matemáticamente en todos los casos.",
    ],
    correctAnswer: 0,
    correctJustification: 1,
    explanation:
      "El error sistemático introduce un sesgo constante que afecta la exactitud; el aleatorio genera variabilidad impredecible que afecta la precisión.",
  },
  {
    id: "m3-q3",
    prompt: "¿Por qué las burbujas afectan la precisión de una medición?",
    answers: [
      "Porque aumentan la densidad del líquido.",
      "Porque modifican el volumen real transferido.",
      "Porque cambian la composición química del KMnO₄.",
      "Porque disminuyen la temperatura de la muestra.",
    ],
    justifications: [
      "Porque parte del volumen aspirado corresponde a aire y no a líquido.",
      "Porque el aire reacciona químicamente con el agua.",
      "Porque las burbujas cambian el color del KMnO₄.",
      "Porque la micropipeta deja de funcionar.",
    ],
    correctAnswer: 1,
    correctJustification: 0,
    explanation:
      "Las burbujas ocupan parte del volumen aspirado por aire, alterando el volumen real transferido y, con ello, la precisión.",
  },
];

export const M4_QUIZ: JustifiedQuestion[] = [
  {
    id: "m4-q1",
    prompt: "¿Cuál técnica suele presentar menor error con líquidos viscosos como el glicerol?",
    answers: [
      "Pipeteo normal",
      "Pipeteo reverso",
      "Ambas presentan siempre el mismo error",
      "Ninguna puede utilizarse con glicerol",
    ],
    justifications: [
      "Porque el pipeteo reverso compensa mejor la retención de líquido en la punta.",
      "Porque utiliza una micropipeta distinta.",
      "Porque evita completamente la formación de menisco.",
      "Porque aumenta la densidad del líquido.",
    ],
    correctAnswer: 1,
    correctJustification: 0,
    explanation:
      "Con líquidos viscosos el pipeteo reverso compensa la retención de líquido en la punta, reduciendo el error de medición.",
  },
  {
    id: "m4-q2",
    prompt: "¿Qué indica una baja variabilidad entre réplicas?",
    answers: ["Alta precisión.", "Baja exactitud.", "Mayor concentración.", "Menor volumen."],
    justifications: [
      "Porque las mediciones son consistentes entre sí.",
      "Porque todas las mediciones son idénticas al valor teórico.",
      "Porque se utilizó agua destilada.",
      "Porque se trabajó con tres réplicas.",
    ],
    correctAnswer: 0,
    correctJustification: 0,
    explanation:
      "La baja variabilidad entre réplicas refleja alta precisión: las mediciones son consistentes entre sí, independientemente de su exactitud.",
  },
];

export const M5_QUIZ: JustifiedQuestion[] = [
  {
    id: "m5-q1",
    prompt: "¿Qué relación existe entre la concentración de KMnO₄ y la intensidad del color?",
    answers: [
      "A mayor concentración, mayor intensidad de color.",
      "A mayor concentración, menor intensidad de color.",
      "No existe relación.",
      "Depende sólo del volumen final.",
    ],
    justifications: [
      "Porque existe una mayor cantidad de moléculas coloreadas por unidad de volumen.",
      "Porque el agua intensifica el color.",
      "Porque el color depende únicamente del tubo utilizado.",
      "Porque el KMnO₄ pierde color al concentrarse.",
    ],
    correctAnswer: 0,
    correctJustification: 0,
    explanation:
      "A mayor concentración hay más moléculas coloreadas por unidad de volumen, lo que se traduce en una mayor intensidad de color.",
  },
  {
    id: "m5-q2",
    prompt: "Si se agrega más agua de la calculada, ¿qué ocurre?",
    answers: [
      "La concentración aumenta.",
      "La concentración disminuye.",
      "La concentración no cambia.",
      "El factor de dilución disminuye.",
    ],
    justifications: [
      "Porque aumenta la cantidad de KMnO₄.",
      "Porque el mismo soluto queda distribuido en un volumen mayor.",
      "Porque el agua no afecta las diluciones.",
      "Porque aumenta la masa molecular del soluto.",
    ],
    correctAnswer: 1,
    correctJustification: 1,
    explanation:
      "Al añadir más diluyente, la misma cantidad de soluto queda distribuida en un volumen mayor, por lo que la concentración disminuye.",
  },
];

export const M6_QUIZ: JustifiedQuestion[] = [
  {
    id: "m6-q1",
    prompt: "¿Cómo debería cambiar la intensidad del color a medida que avanza la serie?",
    answers: [
      "Debe aumentar progresivamente.",
      "Debe disminuir progresivamente.",
      "Debe mantenerse constante.",
      "Debe variar aleatoriamente.",
    ],
    justifications: [
      "Porque cada tubo contiene más KMnO₄ que el anterior.",
      "Porque cada dilución reduce la concentración respecto al tubo previo.",
      "Porque el volumen final es siempre el mismo.",
      "Porque el vórtex elimina el color.",
    ],
    correctAnswer: 1,
    correctJustification: 1,
    explanation:
      "En una dilución seriada cada paso reduce la concentración respecto al tubo previo, por lo que el color se atenúa progresivamente.",
  },
  {
    id: "m6-q2",
    prompt: "¿Por qué es importante mezclar antes de transferir al siguiente tubo?",
    answers: [
      "Para evitar errores acumulativos en la serie.",
      "Para aumentar la concentración.",
      "Para disminuir el volumen final.",
      "Para cambiar el factor de dilución.",
    ],
    justifications: [
      "Porque la solución debe ser homogénea antes de tomar una alícuota representativa.",
      "Porque el vórtex agrega solvente.",
      "Porque aumenta la cantidad de soluto.",
      "Porque elimina completamente los errores de pipeteo.",
    ],
    correctAnswer: 0,
    correctJustification: 0,
    explanation:
      "Si no se homogeneiza, la alícuota tomada no será representativa de la concentración del tubo y los errores se acumularán en toda la serie.",
  },
];
