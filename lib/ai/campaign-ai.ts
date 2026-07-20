import { useTenantStore } from "@/store/useTenantStore";

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
  designTokens: {
    textColor: string;
    alignment: "top" | "bottom" | "center";
  };
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      let result = reader.result as string;
      // Remove o prefixo data:image/jpeg;base64,
      const base64ContentArray = result.split(",");
      resolve(base64ContentArray[1] || result);
    };
    reader.onerror = error => reject(error);
  });
};

// Fallback Mockado caso falhe a chamada ou não tenha chave
const getMockAnalysis = async (imageFile: File): Promise<ProductAnalysis> => {
  await delay(1500);
  const name = imageFile.name.toLowerCase();
  let category = "Genérico";
  let bgStyle: ProductAnalysis["recommendedBgStyle"] = "studio_white";
  
  if (name.includes("pneu") || name.includes("motor") || name.includes("carro")) {
    category = "Automotivo"; bgStyle = "industrial";
  } else if (name.includes("tenis") || name.includes("shoe")) {
    category = "Calçados"; bgStyle = "lifestyle_outdoor";
  } else if (name.includes("relogio") || name.includes("watch")) {
    category = "Acessórios Premium"; bgStyle = "dark_dramatic";
  }

  return { category, recommendedBgStyle: bgStyle, confidence: 0.94 };
};

const getMockCopy = async (category: string): Promise<CampaignCopy> => {
  await delay(2000);
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
    seoKeywords: ["comprar online", "melhor preço", "qualidade premium", category.toLowerCase()],
    designTokens: {
      textColor: category === "Acessórios Premium" ? "#FFD700" : "#FFFFFF",
      alignment: "bottom"
    }
  };
};

export const campaignAI = {
  async analyzeProduct(imageFile: File, userPrompt?: string): Promise<ProductAnalysis> {
    const { googleKey } = useTenantStore.getState();
    
    if (!googleKey) {
      console.warn("Sem chave do Google configurada. Usando mock.");
      return getMockAnalysis(imageFile);
    }

    try {
      const base64Data = await fileToBase64(imageFile);
      const mimeType = imageFile.type || "image/jpeg";

      const prompt = `Analise a imagem em anexo. ${userPrompt ? `O criador também disse sobre o produto: "${userPrompt}".` : ""}
      Responda EXATAMENTE em formato JSON com as seguintes chaves:
      "category": string curta descrevendo a categoria exata do produto.
      "recommendedBgStyle": uma destas opções exatas: "studio_white", "dark_dramatic", "lifestyle_outdoor", "industrial" (escolha a que mais combina).
      "confidence": número decimal entre 0 e 1 indicando sua certeza.
      NÃO RETORNE NADA ALÉM DO JSON.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${googleKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inlineData: { mimeType, data: base64Data } }
            ]
          }]
        })
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Falha na chamada da API Vision do Gemini: ${err}`);
      }
      
      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const jsonStr = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(jsonStr) as ProductAnalysis;
      
      return parsed;

    } catch (error) {
      console.error("Erro na API real do Gemini (Vision), usando fallback", error);
      return getMockAnalysis(imageFile);
    }
  },

  async generateCopywriting(category: string, userPrompt?: string): Promise<CampaignCopy> {
    const { googleKey } = useTenantStore.getState();

    if (!googleKey) {
      console.warn("Sem chave do Google configurada. Usando mock.");
      return getMockCopy(category);
    }

    try {
      const prompt = `Você é um copywriter e diretor de arte especialista de alta conversão.
      Crie uma estrutura de vendas e defina o design visual para um produto da categoria "${category}".
      ${userPrompt ? `O criador deu as seguintes instruções de estilo/contexto: "${userPrompt}". Use isso para guiar o tom e o visual (designTokens).` : ""}
      
      Responda EXATAMENTE em formato JSON puro, seguindo este formato rigorosamente:
      {
        "title": "título curto e de impacto (máx 5 palavras)",
        "subtitle": "subtítulo complementar com gatilho mental",
        "description": "parágrafo descritivo de 3-4 linhas",
        "benefits": ["benefício 1", "benefício 2", "benefício 3", "benefício 4"],
        "cta": "texto de chamada para ação",
        "hashtags": "#hashtag1 #hashtag2 #hashtag3",
        "platformSpecific": {
          "instagram": "texto com emojis e call to action para bio/link",
          "mercadolivre": "texto mais direto, enfatizando pronta entrega, envio, novo",
          "facebook": "texto descritivo para topo ou meio de funil com CTA"
        },
        "seoKeywords": ["keyword1", "keyword2", "keyword3"],
        "designTokens": {
          "textColor": "código HEX da cor ideal (ex: #FFFFFF ou #FFD700)",
          "alignment": "escolha 'top' ou 'bottom' ou 'center' baseando-se no produto"
        }
      }
      
      IMPORTANTE: Retorne APENAS o JSON válido.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${googleKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Falha na chamada da API de texto do Gemini: ${err}`);
      }
      
      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const jsonStr = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(jsonStr) as CampaignCopy;
      
      return parsed;

    } catch (error) {
      console.error("Erro na API real do Gemini (Copy), usando fallback", error);
      return getMockCopy(category);
    }
  }
};
