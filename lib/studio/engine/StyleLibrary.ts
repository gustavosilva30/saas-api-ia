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
    blendMode?: string; // globalCompositeOperation: 'multiply', 'screen', 'overlay', etc.
    filters?: {
      type: 'blur' | 'brightness' | 'contrast' | 'saturation' | 'hue' | 'pixelate' | 'noise';
      value?: any;
    }[];
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
  {
    id: 'dark-matte',
    name: 'Dark Matte',
    category: 'Minimalista',
    properties: {
      fill: '#18181b',
      stroke: '#27272a',
      strokeWidth: 1,
      rx: 12, ry: 12,
      shadow: { color: 'rgba(0,0,0,0.4)', blur: 25, offsetX: 0, offsetY: 12 }
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
      shadow: { color: 'rgba(0,0,0,0.5)', blur: 20, offsetX: 0, offsetY: 10 },
      blendMode: 'overlay'
    }
  },

  // Neon & Cyberpunk
  {
    id: 'neon-pink',
    name: 'Pink Glow',
    category: 'Neon',
    properties: {
      fill: 'transparent',
      stroke: '#ff00ff',
      strokeWidth: 3,
      shadow: { color: '#ff00ff', blur: 25, offsetX: 0, offsetY: 0 },
      blendMode: 'screen'
    },
    motion: { type: 'pulse', duration: 1500 }
  },
  {
    id: 'cyberpunk-city',
    name: 'Cyberpunk',
    category: 'Neon',
    properties: {
      fill: { type: 'linear', colorStops: [{offset: 0, color: '#0f172a'}, {offset: 1, color: '#1e1b4b'}] },
      stroke: '#00ffff',
      strokeWidth: 2,
      shadow: { color: '#00ffff', blur: 20, offsetX: 4, offsetY: 4 },
      filters: [{ type: 'contrast', value: 0.2 }, { type: 'saturation', value: 0.5 }]
    }
  },

  // Metal & Premium
  {
    id: 'chrome',
    name: 'Chrome',
    category: 'Metal',
    properties: {
      fill: { type: 'linear', colorStops: [{offset: 0, color: '#e2e8f0'}, {offset: 0.5, color: '#cbd5e1'}, {offset: 1, color: '#f8fafc'}] },
      stroke: '#94a3b8',
      strokeWidth: 1,
      shadow: { color: 'rgba(0,0,0,0.3)', blur: 10, offsetX: 0, offsetY: 5 }
    }
  },
  {
    id: 'gold',
    name: 'Luxury Gold',
    category: 'Premium',
    properties: {
      fill: { type: 'linear', colorStops: [{offset: 0, color: '#fef08a'}, {offset: 0.5, color: '#eab308'}, {offset: 1, color: '#a16207'}] },
      stroke: '#fef08a',
      strokeWidth: 2,
      shadow: { color: 'rgba(180,83,9,0.4)', blur: 15, offsetX: 0, offsetY: 5 }
    }
  },

  // E-Commerce Pop
  {
    id: 'black-friday',
    name: 'Black Friday CTA',
    category: 'Social Media',
    properties: {
      fill: '#000000',
      stroke: '#ef4444',
      strokeWidth: 4,
      rx: 8, ry: 8,
      shadow: { color: 'rgba(239,68,68,0.5)', blur: 20, offsetX: 0, offsetY: 5 }
    },
    motion: { type: 'spring-bounce', duration: 1000 }
  },
  {
    id: 'summer-sale',
    name: 'Summer Sale',
    category: 'Social Media',
    properties: {
      fill: { type: 'linear', colorStops: [{offset: 0, color: '#f97316'}, {offset: 1, color: '#eab308'}] },
      stroke: '#ffffff',
      strokeWidth: 2,
      shadow: { color: 'rgba(249,115,22,0.3)', blur: 15, offsetX: 0, offsetY: 8 }
    }
  },
  
  // Efeitos de Imagem
  {
    id: 'vintage-film',
    name: 'Vintage Film',
    category: 'Social Media',
    properties: {
      filters: [
        { type: 'noise', value: 100 },
        { type: 'saturation', value: -0.2 },
        { type: 'brightness', value: 0.1 }
      ]
    }
  },
  {
    id: 'dreamy-blur',
    name: 'Dreamy Blur',
    category: 'Social Media',
    properties: {
      filters: [
        { type: 'blur', value: 0.2 }
      ],
      blendMode: 'screen'
    }
  }
];
