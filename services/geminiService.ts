import { GoogleGenAI } from "@google/genai";

// This service is used for any non-Live text generation if needed, 
// for example, generating the textual parts of the report if we wanted to make it dynamic.
// Currently the Live API is handled directly in AnalysisChat.tsx for audio stream management.

const apiKey = process.env.API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateAuditInsight = async (prompt: string, context: string) => {
  if (!ai) throw new Error("API Key not found");
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Context: ${context}\n\nUser Question: ${prompt}`,
      config: {
        systemInstruction: "You are an expert Audit assistant. Provide concise, risk-focused answers."
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating insight.";
  }
};
