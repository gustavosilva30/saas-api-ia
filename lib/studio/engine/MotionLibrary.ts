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
  "fade-in": {
    id: "fade-in",
    name: "Fade In",
    category: "Entrada",
    defaultDuration: 1000,
    defaultEasing: "linear",
    keyframes: [{ property: "opacity", from: 0, to: 1 }]
  },
  "slide-left": {
    id: "slide-left",
    name: "Slide Left",
    category: "Entrada",
    defaultDuration: 800,
    defaultEasing: "easeOutCubic",
    keyframes: [
      { property: "opacity", from: 0, to: 1 },
      { property: "left", from: -200, to: 0 } // This will be relative to original position later
    ]
  },
  "slide-right": {
    id: "slide-right",
    name: "Slide Right",
    category: "Entrada",
    defaultDuration: 800,
    defaultEasing: "easeOutCubic",
    keyframes: [
      { property: "opacity", from: 0, to: 1 },
      { property: "left", from: 200, to: 0 }
    ]
  },
  "zoom-in": {
    id: "zoom-in",
    name: "Zoom In",
    category: "Entrada",
    defaultDuration: 800,
    defaultEasing: "easeOutBack",
    keyframes: [
      { property: "opacity", from: 0, to: 1 },
      { property: "scaleX", from: 0, to: 1 },
      { property: "scaleY", from: 0, to: 1 }
    ]
  },
  "rotate-in": {
    id: "rotate-in",
    name: "Rotate In",
    category: "Entrada",
    defaultDuration: 1000,
    defaultEasing: "easeOutQuint",
    keyframes: [
      { property: "opacity", from: 0, to: 1 },
      { property: "angle", from: -90, to: 0 },
      { property: "scaleX", from: 0.5, to: 1 },
      { property: "scaleY", from: 0.5, to: 1 }
    ]
  },
  "fade-out": {
    id: "fade-out",
    name: "Fade Out",
    category: "Saída",
    defaultDuration: 1000,
    defaultEasing: "linear",
    keyframes: [{ property: "opacity", from: 1, to: 0 }]
  },
  "zoom-out": {
    id: "zoom-out",
    name: "Zoom Out",
    category: "Saída",
    defaultDuration: 800,
    defaultEasing: "easeInBack",
    keyframes: [
      { property: "opacity", from: 1, to: 0 },
      { property: "scaleX", from: 1, to: 0 },
      { property: "scaleY", from: 1, to: 0 }
    ]
  },
  "pulse": {
    id: "pulse",
    name: "Pulse",
    category: "Ênfase",
    defaultDuration: 1000,
    defaultEasing: "easeInOutSine",
    keyframes: [
      { property: "scaleX", from: 1, to: 1.1 }, // We will handle ping-pong in engine
      { property: "scaleY", from: 1, to: 1.1 }
    ]
  },
  "shake": {
    id: "shake",
    name: "Shake",
    category: "Ênfase",
    defaultDuration: 500,
    defaultEasing: "linear",
    keyframes: [
      { property: "left", from: -10, to: 10 }
    ]
  }
};
