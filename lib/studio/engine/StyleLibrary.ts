export interface IStylePreset {
  id: string;
  name: string;
  category: string;
  tags?: string[];
  properties: {
    fill?: string | any;
    stroke?: string;
    strokeWidth?: number;
    shadow?: {
      color: string;
      blur: number;
      offsetX: number;
      offsetY: number;
    } | null;
    rx?: number; // Border radius for shapes
    ry?: number;
    opacity?: number;
    // Add blend modes or other fabric properties in the future
  };
  motion?: {
    type: string;
    duration?: number;
    // ...outras props
  };
}

export const STYLE_CATEGORIES = [
  "Minimalista",
  "Glass",
  "Neon",
  "Metal",
  "Premium",
  "Tecnologia",
  "Social Media",
  "Automotivo"
];

export const STYLE_LIBRARY: IStylePreset[] = [
  // Minimalista
  {
    id: 'soft-shadow',
    name: 'Soft Shadow',
    category: 'Minimalista',
    properties: {
      fill: '#f8fafc',
      stroke: '#e2e8f0',
      strokeWidth: 1,
      rx: 16, ry: 16,
      shadow: { color: 'rgba(0,0,0,0.05)', blur: 20, offsetX: 0, offsetY: 10 }
    }
  },
  {
    id: 'clean-white',
    name: 'Clean White',
    category: 'Minimalista',
    properties: {
      fill: '#ffffff',
      stroke: '#e2e8f0',
      strokeWidth: 1,
      shadow: null
    }
  },

  // Glass
  {
    id: 'glass-classic',
    name: 'Classic Glass',
    category: 'Glass',
    properties: {
      fill: 'rgba(255, 255, 255, 0.1)',
      stroke: 'rgba(255, 255, 255, 0.3)',
      strokeWidth: 2,
      rx: 24, ry: 24,
      shadow: { color: 'rgba(0,0,0,0.1)', blur: 30, offsetX: 0, offsetY: 10 }
    }
  },
  {
    id: 'dark-glass',
    name: 'Dark Glass',
    category: 'Glass',
    properties: {
      fill: 'rgba(0, 0, 0, 0.2)',
      stroke: 'rgba(255, 255, 255, 0.1)',
      strokeWidth: 1,
      rx: 16, ry: 16,
      shadow: { color: 'rgba(0,0,0,0.5)', blur: 20, offsetX: 0, offsetY: 10 }
    }
  },

  // Neon
  {
    id: 'neon-pink',
    name: 'Pink Glow',
    category: 'Neon',
    properties: {
      fill: 'transparent',
      stroke: '#ff00ff',
      strokeWidth: 3,
      shadow: { color: '#ff00ff', blur: 25, offsetX: 0, offsetY: 0 }
    },
    motion: { type: 'pulse', duration: 1500 }
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    category: 'Neon',
    properties: {
      fill: '#0f172a',
      stroke: '#00ffff',
      strokeWidth: 2,
      shadow: { color: '#00ffff', blur: 20, offsetX: 4, offsetY: 4 }
    }
  },

  // Metal
  {
    id: 'chrome',
    name: 'Chrome',
    category: 'Metal',
    properties: {
      fill: '#e2e8f0', // TODO: gradient support
      stroke: '#94a3b8',
      strokeWidth: 1,
      shadow: { color: 'rgba(0,0,0,0.3)', blur: 10, offsetX: 0, offsetY: 5 }
    }
  },
  {
    id: 'gold',
    name: 'Luxury Gold',
    category: 'Metal',
    properties: {
      fill: '#fcd34d',
      stroke: '#b45309',
      strokeWidth: 2,
      shadow: { color: 'rgba(180,83,9,0.4)', blur: 15, offsetX: 0, offsetY: 5 }
    }
  },

  // Social Media
  {
    id: 'black-friday',
    name: 'Black Friday CTA',
    category: 'Social Media',
    properties: {
      fill: '#000000',
      stroke: '#ff0000',
      strokeWidth: 4,
      rx: 8, ry: 8,
      shadow: { color: 'rgba(255,0,0,0.5)', blur: 20, offsetX: 0, offsetY: 5 }
    },
    motion: { type: 'spring-bounce', duration: 1000 }
  }
];
