import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function chatWithAI(prompt: string, context: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          parts: [
            { text: `You are an expert commercial proposal assistant. 
            Context of the current proposal section:
            ${context}
            
            User request: ${prompt}` }
          ]
        }
      ],
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Desculpe, encontrei um erro ao processar sua solicitação.";
  }
}
