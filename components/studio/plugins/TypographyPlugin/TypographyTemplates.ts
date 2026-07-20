export type TextEffectTemplate = {
  id: string;
  name: string;
  fontFamily: string;
  fill: string | any; // color or gradient
  stroke?: string;
  strokeWidth?: number;
  shadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
};

export const TYPOGRAPHY_TEMPLATES: TextEffectTemplate[] = [
  {
    id: "neon-pink",
    name: "Neon Pink",
    fontFamily: "Inter",
    fill: "#ffffff",
    shadow: {
      color: "#ff00ff",
      blur: 20,
      offsetX: 0,
      offsetY: 0
    }
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    fontFamily: "Roboto",
    fill: "#00ffff",
    shadow: {
      color: "#ff0055",
      blur: 15,
      offsetX: 4,
      offsetY: 4
    }
  },
  {
    id: "gold-metal",
    name: "Gold Metallic",
    fontFamily: "Cinzel",
    fill: "#ffdf00", // We will replace with a gradient later
    stroke: "#b8860b",
    strokeWidth: 2,
    shadow: {
      color: "rgba(0,0,0,0.8)",
      blur: 10,
      offsetX: 5,
      offsetY: 5
    }
  },
  {
    id: "outline-bold",
    name: "Outline Bold",
    fontFamily: "Anton",
    fill: "transparent",
    stroke: "#ffffff",
    strokeWidth: 4,
  }
];
