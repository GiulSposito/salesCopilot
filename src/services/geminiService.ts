// import { GoogleGenAI } from "@google/genai";
// const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// Mock service for prototype - Gemini API disabled
export async function chatWithAI(prompt: string, context: string) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Return mock response
  return `🤖 **Modo Protótipo - AI Desabilitada**

Sua pergunta: "${prompt}"

Esta é uma resposta simulada. Para habilitar respostas reais da IA, configure a GEMINI_API_KEY no arquivo .env.local e descomente o código em src/services/geminiService.ts.

**Contexto da proposta:**
- Seção atual processada com sucesso
- Análise de conteúdo em modo simulação

Para assistência real, algumas sugestões:
- Revise a estrutura da seção atual
- Adicione mais detalhes técnicos
- Considere incluir métricas e KPIs`;
}
