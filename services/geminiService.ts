import { GoogleGenAI, Type } from "@google/genai";
import { EstimateResultItem, Product } from "../types";

const API_KEY = process.env.API_KEY || '';

// Initialize the client only if the key is present to avoid runtime crashes on empty keys
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export const getConstructionEstimate = async (
  query: string, 
  inventory: Product[]
): Promise<EstimateResultItem[]> => {
  if (!ai) {
    console.warn("Gemini API Key is missing.");
    return [
      {
        productName: "System Error",
        estimatedQuantity: 0,
        unit: "N/A",
        reasoning: "API Key not configured. Please check metadata or environment."
      }
    ];
  }

  const inventoryList = inventory.map(p => `${p.name} (ID: ${p.id}, Unit: ${p.unit})`).join(', ');

  const systemInstruction = `
    You are an expert construction estimator and civil engineer. 
    Your goal is to analyze a user's construction project request (e.g., "build a 3x3m brick wall") and calculate the required materials.
    
    You have access to the following current store inventory:
    [${inventoryList}]

    Rules:
    1. Estimate the quantities realistically including a 10% waste margin.
    2. Try to match the materials to the 'matchedProductId' from the provided inventory list if possible.
    3. If a required item is NOT in the inventory, suggest it anyway but leave 'matchedProductId' null.
    4. Provide brief reasoning for the calculation.
    5. Return the result strictly as a JSON array.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              productName: { type: Type.STRING },
              estimatedQuantity: { type: Type.NUMBER },
              unit: { type: Type.STRING },
              reasoning: { type: Type.STRING },
              matchedProductId: { type: Type.STRING, nullable: true },
            },
            required: ['productName', 'estimatedQuantity', 'unit', 'reasoning']
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as EstimateResultItem[];
    }
    return [];
  } catch (error) {
    console.error("Gemini Estimate Error:", error);
    throw error;
  }
};
