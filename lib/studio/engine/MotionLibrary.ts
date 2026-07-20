export interface KeyframeDefinition {
  property: "opacity" | "left" | "top" | "scaleX" | "scaleY" | "angle";
  from: number | string; // If string, it could be a percentage like "-100%" or specific value
  to: number | string;
}

export interface MotionAnimation {
  id: string;
  name: string;
  category: "Entrada" | "Saída" | "Ênfase" | "Loop";
  defaultDuration: number;
  defaultEasing: string;
  keyframes: KeyframeDefinition[];
}

export const MotionLibrary: Record<string, MotionAnimation> = {
  // Entradas
  "fade-in": { id: "fade-in", name: "Fade In", category: "Entrada", defaultDuration: 1000, defaultEasing: "linear", keyframes: [{ property: "opacity", from: 0, to: 1 }] },
  "fade-up": { id: "fade-up", name: "Fade Up", category: "Entrada", defaultDuration: 800, defaultEasing: "easeOutCubic", keyframes: [{ property: "opacity", from: 0, to: 1 }, { property: "top", from: 50, to: 0 }] },
  "fade-down": { id: "fade-down", name: "Fade Down", category: "Entrada", defaultDuration: 800, defaultEasing: "easeOutCubic", keyframes: [{ property: "opacity", from: 0, to: 1 }, { property: "top", from: -50, to: 0 }] },
  
  "slide-left": { id: "slide-left", name: "Slide Left", category: "Entrada", defaultDuration: 800, defaultEasing: "easeOutCubic", keyframes: [{ property: "opacity", from: 0, to: 1 }, { property: "left", from: -200, to: 0 }] },
  "slide-right": { id: "slide-right", name: "Slide Right", category: "Entrada", defaultDuration: 800, defaultEasing: "easeOutCubic", keyframes: [{ property: "opacity", from: 0, to: 1 }, { property: "left", from: 200, to: 0 }] },
  "slide-up": { id: "slide-up", name: "Slide Up", category: "Entrada", defaultDuration: 800, defaultEasing: "easeOutCubic", keyframes: [{ property: "opacity", from: 0, to: 1 }, { property: "top", from: 200, to: 0 }] },
  
  "zoom-in": { id: "zoom-in", name: "Zoom In", category: "Entrada", defaultDuration: 800, defaultEasing: "easeOutBack", keyframes: [{ property: "opacity", from: 0, to: 1 }, { property: "scaleX", from: 0, to: 1 }, { property: "scaleY", from: 0, to: 1 }] },
  "pop": { id: "pop", name: "Pop", category: "Entrada", defaultDuration: 600, defaultEasing: "easeOutBounce", keyframes: [{ property: "opacity", from: 0, to: 1 }, { property: "scaleX", from: 0.5, to: 1 }, { property: "scaleY", from: 0.5, to: 1 }] },
  "bounce-in": { id: "bounce-in", name: "Bounce In", category: "Entrada", defaultDuration: 1000, defaultEasing: "easeOutBounce", keyframes: [{ property: "opacity", from: 0, to: 1 }, { property: "top", from: -300, to: 0 }] },
  "elastic-in": { id: "elastic-in", name: "Elastic In", category: "Entrada", defaultDuration: 1200, defaultEasing: "easeOutElastic", keyframes: [{ property: "opacity", from: 0, to: 1 }, { property: "scaleX", from: 0.1, to: 1 }, { property: "scaleY", from: 0.1, to: 1 }] },
  
  "rotate-in": { id: "rotate-in", name: "Rotate In", category: "Entrada", defaultDuration: 1000, defaultEasing: "easeOutQuint", keyframes: [{ property: "opacity", from: 0, to: 1 }, { property: "angle", from: -90, to: 0 }, { property: "scaleX", from: 0.5, to: 1 }, { property: "scaleY", from: 0.5, to: 1 }] },
  "flip-x": { id: "flip-x", name: "Flip X", category: "Entrada", defaultDuration: 1000, defaultEasing: "easeOutCubic", keyframes: [{ property: "opacity", from: 0, to: 1 }, { property: "scaleX", from: -1, to: 1 }] },
  
  // Saídas
  "fade-out": { id: "fade-out", name: "Fade Out", category: "Saída", defaultDuration: 1000, defaultEasing: "linear", keyframes: [{ property: "opacity", from: 1, to: 0 }] },
  "fade-out-down": { id: "fade-out-down", name: "Fade Out Down", category: "Saída", defaultDuration: 800, defaultEasing: "easeInCubic", keyframes: [{ property: "opacity", from: 1, to: 0 }, { property: "top", from: 0, to: 50 }] },
  "zoom-out": { id: "zoom-out", name: "Zoom Out", category: "Saída", defaultDuration: 800, defaultEasing: "easeInBack", keyframes: [{ property: "opacity", from: 1, to: 0 }, { property: "scaleX", from: 1, to: 0 }, { property: "scaleY", from: 1, to: 0 }] },
  "slide-out-right": { id: "slide-out-right", name: "Slide Out Right", category: "Saída", defaultDuration: 800, defaultEasing: "easeInCubic", keyframes: [{ property: "opacity", from: 1, to: 0 }, { property: "left", from: 0, to: 200 }] },
  
  // Ênfase
  "pulse": { id: "pulse", name: "Pulse", category: "Ênfase", defaultDuration: 1000, defaultEasing: "easeInOutSine", keyframes: [{ property: "scaleX", from: 1, to: 1.1 }, { property: "scaleY", from: 1, to: 1.1 }] },
  "shake": { id: "shake", name: "Shake", category: "Ênfase", defaultDuration: 500, defaultEasing: "linear", keyframes: [{ property: "left", from: -10, to: 10 }] },
  "swing": { id: "swing", name: "Swing", category: "Ênfase", defaultDuration: 800, defaultEasing: "easeInOutSine", keyframes: [{ property: "angle", from: -15, to: 15 }] }
};
