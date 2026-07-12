import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      return NextResponse.json({ error: "Nenhuma imagem enviada." }, { status: 400 });
    }

    // A URL da sua API de remoção de fundo rodando na VPS/Easypanel
    const apiUrl = process.env.AI_REMOVE_BG_API_URL || "https://api-ai-saas-api-saas.4p8frk.easypanel.host/remove-bg";
    let apiKey = process.env.AI_API_KEY || ""; // Chave secreta que não vaza pro front-end
    
    // Se não tivermos uma API KEY global, tentamos usar o JWT do usuário logado
    if (!apiKey) {
      const authHeader = request.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        apiKey = authHeader.split(" ")[1];
      }
    }

    const externalFormData = new FormData();
    externalFormData.append("file", imageFile); // Usualmente APIs python esperam "file" ou "image"

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        ...(apiKey ? { "Authorization": `Bearer ${apiKey}` } : {})
      },
      body: externalFormData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Next API - Remove BG Error]", errorText);
      return NextResponse.json({ error: "Falha na API de Remoção de Fundo." }, { status: response.status });
    }

    // Para fins de simplificação, assumimos que a API responde com um JSON contendo a URL final, 
    // ou que responde com o binário direto da imagem (Blob). Vamos tratar ambos os casos.
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await response.json();
      return NextResponse.json(data); // { imageUrl: "..." }
    } else {
      // Se a API retornar a imagem binária diretamente, vamos repassar para o client em Base64
      // ou podemos salvar num bucket. Como a Regra 5 dita IStorageProvider, o correto a longo prazo
      // é a própria API Python salvar e devolver URL, ou esta rota Next salvar no Storage.
      // Por enquanto, enviaremos um Base64 de volta para o React.
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString("base64");
      const mimeType = contentType || "image/png";
      const dataUrl = `data:${mimeType};base64,${base64}`;
      
      return NextResponse.json({ imageUrl: dataUrl });
    }

  } catch (error: any) {
    console.error("[Next API - Remove BG Catch]", error);
    return NextResponse.json({ error: "Erro interno ao processar a imagem." }, { status: 500 });
  }
}
