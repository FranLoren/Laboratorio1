import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  RotateCcw,
  AlertTriangle,
  Info,
  Trash2,
  Sparkles,
  HelpCircle,
  Award,
  MousePointerClick,
  Timer,
} from "lucide-react";
import { Finished } from "./Module0";
import { useLabStore } from "@/store/lab-store";

type Technique = "forward" | "reverse";

export function Module2({
  onComplete,
}: {
  onComplete: (score: number, details?: Record<string, unknown>) => void;
}) {
  const modProgress = useLabStore((s) => s.modules[2]);
  const isCompletedInStore = modProgress.completed;

  const [tech, setTech] = useState<Technique>("forward");

  // Micropipette physical state
  const [plunger, setPlunger] = useState<"soltado" | "primer-tope" | "segundo-tope">("soltado");
  const [hasTip, setHasTip] = useState(false); // Starts without a tip!
  const [liquidInTip, setLiquidInTip] = useState(0); // 0 (empty), 0.05, 0.2, 1.0 (target), 1.2 (excess)
  const [liquidInDestino, setLiquidInDestino] = useState(0); // 0 to 1.0

  // Simulation status & steps
  const [currentStep, setCurrentStep] = useState(0);
  const [warning, setWarning] = useState<string | null>(null);
  const [lastActionFeedback, setLastActionFeedback] = useState<string | null>(
    "🔬 INICIO: Desplaza el cursor dentro de la mesa de laboratorio. Ve a la Caja de Puntas de la izquierda y haz Click Izquierdo para calzar una punta limpia.",
  );
  const [isStabilizing, setIsStabilizing] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(3);

  // Completed techniques
  const [completedTechs, setCompletedTechs] = useState<Record<Technique, boolean>>(() => {
    if (isCompletedInStore) {
      return { forward: true, reverse: true };
    }
    try {
      const saved = localStorage.getItem("uct-prelab-draft-m2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.completedTechs) return parsed.completedTechs;
      }
    } catch (e) {
      console.debug(e);
    }
    return {
      forward: false,
      reverse: false,
    };
  });

  const [submitted, setSubmitted] = useState<boolean>(() => {
    if (isCompletedInStore) return true;
    try {
      const saved = localStorage.getItem("uct-prelab-draft-m2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.submitted === "boolean") return parsed.submitted;
      }
    } catch (e) {
      console.debug(e);
    }
    return false;
  });

  const [actionHistory, setActionHistory] = useState<
    {
      tecnica: string;
      paso: string;
      accion: string;
      estado: string;
    }[]
  >(() => {
    try {
      const saved = localStorage.getItem("uct-prelab-draft-m2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.actionHistory) return parsed.actionHistory;
      }
    } catch (e) {
      console.debug(e);
    }
    return [];
  });

  const [reviewMode, setReviewMode] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(
        "uct-prelab-draft-m2",
        JSON.stringify({
          completedTechs,
          submitted,
          actionHistory,
        }),
      );
    } catch (e) {
      console.debug(e);
    }
  }, [completedTechs, submitted, actionHistory]);

  const recordAction = (accion: string, isError: boolean = false, customStep?: number) => {
    const stepLabel = `Paso ${(customStep !== undefined ? customStep : currentStep) + 1}`;
    setActionHistory((prev) => {
      // Avoid duplicate logs of the exact same action and step
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        if (
          last.paso === stepLabel &&
          last.accion === accion &&
          last.tecnica === (tech === "forward" ? "Forward" : "Reverse")
        ) {
          return prev;
        }
      }
      return [
        ...prev,
        {
          tecnica: tech === "forward" ? "Forward" : "Reverse",
          paso: stepLabel,
          accion,
          estado: isError ? "⚠️ Error" : "✔️ Correcto",
        },
      ];
    });
  };

  const triggerWarning = (msg: string) => {
    setWarning(msg);
    const cleanMsg = msg.replace(/⚠️/g, "").trim().split(".")[0];
    recordAction(cleanMsg, true);
  };

  const completedAll = completedTechs.forward && completedTechs.reverse;

  const benchRef = useRef<HTMLDivElement>(null);

  // Handle technique selection changes
  const handleTechChange = (newTech: Technique) => {
    setTech(newTech);
    resetSimulation();
  };

  const resetSimulation = () => {
    setPlunger("soltado");
    setHasTip(false);
    setLiquidInTip(0);
    setLiquidInDestino(0);
    setCurrentStep(0);
    setWarning(null);
    setIsDirty(false);
    setLastActionFeedback(
      "🔬 INICIO: Desplaza el cursor dentro de la mesa de laboratorio. Ve a la Caja de Puntas de la izquierda y haz Click Izquierdo para calzar una punta limpia.",
    );
    setIsStabilizing(false);
    setSecondsRemaining(3);
  };

  // Interactive state
  const [mouse, setMouse] = useState({ x: 400, y: 150 });
  const [isHovering, setIsHovering] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Coordinates and regions
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!benchRef.current) return;
    const rect = benchRef.current.getBoundingClientRect();
    const proposedX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const proposedY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    setMouse({ x: proposedX, y: proposedY });

    const t1Center = rect.width * 0.3 + 60;
    const t1Left = t1Center - 28;
    const t1Right = t1Center + 28;

    const isOverOrigen = proposedX >= t1Left && proposedX <= t1Right;
    const isSubmergedOrigen = isOverOrigen && proposedY >= 366;

    const tipSubmersionPercent = isSubmergedOrigen
      ? Math.max(0, Math.min(1, (proposedY - 366) / 89))
      : 0;
    const dirtyState = hasTip && isSubmergedOrigen && tipSubmersionPercent > 0.9;
    setIsDirty(dirtyState);

    // Warning validation: dirtying the pipette
    if (dirtyState && !warning) {
      triggerWarning(
        "⚠️ ¡Micropipeta Contaminada! Sumergiste la micropipeta a más del 90% de la punta, haciendo que el líquido toque el cuerpo plástico del portapuntas (nozzle). Esto contamina el instrumento y requiere desmontaje y limpieza total. Debes reiniciar la técnica.",
      );
    }

    // Warning validation: submerging without compressing plunger beforehand
    if (
      isSubmergedOrigen &&
      !dirtyState &&
      plunger === "soltado" &&
      liquidInTip === 0 &&
      !warning &&
      !isStabilizing &&
      hasTip
    ) {
      triggerWarning(
        "⚠️ ¡Alerta de Burbujas! Sumergiste la punta limpia en el reactivo líquido con el émbolo suelto. Al presionar el émbolo ahora adentro de la solución, soplaras aire generando burbujeo violento y variaciones críticas de volumen.",
      );
    }

    // Warning validation: raising the tip during stabilization or moving to low depth (< 20%)
    if (isStabilizing && (!isSubmergedOrigen || tipSubmersionPercent < 0.2)) {
      setIsStabilizing(false);
      setSecondsRemaining(3);
      triggerWarning(
        "⚠️ ¡Error Crítico de Burbuja! Retiraste la punta del líquido (o bajaste la inmersión por debajo del 20% recomendado) antes de que finalizara el tiempo de estabilización (3 segundos). Esto causa entrada inmediata de aire arruinando la precisión de la alícuota.",
      );
    }
  };

  // Wheel handler to act as the tactile scrolling plunger mechanism
  // Unified plunger state transition executor
  const executePlungerStep = (scrollDown: boolean) => {
    if (!benchRef.current || warning) return;
    const rect = benchRef.current.getBoundingClientRect();

    const t1Center = rect.width * 0.3 + 60;
    const t1Left = t1Center - 28;
    const t1Right = t1Center + 28;

    const t2Center = rect.width * 0.54 + 60;
    const t2Left = t2Center - 24;
    const t2Right = t2Center + 24;

    const isOverOrigen = mouse.x >= t1Left && mouse.x <= t1Right;
    const isSubmergedOrigen = isOverOrigen && mouse.y >= 366;

    const isOverDestino = mouse.x >= t2Left && mouse.x <= t2Right;
    const isInsideDestino = isOverDestino && mouse.y >= 322;

    // Plunger control requires active tip
    if (!hasTip) {
      triggerWarning(
        "⚠️ ¡Punta faltante! Primero debes colocar una punta limpia de la caja haciendo Click Izquierdo antes de operar el émbolo.",
      );
      return;
    }

    if (scrollDown) {
      // --- PRESSING DOWN ---
      if (plunger === "soltado") {
        setPlunger("primer-tope");

        if (tech === "forward") {
          if (currentStep === 1) {
            setCurrentStep(2);
            setLastActionFeedback(
              "⬇️ Émbolo en 1° Tope (Suave). Mantén el émbolo presionado y sumerge la punta en el frasco Origen.",
            );
            recordAction("Presionó émbolo al primer tope");
          } else if (isSubmergedOrigen && liquidInTip === 0) {
            triggerWarning(
              "⚠️ ¡Alerta de Burbujas! Presionaste el émbolo hacia abajo con la punta sumergida en la solución. Soplaste aire, generando burbujas y alterando la calibración del volumen.",
            );
          }
        } else {
          // Reverse: first click/scroll down
          if (currentStep === 1) {
            setLastActionFeedback(
              "⬇️ Émbolo en 1° Tope... Continúa con un scroll hacia abajo adicional para llegar al 2° tope (purgar/exceso).",
            );
          }
        }
      } else if (plunger === "primer-tope") {
        setPlunger("segundo-tope");

        if (tech === "forward") {
          if (currentStep === 7 && isInsideDestino) {
            setLiquidInTip(0);
            setLiquidInDestino(1.0);
            setCurrentStep(8);
            setLastActionFeedback(
              "💥 2° Tope activado (Purga): Se expulsó el 5% restante de la gota. Retira la pipeta de forma segura y llévala al Descarte.",
            );
            recordAction("Pulsó émbolo al segundo tope (Purga completa)");
          } else if (isInsideDestino && currentStep < 7) {
            triggerWarning(
              "⚠️ ¡Error de Técnica! Presionaste al segundo tope antes de tiempo, alterando el volumen exacto dispensado.",
            );
          }
        } else {
          // Reverse: second scroll down (deep press)
          if (currentStep === 1) {
            setCurrentStep(2);
            setLastActionFeedback(
              "💥 Émbolo a fondo en 2° Tope (Exceso de aire preparado). Ahora sumerge la punta en el frasco de Origen.",
            );
            recordAction("Presionó émbolo al segundo tope (Cargar aire + exceso)");
          } else if (currentStep === 6 && isInsideDestino) {
            // Critical error in Reverse: Purging excess into receptor tube!
            setLiquidInDestino(1.2);
            setLiquidInTip(0);
            triggerWarning(
              "⚠️ ¡Error de Técnica Reverse! Presionaste hasta el 2° tope dentro del tubo de destino. Esto vació el exceso de líquido retenido (200 µL) dentro de la muestra, arruinando la precisión analítica.",
            );
          }
        }
      }
    } else {
      // --- RELEASING THE PRESS ---
      if (plunger === "segundo-tope") {
        setPlunger("primer-tope");

        if (tech === "reverse" && currentStep === 3 && isSubmergedOrigen) {
          setLastActionFeedback(
            "⬆️ Soltando émbolo... Continúa haciendo scroll hacia arriba hasta liberarlo completamente para aspirar.",
          );
        }
      } else if (plunger === "primer-tope") {
        setPlunger("soltado");

        if (tech === "forward") {
          if (currentStep === 3 && isSubmergedOrigen) {
            const tipSubmersionPercent = Math.max(0, Math.min(1, (mouse.y - 366) / 89));
            if (tipSubmersionPercent < 0.2) {
              triggerWarning(
                "⚠️ ¡Alerta de Burbujas! Intentaste aspirar volumen con la punta sumergida a menos del 20% (insuficiente profundidad). Esto genera un vórtice que aspira aire y produce burbujas en la alícuota.",
              );
            } else if (tipSubmersionPercent > 0.9) {
              triggerWarning(
                "⚠️ ¡Micropipeta Contaminada! La punta estaba sumergida a más del 90%, haciendo que el líquido toque el cuerpo plástico de la micropipeta. Debes reiniciar.",
              );
            } else {
              // Sucking up under Forward technique
              setIsStabilizing(true);
              setSecondsRemaining(3);
              setCurrentStep(4);
              setLastActionFeedback(
                "⏳ Soltaste el émbolo lentamente. El líquido comienza a subir. Mantén la punta quieta bajo la solución.",
              );
              recordAction("Soltó el émbolo lentamente (Iniciando absorción)");
            }
          } else if (currentStep === 3 && !isSubmergedOrigen) {
            setLastActionFeedback(
              "⚠️ Soltaste el émbolo en el aire. No se absorbió reactivo. Vuelve a bajar el émbolo al primer tope e inténtalo de nuevo.",
            );
          }
        } else {
          // Reverse complete release
          if (currentStep === 3 && isSubmergedOrigen) {
            const tipSubmersionPercent = Math.max(0, Math.min(1, (mouse.y - 366) / 89));
            if (tipSubmersionPercent < 0.2) {
              triggerWarning(
                "⚠️ ¡Alerta de Burbujas! Intentaste aspirar volumen con la punta sumaged a menos del 20% (insuficiente profundidad). Esto genera un vórtice que aspira aire y produce burbujas en la alícuota.",
              );
            } else if (tipSubmersionPercent > 0.9) {
              triggerWarning(
                "⚠️ ¡Micropipeta Contaminada! La punta estaba sumergida a más del 90%, haciendo que el líquido toque el cuerpo plástico de la micropipeta. Debes reiniciar.",
              );
            } else {
              setIsStabilizing(true);
              setSecondsRemaining(3);
              setCurrentStep(4);
              setLastActionFeedback(
                "⏳ Émbolo liberado. Aspirando reactivo más volumen de exceso. Mantén la punta sumergida para estabilizar.",
              );
              recordAction("Soltó el émbolo lentamente (Iniciando absorción con exceso)");
            }
          } else if (currentStep === 3) {
            setLastActionFeedback(
              "⚠️ Liberaste la presión en el aire. No se cargó reactivo. Presiona hasta el 2° tope antes de sumergir.",
            );
          }
        }
      }
    }
  };

  // Wheel handler to act as the tactile scrolling plunger mechanism
  const lastWheelTime = useRef<number>(0);
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault(); // Stop window from scrolling while playing

    const now = Date.now();
    if (now - lastWheelTime.current < 150) return;
    lastWheelTime.current = now;

    const scrollDown = e.deltaY > 0;
    executePlungerStep(scrollDown);
  };

  // Keyboard control listener for Shift + ArrowDown and Shift + ArrowUp
  const executePlungerStepRef = useRef(executePlungerStep);
  useEffect(() => {
    executePlungerStepRef.current = executePlungerStep;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is inside a form or text field
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.isContentEditable)
      ) {
        return;
      }

      if (e.shiftKey) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          executePlungerStepRef.current(true);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          executePlungerStepRef.current(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Countdown timer effect for fluid stabilization (2-3 seconds as requested)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isStabilizing && secondsRemaining > 0) {
      timer = setTimeout(() => {
        setSecondsRemaining((s) => s - 1);
      }, 1000);
    } else if (isStabilizing && secondsRemaining === 0) {
      setIsStabilizing(false);
      if (tech === "forward") {
        setLiquidInTip(1.0);
        setCurrentStep(4);
        setLastActionFeedback(
          "✨ ¡Columna estabilizada! 1000 µL exactos en la punta. Retira la micropipeta verticalmente del frasco.",
        );
        recordAction("Finalizó estabilización. Columna de 1000 µL cargada", false, 4);
      } else {
        setLiquidInTip(1.2); // Target + Excess
        setCurrentStep(4);
        setLastActionFeedback(
          "✨ ¡Columna estabilizada! 1000 µL + 200 µL de exceso aspirados. Retira la micropipeta verticalmente.",
        );
        recordAction("Finalizó estabilización. Columna de 1200 µL cargada (con exceso)", false, 4);
      }
    }
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStabilizing, secondsRemaining, tech]);

  // Smoothly increment liquidInTip during stabilization (~60fps rise)
  useEffect(() => {
    if (!isStabilizing) return;

    const startTime = Date.now();
    const duration = 3000; // 3 seconds
    const targetVal = tech === "forward" ? 1.0 : 1.2;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      setLiquidInTip(Number((progress * targetVal).toFixed(3)));
      if (progress >= 1) {
        clearInterval(interval);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [isStabilizing, tech]);

  // Handle click events
  // - Left Click: Load tip inside "Caja de Puntas"
  // - Right Click: Eject tip inside "Descarte"
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!benchRef.current) return;

    const rect = benchRef.current.getBoundingClientRect();
    const px = mouse.x / rect.width;
    const py = mouse.y / rect.height;

    const isOverPuntas = px >= 0.04 && px <= 0.22;
    const isInsidePuntas = isOverPuntas && py >= 0.6;

    const isOverDescarte = px >= 0.74 && px <= 0.94;
    const isInsideDescarte = isOverDescarte && py >= 0.63;

    // --- LEFT CLICK: Loading tip ---
    if (e.button === 0) {
      if (currentStep === 0) {
        if (isInsidePuntas) {
          setHasTip(true);
          setCurrentStep(1);
          setLastActionFeedback(
            "✔️ ¡Punta acoplada con firmeza! Ahora haz Scroll Hacia Abajo para presionar el émbolo al primer tope en el aire.",
          );
          recordAction("Calzó punta limpia en la Caja de Puntas", false, 0);
        } else {
          triggerWarning(
            "⚠️ Error de Procedimiento: Debes desplazar la micropipeta justo sobre la Caja de Puntas de la izquierda y hacer Click Izquierdo para calzar una punta limpia.",
          );
        }
      } else if (!hasTip) {
        if (isInsidePuntas) {
          setHasTip(true);
          setPlunger("soltado");
          setLiquidInTip(0);
          setCurrentStep(1);
          setWarning(null);
          setLastActionFeedback("✔️ Punta limpia acoplada. Prepara el émbolo.");
          recordAction("Calzó punta limpia en la Caja de Puntas", false, 0);
        }
      }
    }

    // --- RIGHT CLICK: Ejecting tip (Clack) ---
    if (e.button === 2) {
      if (!hasTip) return;

      if (isInsideDescarte) {
        if (tech === "forward" && currentStep === 8) {
          const finalHistory = [
            ...actionHistory,
            {
              tecnica: "Forward",
              paso: "Paso 9",
              accion: "Eyectó la punta usada en el Descarte. Técnica Forward completada.",
              estado: "✔️ Correcto",
            },
          ];
          setActionHistory(finalHistory);
          setHasTip(false);
          setLiquidInTip(0);
          setCompletedTechs((prev) => {
            const next = { ...prev, forward: true };
            if (next.forward && next.reverse) {
              onComplete(100, {
                tecnicasLogradas: ["forward", "reverse"],
                registro_de_acciones: finalHistory,
              });
            }
            return next;
          });

          if (!completedTechs.reverse) {
            setTech("reverse");
            setPlunger("soltado");
            setHasTip(false);
            setLiquidInTip(0);
            setLiquidInDestino(0);
            setCurrentStep(0);
            setLastActionFeedback(
              "🎉 ¡Técnica Forward másterizada con éxito! Ahora pasemos a la Técnica Reverse. Calza una punta limpia de la caja.",
            );
          } else {
            setCurrentStep(9);
            setLastActionFeedback("🎉 ¡Técnica Forward completada con éxito!");
          }
        } else if (tech === "reverse" && currentStep === 8) {
          const finalHistory = [
            ...actionHistory,
            {
              tecnica: "Reverse",
              paso: "Paso 9",
              accion: "Eyectó la punta usada en el Descarte. Técnica Reverse completada.",
              estado: "✔️ Correcto",
            },
          ];
          setActionHistory(finalHistory);
          setHasTip(false);
          setLiquidInTip(0);
          setCompletedTechs((prev) => {
            const next = { ...prev, reverse: true };
            if (next.forward && next.reverse) {
              onComplete(100, {
                tecnicasLogradas: ["forward", "reverse"],
                registro_de_acciones: finalHistory,
              });
            }
            return next;
          });
          setCurrentStep(9);
          setLastActionFeedback(
            "🎉 ¡Felicidades! Ambas técnicas de pipeteo han sido masterizadas al 100% con precisión microbiológica.",
          );
        } else {
          // Early ejection warning
          setHasTip(false);
          setLiquidInTip(0);
          triggerWarning(
            "⚠️ ¡Punta eyectada antes de tiempo! Has tirado la punta al descarte antes de completar los pasos correctos de la técnica.",
          );
        }
      } else {
        triggerWarning(
          "⚠️ Solo debes eyectar la punta usada dentro del Contenedor de Descarte (zona derecha).",
        );
      }
    }
  };

  // Position transition triggers
  useEffect(() => {
    if (isStabilizing || !benchRef.current) return;
    const rect = benchRef.current.getBoundingClientRect();

    const t1Center = rect.width * 0.3 + 60;
    const t1Left = t1Center - 28;
    const t1Right = t1Center + 28;

    const t2Center = rect.width * 0.54 + 60;
    const t2Left = t2Center - 24;
    const t2Right = t2Center + 24;

    const isOverOrigen = mouse.x >= t1Left && mouse.x <= t1Right;
    const isSubmergedOrigen = isOverOrigen && mouse.y >= 366;

    const isOverDestino = mouse.x >= t2Left && mouse.x <= t2Right;
    const isInsideDestino = isOverDestino && mouse.y >= 322;

    const isOverDescarte = mouse.x / rect.width >= 0.74 && mouse.x / rect.width <= 0.94;
    const isInsideDescarte = isOverDescarte && mouse.y >= 338;

    if (tech === "forward") {
      if (currentStep === 2 && isSubmergedOrigen) {
        setCurrentStep(3);
        setLastActionFeedback(
          "💧 Punta sumergida en Origen. Haz Scroll Hacia Arriba una vez lentamente para aspirar la alícuota.",
        );
      } else if (currentStep === 4 && !isSubmergedOrigen) {
        setCurrentStep(5);
        setLastActionFeedback(
          "📏 Punta fuera del líquido. Desplázate hacia el Tubo de Destino (centro).",
        );
      } else if (currentStep === 5 && isInsideDestino) {
        setCurrentStep(6);
        setLastActionFeedback(
          "🎯 Dentro del tubo de destino. Haz Scroll Hacia Abajo una vez para dispensar el 95% del volumen (1° Tope).",
        );
      } else if (currentStep === 6 && plunger === "primer-tope" && isInsideDestino) {
        setLiquidInTip(0.05); // Remaining 5%
        setLiquidInDestino(0.95);
        setCurrentStep(7);
        setLastActionFeedback(
          "💧 95% dispensado. Haz Scroll Hacia Abajo de nuevo para llegar al 2° tope y purgar la punta.",
        );
      } else if (currentStep === 8 && isInsideDescarte) {
        // Ready to eject
      }
    } else {
      // --- REVERSE TECHNIQUE TRANSITIONS ---
      if (currentStep === 2 && isSubmergedOrigen) {
        setCurrentStep(3);
        setLastActionFeedback(
          "💧 Punta sumergida en Origen. Haz Scroll Hacia Arriba dos veces completamente para succionar muestra + exceso.",
        );
      } else if (currentStep === 4 && !isSubmergedOrigen) {
        setCurrentStep(5);
        setLastActionFeedback(
          "📏 Punta fuera del reactivo. Desplázate horizontalmente hacia el Tubo de Destino (centro).",
        );
      } else if (currentStep === 5 && isInsideDestino) {
        setCurrentStep(6);
        setLastActionFeedback(
          "🎯 Dentro del tubo destino. Haz Scroll Hacia Abajo una vez (1° Tope) para entregar exactamente 1000 µL. El exceso de líquido quedará en la punta.",
        );
      } else if (currentStep === 6 && plunger === "primer-tope" && isInsideDestino) {
        setLiquidInTip(0.2); // Retain excess!
        setLiquidInDestino(1.0);
        setCurrentStep(7);
        setLastActionFeedback(
          "✔️ ¡Excelente entrega! 1000 µL exactos en el destino, y el exceso de 200 µL quedó en la punta. Mueve la micropipeta al Descarte.",
        );
      } else if (currentStep === 7 && isInsideDescarte) {
        setCurrentStep(8);
        setLastActionFeedback(
          "🗑️ Sobre el descarte. Haz Scroll Hacia Abajo para purgar el exceso (2° Tope) y haz Click Derecho para eyectar la punta.",
        );
      }
    }
  }, [mouse, currentStep, tech, isStabilizing, plunger]);

  // Submit final results when completed
  const handleFinalSubmit = () => {
    if (completedTechs.forward && completedTechs.reverse) {
      setSubmitted(true);
      onComplete(100, {
        tecnicasLogradas: ["forward", "reverse"],
        registro_de_acciones: actionHistory,
      });
    }
  };

  if (completedTechs.forward && completedTechs.reverse && !reviewMode) {
    return (
      <div className="space-y-4">
        <Finished
          score={100}
          correct={100}
          total={100}
          onComplete={handleFinalSubmit}
          title="¡Felicidades! Técnicas de Pipeteo Masterizadas"
        />
        <div className="mx-auto max-w-lg text-center">
          <button
            onClick={() => setReviewMode(true)}
            className="text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            🔬 Volver a la mesa de trabajo para explorar la simulación
          </button>
        </div>
      </div>
    );
  }

  // Guidelines texts
  const stepGuides = {
    forward: [
      {
        step: 0,
        text: "Calzar Punta: Posiciónate sobre la Caja de Puntas (izquierda) y haz Click Izquierdo.",
      },
      {
        step: 1,
        text: "Cargar Aire: Fuera del tubo, haz Scroll Hacia Abajo una vez para el 1° Tope.",
      },
      {
        step: 2,
        text: "Sumergir: Desplaza la micropipeta e introdúcela en el frasco morado de Origen.",
      },
      {
        step: 3,
        text: "Aspirar: Haz Scroll Hacia Arriba una vez para liberar el émbolo lentamente.",
      },
      {
        step: 4,
        text: "Estabilizar: Espera que el temporizador llegue a 0 manteniendo la punta sumergida.",
      },
      {
        step: 5,
        text: "Posicionar: Mueve la micropipeta de manera segura e introdúcela en el Tubo de Destino.",
      },
      {
        step: 6,
        text: "Dispensar: Haz Scroll Hacia Abajo una vez para verter el 95% del volumen.",
      },
      {
        step: 7,
        text: "Purgar: Haz Scroll Hacia Abajo de nuevo (2° Tope) para evacuar el 5% restante.",
      },
      {
        step: 8,
        text: "Desechar: Llévala al Descarte (derecha) y haz Click Derecho para eyectar la punta.",
      },
    ],
    reverse: [
      {
        step: 0,
        text: "Calzar Punta: Posiciónate sobre la Caja de Puntas (izquierda) y haz Click Izquierdo.",
      },
      {
        step: 1,
        text: "Cargar Aire: En el aire, haz Scroll Hacia Abajo dos veces para presionar al 2° Tope.",
      },
      {
        step: 2,
        text: "Sumergir: Desplaza la micropipeta e introdúcela en el líquido Origen.",
      },
      {
        step: 3,
        text: "Aspirar Alícuota: Haz Scroll Hacia Arriba dos veces lentamente para absorber líquido + exceso.",
      },
      {
        step: 4,
        text: "Estabilizar: Espera que el temporizador llegue a 0 manteniendo la punta sumergida.",
      },
      {
        step: 5,
        text: "Posicionar: Mueve la micropipeta de manera segura e introdúcela en el Tubo de Destino.",
      },
      {
        step: 6,
        text: "Dispensar: Haz Scroll Hacia Abajo una vez (1° Tope) para entregar el volumen calibrado.",
      },
      {
        step: 7,
        text: "Mover al Descarte: Retira la pipeta del destino con el exceso en la punta y muévela a la derecha.",
      },
      {
        step: 8,
        text: "Purgar y Desechar: Haz Scroll Hacia Abajo para purgar el exceso (2° Tope) y haz Click Derecho para eyectar.",
      },
    ],
  };

  const activeGuide =
    stepGuides[tech].find((s) => s.step === currentStep)?.text || "¡Continúa con la simulación!";

  const tipLiquidHeight = liquidInTip * 38; // Up to 38px max height for precise proportional visual
  const targetLiquidY = 330 - tipLiquidHeight;
  const halfWidthAtY = tipLiquidHeight * (6 / 45); // Extrapolated from top rim width of 12 (half-width 6) at total height of 45

  return (
    <div className="space-y-4">
      {submitted && !reviewMode && (
        <div className="space-y-4">
          <Finished
            score={100}
            correct={100}
            total={100}
            onComplete={() => {}}
            title="Técnicas de pipeteo dominadas"
            showButton={false}
          />

          {actionHistory.length > 0 && (
            <div className="mx-auto max-w-3xl p-4 bg-card border border-border rounded-xl shadow-sm space-y-3 mt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                📋 Registro Histórico de Acciones (Respaldo de tu Práctica):
              </h4>
              <div className="max-h-72 overflow-y-auto rounded-lg border border-border">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-secondary text-muted-foreground border-b border-border sticky top-0">
                      <th className="p-3 font-semibold">Técnica</th>
                      <th className="p-3 font-semibold">Paso</th>
                      <th className="p-3 font-semibold">Acción</th>
                      <th className="p-3 font-semibold text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actionHistory.map((item, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-border/50 last:border-0 hover:bg-secondary/35"
                      >
                        <td className="p-3 font-semibold text-primary">{item.tecnica}</td>
                        <td className="p-3 font-mono">{item.paso}</td>
                        <td className="p-3 text-muted-foreground font-sans">{item.accion}</td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] ${item.estado.includes("Error") ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"}`}
                          >
                            {item.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mx-auto max-w-lg text-center">
            <button
              onClick={() => setReviewMode(true)}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              🔬 Volver a la mesa de trabajo para explorar la simulación
            </button>
          </div>
        </div>
      )}

      {submitted && reviewMode && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs">
          <span className="text-foreground font-medium">
            Modo Exploración: Puedes interactuar con la mesa de trabajo y revisar los pasos de las
            técnicas.
          </span>
          <button
            onClick={() => setReviewMode(false)}
            className="rounded-md bg-primary px-3 py-1 font-semibold text-primary-foreground text-[11px] cursor-pointer"
          >
            Volver al Resumen
          </button>
        </div>
      )}

      {(!submitted || reviewMode) && (
        <>
          {/* Informative panel focusing on the Mouse Wheel / Touchpad scroll gesture */}
          <div className="lab-panel p-4 text-sm bg-primary/5 border-l-4 border-primary rounded-r-xl flex items-start gap-3 shadow-sm">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-foreground font-bold">
                🕹️ Control de Precisión del Émbolo (Scroll o Teclado):
              </strong>
              <p className="text-muted-foreground leading-relaxed text-xs">
                Para lograr el máximo realismo de laboratorio, el émbolo se opera simulando el
                pulgar mediante la{" "}
                <strong className="text-foreground font-semibold">rueda del mouse (Scroll)</strong>{" "}
                o usando el teclado con{" "}
                <kbd className="px-1.5 py-0.5 rounded border bg-muted text-foreground text-[10px] font-sans font-bold">
                  Shift + ↓
                </kbd>{" "}
                para presionar (1° tope y luego 2° tope), y{" "}
                <kbd className="px-1.5 py-0.5 rounded border bg-muted text-foreground text-[10px] font-sans font-bold">
                  Shift + ↑
                </kbd>{" "}
                para liberar el émbolo lentamente.
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-slate-500 font-medium">
                <span>
                  🖱️ <strong className="text-foreground">Click Izquierdo:</strong> Calzar Punta
                  limpia (Caja de Puntas)
                </span>
                <span>
                  🖱️ <strong className="text-foreground">Click Derecho:</strong> Eyectar Punta usada
                  (en Descarte)
                </span>
              </div>
            </div>
          </div>

          {/* Experimental technique selection menu with unified M4 tabs design and locking */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-px">
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => handleTechChange("forward")}
                className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition duration-200 -mb-[2px] flex items-center gap-2 ${
                  tech === "forward"
                    ? "border-primary text-primary bg-primary/[0.06] font-bold"
                    : !completedTechs.forward
                      ? "border-primary/40 text-primary bg-primary/[0.03] hover:text-primary hover:bg-primary/[0.06] hover:border-primary/60 cursor-pointer"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 hover:bg-secondary/20 cursor-pointer"
                }`}
              >
                <span>Técnica Normal (Forward)</span>
                {completedTechs.forward ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-bold text-success">
                    ✓ Completado
                  </span>
                ) : (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                  </span>
                )}
              </button>

              <button
                disabled={!completedTechs.forward}
                onClick={() => handleTechChange("reverse")}
                className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition duration-200 -mb-[2px] flex items-center gap-2 ${
                  tech === "reverse"
                    ? "border-primary text-primary bg-primary/[0.06] font-bold"
                    : completedTechs.forward && !completedTechs.reverse
                      ? "border-primary/40 text-primary bg-primary/[0.03] hover:text-primary hover:bg-primary/[0.06] hover:border-primary/60 cursor-pointer"
                      : completedTechs.forward
                        ? "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 hover:bg-secondary/20 cursor-pointer"
                        : "border-transparent text-muted-foreground/30 cursor-not-allowed"
                }`}
              >
                <span>Técnica Reversa (Reverse)</span>
                {completedTechs.reverse ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-bold text-success">
                    ✓ Completado
                  </span>
                ) : completedTechs.forward ? (
                  <span className="relative flex h-1.5 w-1.5 flex-row items-center gap-1">
                    <span className="text-[10px] text-primary">Próximo</span>
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                    </span>
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground/50 flex items-center gap-0.5">
                    🔒 Bloqueado
                  </span>
                )}
              </button>
            </div>

            <button
              onClick={resetSimulation}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-secondary flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reiniciar Técnica
            </button>
          </div>

          {/* Main interactive area */}
          <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            {/* The Workbench Sandbox */}
            <div className="flex flex-col gap-2">
              {/* Active instruction guide ribbon */}
              <div className="bg-popover border border-border/80 rounded-xl p-3 shadow-sm flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
                <span className="text-xs font-bold text-foreground font-sans">
                  Paso {currentStep + 1}:
                </span>
                <span className="text-xs text-muted-foreground font-medium">{activeGuide}</span>
              </div>

              <div
                ref={benchRef}
                onMouseMove={handleMouseMove}
                onWheel={handleWheel}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => {
                  setIsHovering(false);
                  setPlunger("soltado");
                }}
                onMouseDown={handleMouseDown}
                onContextMenu={(e) => e.preventDefault()}
                className="w-full h-[530px] relative border-2 border-border/60 rounded-3xl bg-gradient-to-b from-slate-100/40 to-slate-200/80 overflow-visible select-none cursor-none shadow-inner"
              >
                {/* Grid background representation */}
                <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none rounded-3xl overflow-hidden" />

                {/* Box of Tips (Caja de Puntas) */}
                <div
                  className="absolute flex flex-col items-center pointer-events-none"
                  style={{ left: "6%", bottom: "40px", width: "130px" }}
                >
                  <div className="w-24 h-28 bg-white/95 border-4 border-sky-200 rounded-2xl p-2.5 flex flex-col justify-between shadow-lg relative overflow-hidden backdrop-blur-sm">
                    <div className="absolute top-0 inset-x-0 h-1 bg-sky-300" />
                    {/* Visual grid of tips inside the box */}
                    <div className="grid grid-cols-4 gap-1.5 justify-items-center mt-1">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-2.5 w-2.5 rounded-full border ${
                            i < 8 && !hasTip
                              ? "bg-sky-400 border-sky-500 animate-pulse shadow-sm shadow-sky-400"
                              : "bg-sky-200/20 border-sky-300/40"
                          }`}
                        />
                      ))}
                    </div>

                    <div className="text-[9px] font-extrabold text-sky-600 tracking-wider text-center bg-sky-100/50 py-0.5 rounded border border-sky-100 uppercase">
                      PUNTAS 1000 µL
                    </div>
                  </div>
                  <span className="mt-2 text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full shadow-sm border border-sky-100">
                    Caja de Puntas
                  </span>
                </div>

                {/* Vessel 1: Origen (KMnO4) */}
                <div
                  className="absolute flex flex-col items-center pointer-events-none"
                  style={{ left: "30%", bottom: "40px", width: "120px" }}
                >
                  {/* Glowing entry port mouth visual indicator */}
                  <div className="w-14 h-3 -mb-1 rounded-full bg-emerald-500/20 border-2 border-emerald-400/85 shadow-md shadow-emerald-400/60 flex items-center justify-center animate-pulse z-10">
                    <span className="text-[7px] text-emerald-800 font-extrabold uppercase tracking-widest leading-none scale-90">
                      Entrada
                    </span>
                  </div>
                  <div className="relative w-14 h-36 border-4 border-slate-300/80 rounded-b-3xl rounded-t-sm bg-white/20 flex items-end overflow-hidden shadow-lg backdrop-blur-sm">
                    {/* Glass reflection highlight */}
                    <div className="absolute inset-y-0 left-1 w-1 bg-white/30 rounded-full" />
                    {/* Permanganate solution */}
                    <div className="w-full h-[100px] bg-gradient-to-t from-purple-950 via-fuchsia-800 to-fuchsia-600 opacity-90 animate-pulse relative">
                      {/* Fluid Meniscus Curve */}
                      <div className="absolute -top-1.5 inset-x-0 h-3 bg-fuchsia-400/90 rounded-[50%] border-t border-fuchsia-300 shadow-inner" />
                    </div>
                    {/* Tube labels */}
                    <div className="absolute inset-y-0 right-1 flex flex-col justify-around text-[8px] text-slate-500 font-bold select-none opacity-85">
                      <span>1000 µL</span>
                      <span>500 µL</span>
                      <span>0 µL</span>
                    </div>
                  </div>
                  <span className="mt-2 text-xs font-bold text-slate-600 bg-white/80 px-2 py-0.5 rounded-full shadow-sm border border-slate-100">
                    Origen (KMnO₄)
                  </span>
                </div>

                {/* Vessel 2: Destino */}
                <div
                  className="absolute flex flex-col items-center pointer-events-none"
                  style={{ left: "54%", bottom: "40px", width: "120px" }}
                >
                  {/* Glowing entry port mouth visual indicator */}
                  <div className="w-12 h-3 -mb-1 rounded-full bg-emerald-500/20 border-2 border-emerald-400/85 shadow-md shadow-emerald-400/60 flex items-center justify-center animate-pulse z-10">
                    <span className="text-[7px] text-emerald-800 font-extrabold uppercase tracking-widest leading-none scale-90">
                      Entrada
                    </span>
                  </div>
                  <div className="relative w-12 h-36 border-4 border-slate-300/80 rounded-b-full flex items-end overflow-hidden bg-white/20 shadow-lg backdrop-blur-sm">
                    <div className="absolute inset-y-0 left-1 w-1 bg-white/20 rounded-full" />
                    {/* Dispensed liquid column */}
                    {liquidInDestino > 0 && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${liquidInDestino * 70}px` }}
                        className="w-full bg-gradient-to-t from-purple-900 to-fuchsia-700 relative"
                      >
                        <div className="absolute -top-1 inset-x-0 h-2 bg-fuchsia-400/90 rounded-[50%] border-t border-fuchsia-200" />
                      </motion.div>
                    )}
                    {/* Calibration metrics */}
                    <div className="absolute inset-y-0 right-1.5 flex flex-col justify-around text-[7px] text-slate-500 font-bold opacity-85">
                      <span>1.0 mL</span>
                      <span>0.5 mL</span>
                    </div>
                  </div>
                  <span className="mt-2 text-xs font-bold text-slate-600 bg-white/80 px-2 py-0.5 rounded-full shadow-sm border border-slate-100">
                    Destino (Tubo)
                  </span>
                </div>

                {/* Vessel 3: Descarte (Residue Container) */}
                <div
                  className="absolute flex flex-col items-center pointer-events-none"
                  style={{ left: "78%", bottom: "40px", width: "120px" }}
                >
                  <div className="w-16 h-32 bg-destructive/5 border-4 border-destructive/20 rounded-t-lg rounded-b-2xl flex flex-col items-center justify-center gap-1.5 shadow-md relative backdrop-blur-xs">
                    <Trash2 className="h-6 w-6 text-destructive/40" />
                    <span className="text-[9px] font-bold text-destructive/50 tracking-wider">
                      RESIDUOS
                    </span>

                    {/* Discarded tip inside visual */}
                    {!hasTip && currentStep > 0 && (
                      <div className="absolute bottom-3 rotate-45 transform">
                        <div className="w-2.5 h-10 bg-sky-200/50 border border-sky-400/50 rounded-b-sm animate-bounce" />
                      </div>
                    )}
                  </div>
                  <span className="mt-2 text-xs font-bold text-destructive/70 bg-destructive/5 px-2 py-0.5 rounded-full shadow-sm border border-destructive/10">
                    Descarte
                  </span>
                </div>

                {/* Stabilization circular clock timer directly on workbench */}
                {isStabilizing && (
                  <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-800 text-white rounded-2xl p-3 flex items-center gap-3 shadow-xl z-10">
                    <div className="relative h-10 w-10 flex items-center justify-center bg-slate-800 rounded-full">
                      <Timer className="h-5 w-5 text-fuchsia-400 animate-pulse" />
                      <div className="absolute inset-0 border-2 border-fuchsia-500 rounded-full border-t-transparent animate-spin" />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                        Viscosidad de Reactivo
                      </span>
                      <span className="text-xs font-extrabold text-fuchsia-300">
                        Estabilizando columna... {secondsRemaining}s
                      </span>
                    </div>
                  </div>
                )}

                {/* Custom Mouse Cursor - Micropipette (Full height rendering) */}
                {isHovering && (
                  <div
                    className="absolute pointer-events-none z-50 select-none filter drop-shadow-md"
                    style={{
                      left: mouse.x,
                      top: mouse.y,
                      transform: "translate(-50%, -363px)",
                    }}
                  >
                    <svg
                      viewBox="0 0 100 350"
                      width="110"
                      height="385"
                      className="overflow-visible"
                    >
                      {/* Sliding Plunger Button Rod (moves on click) */}
                      <g
                        style={{
                          transform: `translateY(${
                            plunger === "soltado" ? 0 : plunger === "primer-tope" ? 14 : 26
                          }px)`,
                          transition: "transform 0.1s ease-out",
                        }}
                      >
                        {/* Top colored plunger knob */}
                        <ellipse
                          cx="50"
                          cy="5"
                          rx="14"
                          ry="5"
                          fill={tech === "forward" ? "var(--color-primary)" : "#f97316"}
                        />
                        {/* Metallic piston rod */}
                        <rect x="46" y="8" width="8" height="35" fill="url(#metal-grad)" />
                        {/* Visible spring inside barrel mechanism */}
                        <path
                          d="M 44 15 L 56 18 M 44 22 L 56 25 M 44 29 L 56 32 M 44 36 L 56 39"
                          stroke="#475569"
                          strokeWidth="2"
                        />
                      </g>

                      {/* Main solid pipette body */}
                      {/* Top housing */}
                      <rect
                        x="30"
                        y="40"
                        width="40"
                        height="15"
                        fill="#f8fafc"
                        stroke="#94a3b8"
                        strokeWidth="1"
                      />

                      {/* Central Ergonomic handle body */}
                      <path
                        d="M 28 55 C 28 55, 34 140, 36 180 L 64 180 C 66 140, 72 55, 72 55 Z"
                        fill="#ffffff"
                        stroke="#cbd5e1"
                        strokeWidth="1.5"
                      />

                      {/* High Quality Digital Display Display */}
                      <rect x="36" y="80" width="28" height="32" rx="3" fill="#0f172a" />
                      <text
                        x="50"
                        y="102"
                        textAnchor="middle"
                        fill="#38bdf8"
                        fontSize="13"
                        fontWeight="800"
                        fontFamily="monospace"
                      >
                        1000
                      </text>
                      <text
                        x="50"
                        y="118"
                        textAnchor="middle"
                        fill="#334155"
                        fontSize="7"
                        fontWeight="700"
                        fontFamily="sans-serif"
                      >
                        µL
                      </text>

                      {/* Brand name */}
                      <text
                        x="50"
                        y="72"
                        textAnchor="middle"
                        fill="#64748b"
                        fontSize="7"
                        fontWeight="800"
                        letterSpacing="1"
                      >
                        BIO-UCT
                      </text>

                      {/* Volume lock collar */}
                      <rect x="34" y="145" width="32" height="8" rx="1" fill="#475569" />

                      {/* Lower tapered nozzle shaft */}
                      <path
                        d="M 36 180 L 64 180 L 55 285 L 45 285 Z"
                        fill="#e2e8f0"
                        stroke="#cbd5e1"
                        strokeWidth="1.5"
                      />
                      {/* Nozzle collar ring */}
                      <rect x="43" y="275" width="14" height="6" fill="#64748b" />

                      {/* Transparent disposable pipette tip */}
                      {hasTip ? (
                        <g>
                          {/* Translucent plastic blue tip shell */}
                          <path
                            d="M 44 285 L 56 285 L 50 330 Z"
                            fill="rgba(56, 189, 248, 0.22)"
                            stroke="rgba(14, 165, 233, 0.7)"
                            strokeWidth="1.5"
                          />
                          {/* Dynamic permanganate color inside tip */}
                          {liquidInTip > 0 && (
                            <path
                              d={`M ${50 - halfWidthAtY} ${targetLiquidY} 
                             L ${50 + halfWidthAtY} ${targetLiquidY} 
                             L 50 330 Z`}
                              fill="url(#kmno4-grad)"
                              className="transition-all duration-150 ease-out"
                            />
                          )}
                        </g>
                      ) : null}

                      {/* Definitions of color gradients inside SVG */}
                      <defs>
                        <linearGradient id="metal-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#94a3b8" />
                          <stop offset="50%" stopColor="#f1f5f9" />
                          <stop offset="100%" stopColor="#64748b" />
                        </linearGradient>
                        <linearGradient id="kmno4-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#701a75" />
                          <stop offset="50%" stopColor="#a21caf" />
                          <stop offset="100%" stopColor="#4a044e" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Floating Volume Indicator Badge */}
                    {liquidInTip > 0 && (
                      <div
                        className="absolute left-[70px] top-[290px] bg-slate-950/95 border-2 border-fuchsia-500 text-fuchsia-300 px-2.5 py-1 rounded-xl font-mono text-[10px] font-black shadow-2xl whitespace-nowrap flex items-center gap-1.5 backdrop-blur-xs animate-bounce"
                        style={{ transform: "translateY(-50%)" }}
                      >
                        <span className="h-2 w-2 rounded-full bg-fuchsia-400 animate-ping" />
                        <span>{Math.round(liquidInTip * 1000)} µL</span>
                      </div>
                    )}

                    {/* Pipette dirty/contaminated indicator */}
                    {isDirty && (
                      <div
                        className="absolute left-[65px] top-[290px] bg-red-600 border border-red-400 text-white px-2 py-0.5 rounded-md font-sans text-[9px] font-black shadow-lg whitespace-nowrap flex items-center gap-1 animate-pulse"
                        style={{ transform: "translateY(-50%)" }}
                      >
                        <span>⚠️ MICROPIPETA SUCIA / CONTAMINADA</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Click indicators / instructions overlay directly inside empty bench space */}
                {!isHovering && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-[1px] text-center p-6 text-white transition-opacity duration-300 rounded-3xl">
                    <div className="max-w-md space-y-4">
                      <div className="h-12 w-12 rounded-full bg-primary/20 border border-primary text-primary flex items-center justify-center mx-auto animate-bounce">
                        <MousePointerClick className="h-6 w-6" />
                      </div>
                      <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-100">
                        Mesa de Pipeteo Virtual (Método Scroll)
                      </h3>
                      <p className="text-xs leading-relaxed text-slate-200 font-sans">
                        Desplaza el mouse hacia adentro de esta área para tomar control de la
                        micropipeta. El puntero se ocultará y la micropipeta se acoplará fluidamente
                        al movimiento.
                      </p>
                      <p className="text-[10px] text-sky-300 font-mono leading-relaxed bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
                        🖱️ Click Izquierdo = Calzar Punta limpia (Caja)
                        <br />
                        🎡 Rueda del Mouse (Scroll) = Operar Émbolo (Tope 1 / Tope 2)
                        <br />
                        🖱️ Click Derecho = Eyectar Punta usada (Descarte)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Zoom mechanism + Error Dashboard (Right) */}
            <div className="flex flex-col gap-4">
              {/* Zoom Card: high detailed plunger spring inside the body */}
              <div className="lab-card p-5 relative overflow-hidden flex flex-col justify-between bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 text-white min-h-[220px]">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                  <Award className="h-32 w-32 text-white" />
                </div>

                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Zoom Mecánico de Émbolo
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full uppercase">
                    {plunger}
                  </span>
                </div>

                {/* Spring visualization in Zoom */}
                <div className="my-3 flex items-center justify-center gap-6">
                  <div className="relative w-12 h-28 bg-slate-800/40 rounded-xl border border-slate-700/60 flex flex-col items-center justify-end p-1">
                    {/* Visual Metal Rod Piston */}
                    <motion.div
                      animate={{
                        height:
                          plunger === "soltado"
                            ? "40px"
                            : plunger === "primer-tope"
                              ? "65px"
                              : "90px",
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="w-4 bg-gradient-to-r from-slate-300 via-white to-slate-400 border border-slate-500 absolute top-0 rounded-t-sm"
                    />

                    {/* Compressing coil spring */}
                    <svg viewBox="0 0 40 100" className="w-8 h-20 overflow-visible mt-6">
                      <path
                        d={
                          plunger === "soltado"
                            ? "M 20 0 L 20 10 Q 30 15, 20 20 Q 10 25, 20 30 Q 30 35, 20 40 Q 10 45, 20 50 Q 30 55, 20 60 Q 10 65, 20 70 L 20 80"
                            : plunger === "primer-tope"
                              ? "M 20 0 L 20 10 Q 28 12, 20 15 Q 12 18, 20 21 Q 28 24, 20 27 Q 12 30, 20 33 Q 28 36, 20 39 Q 12 42, 20 45 L 20 50"
                              : "M 20 0 L 20 5 Q 26 7, 20 9 Q 14 11, 20 13 Q 26 15, 20 17 Q 14 19, 20 21 Q 26 23, 20 25 Q 14 27, 20 29 L 20 32"
                        }
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        className="transition-all duration-150"
                      />
                    </svg>
                  </div>

                  {/* Explanatory text */}
                  <div className="flex-1 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400">
                      Presión mecánica activa:
                    </span>
                    <p className="text-xs text-slate-200 font-sans leading-relaxed">
                      {plunger === "soltado"
                        ? "Presión Cero (Filtro abierto). El pistón se encuentra arriba. Listo para tomar aire."
                        : plunger === "primer-tope"
                          ? "Primer Tope (Resistencia media). Calibrado para la alícuota exacta de 1000 µL."
                          : "Segundo Tope (Purgado máximo). El pistón expulsa hasta la última gota de alícuota por soplado."}
                    </p>
                  </div>
                </div>

                {/* Display value */}
                <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg text-center text-xs">
                  <span className="text-slate-400">Líquido en Punta:</span>{" "}
                  <strong className="text-fuchsia-400">
                    {liquidInTip === 0
                      ? "0 µL (Vacío)"
                      : liquidInTip === 1.0
                        ? "1000 µL (Normal)"
                        : liquidInTip === 0.05
                          ? "50 µL (Remanente)"
                          : "1200 µL (Exceso)"}
                  </strong>
                </div>
              </div>

              {/* Feedback messages / success alerts */}
              <AnimatePresence mode="wait">
                {warning ? (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-xs text-destructive-foreground shadow-md"
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h5 className="font-bold text-red-600">Alerta de Error Crítico:</h5>
                        <p className="text-foreground font-medium leading-relaxed">{warning}</p>
                        <button
                          onClick={resetSimulation}
                          className="mt-2 text-primary font-bold hover:underline flex items-center gap-1"
                        >
                          <RotateCcw className="h-3 w-3" /> Reiniciar simulación e intentar de nuevo
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : lastActionFeedback ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-2xl border border-success/35 bg-success/5 p-4 text-xs text-success-foreground"
                  >
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-success shrink-0 mt-0.5 bg-success/15 rounded-full p-0.5" />
                      <div>
                        <h5 className="font-bold text-emerald-700">Estado de la Acción:</h5>
                        <p className="text-foreground font-sans mt-0.5 leading-relaxed">
                          {lastActionFeedback}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 text-center italic font-sans flex items-center justify-center gap-2">
                    <HelpCircle className="h-4 w-4 text-slate-400" />
                    Ningún error reportado. Procede de acuerdo a la técnica seleccionada.
                  </div>
                )}
              </AnimatePresence>

              {/* Guidelines info for reference */}
              <div className="lab-card p-4 space-y-2">
                <h5 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Concepto de la Técnica:
                </h5>
                <div className="text-xs text-muted-foreground leading-relaxed font-sans space-y-1">
                  {tech === "forward" ? (
                    <>
                      <p>
                        • <strong className="text-foreground">Uso:</strong> Líquidos acuosos libres
                        de espuma.
                      </p>
                      <p>
                        • <strong className="text-foreground">Principio:</strong> El volumen
                        succionado es igual al dispensado. Se purga al final presionando al 2º tope.
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        • <strong className="text-foreground">Uso:</strong> Líquidos viscosos,
                        volátiles o espumosos.
                      </p>
                      <p>
                        • <strong className="text-foreground">Principio:</strong> Se succiona
                        líquido adicional (exceso al 2º tope). Se entrega solo el 1º tope. El exceso
                        queda en la punta.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {actionHistory.length > 0 && (
            <div className="p-4 bg-card border border-border rounded-xl shadow-sm space-y-3 mt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                📋 Registro Realizado de Acciones (Respaldo en Vivo):
              </h4>
              <div className="max-h-60 overflow-y-auto rounded-lg border border-border">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-secondary text-muted-foreground border-b border-border sticky top-0">
                      <th className="p-3 font-semibold">Técnica</th>
                      <th className="p-3 font-semibold">Paso</th>
                      <th className="p-3 font-semibold">Acción</th>
                      <th className="p-3 font-semibold text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actionHistory.map((item, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-border/50 last:border-0 hover:bg-secondary/35"
                      >
                        <td className="p-3 font-semibold text-primary">{item.tecnica}</td>
                        <td className="p-3 font-mono">{item.paso}</td>
                        <td className="p-3 text-muted-foreground font-sans">{item.accion}</td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] ${item.estado.includes("Error") ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"}`}
                          >
                            {item.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
