import { GoogleGenAI } from "@google/genai";
import { ProcessingResult } from "../types";

export const analyzeMaterialData = async (data: ProcessingResult): Promise<string> => {
  try {
    if (!process.env.API_KEY) {
      return "API Key is missing. Please configure the environment.";
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Create a summary of the data to avoid token limits
    const sampleSize = 20; // Take 20 points
    const step = Math.floor(data.data.length / sampleSize) || 1;
    const sampledData = data.data
      .filter((_, i) => i % step === 0)
      .map(d => `Strain: ${d.strain.toFixed(3)}, Load: ${d.load.toFixed(2)}`)
      .join('\n');

    const prompt = `
      You are an expert Material Science Engineer.
      Analyze the following Compression Test data for specimen "${data.specimenLabel}".
      
      Summary Stats:
      - Max Load: ${data.maxLoad.toFixed(2)} kgf
      - Max Strain: ${data.maxStrain.toFixed(3)} mm
      
      Sampled Data Points (Strain vs Load):
      ${sampledData}
      
      Please provide:
      1. A brief assessment of the material's behavior (Linearity, Yielding behavior if visible).
      2. A comment on the maximum load capacity.
      3. Any potential anomalies based on the sampled data trend.
      
      Keep the response professional, concise, and formatted in Markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Failed to analyze data via Gemini. Please try again later.";
  }
};
