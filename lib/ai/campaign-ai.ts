// Serviços Mockados para a Fase 8 de Campaign Builder
// Futuramente, isso se conectará via AIProviderManager (OpenAI/Gemini)

export interface ProductAnalysis {
  category: string;
  recommendedBgStyle: "studio_white" | "dark_dramatic" | "lifestyle_outdoor" | "industrial";
  confidence: number;
}

export interface CampaignCopy {
  title: string;
  subtitle: string;
  description: string;
  benefits: string[];
  cta: string;
  hashtags: string;
  platformSpecific: {
    instagram: string;
    mercadolivre: string;
    facebook: string;
  };
  seoKeywords: string[];
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const campaignAI = {
  // Simula a análise visual do produto
  async analyzeProduct(imageFile: File): Promise<ProductAnalysis> {
    await delay(1500); // Simulando delay de rede do modelo de Visão
    
    // Heurística boba apenas para o mock baseada no nome do arquivo (ou fixo)
    const name = imageFile.name.toLowerCase();
    let category = "Genérico";
    let bgStyle: ProductAnalysis["recommendedBgStyle"] = "studio_white";
    
    if (name.includes("pneu") || name.includes("motor") || name.includes("carro")) {
      category = "Automotivo";
      bgStyle = "industrial";
    } else if (name.includes("tenis") || name.includes("shoe")) {
      category = "Calçados";
      bgStyle = "lifestyle_outdoor";
    } else if (name.includes("relogio") || name.includes("watch")) {
      category = "Acessórios Premium";
      bgStyle = "dark_dramatic";
    }

    return {
      category,
      recommendedBgStyle: bgStyle,
      confidence: 0.94
    };
  },

  // Simula a geração de copy baseada na categoria do produto
  async generateCopywriting(category: string): Promise<CampaignCopy> {
    await delay(2000); // Simula delay do LLM

    return {
      title: `Lançamento Exclusivo: ${category} Premium`,
      subtitle: "A qualidade que você já conhece, agora com um design revolucionário.",
      description: "Desenvolvido com tecnologia de ponta para proporcionar o máximo de desempenho e durabilidade no seu dia a dia. Uma peça fundamental que combina resistência e estilo em um só pacote.",
      benefits: [
        "Durabilidade estendida (Garantia de 2 anos)",
        "Acabamento premium resistente a riscos",
        "Design ergonômico e moderno",
        "Alta performance comprovada"
      ],
      cta: "Garanta o seu hoje mesmo com frete grátis!",
      hashtags: "#lancamento #premium #qualidade #oferta #ecommerce",
      platformSpecific: {
        instagram: "🔥 A revolução chegou! Arraste para o lado e confira os detalhes deste lançamento incrível. Link na bio para garantir o seu com desconto exclusivo de 15% nas próximas 24h! 🚀👇\n\n#novidade #premium",
        facebook: "Procurando por qualidade e durabilidade? Nosso novo modelo de categoria premium acaba de chegar no estoque. Aproveite as condições de parcelamento em até 12x sem juros no cartão. Clique em 'Saiba Mais'!",
        mercadolivre: "PRODUTO NOVO | PRONTA ENTREGA | GARANTIA\n\nCaracterísticas principais:\n- Alta resistência\n- Acabamento profissional\n\n*Envio imediato pelo Mercado Envios Full.*"
      },
      seoKeywords: ["comprar online", "melhor preço", "qualidade premium", category.toLowerCase()]
    };
  }
};
