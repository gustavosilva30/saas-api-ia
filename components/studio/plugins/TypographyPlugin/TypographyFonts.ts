import WebFont from "webfontloader";

export interface FontCategory {
  name: string;
  fonts: string[];
}

export const FONT_CATEGORIES: FontCategory[] = [
  {
    name: "Modernas",
    fonts: ["Inter", "Roboto", "Open Sans", "Montserrat", "Poppins"]
  },
  {
    name: "Minimalistas",
    fonts: ["Lato", "Raleway", "Nunito", "Quicksand"]
  },
  {
    name: "Elegantes",
    fonts: ["Playfair Display", "Cinzel", "Cormorant Garamond", "Lora"]
  },
  {
    name: "Manuscritas",
    fonts: ["Dancing Script", "Pacifico", "Great Vibes", "Sacramento"]
  },
  {
    name: "Tech",
    fonts: ["Space Mono", "Fira Code", "Roboto Mono", "Share Tech Mono"]
  },
  {
    name: "Impacto",
    fonts: ["Anton", "Bebas Neue", "Oswald", "Teko"]
  }
];

// Carregador de fonte dinâmico
export const loadFont = (fontFamily: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    WebFont.load({
      google: {
        families: [fontFamily]
      },
      active: () => {
        resolve();
      },
      inactive: () => {
        reject(new Error(`Falha ao carregar a fonte ${fontFamily}`));
      }
    });
  });
};
