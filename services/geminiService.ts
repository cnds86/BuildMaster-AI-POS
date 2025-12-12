
import { GoogleGenAI, Type } from "@google/genai";
import { EstimateResultItem, Product, InventoryAnalysisResult, Sale } from "../types";

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

export const analyzeInventory = async (products: Product[], sales: Sale[]): Promise<InventoryAnalysisResult | null> => {
  if (!ai) {
    console.warn("Gemini API Key is missing.");
    return null;
  }

  // Create a condensed view of inventory
  const productSummary = products.map(p => ({
    id: p.id,
    name: p.name,
    stock: p.stock,
    min: p.minStock || 20,
    unit: p.unit,
    category: p.category
  }));

  // Create a summary of sales transactions (condensed to save tokens)
  // We only send the last 20 transactions to analyze recent trends
  const recentSales = sales.slice(0, 20).map(s => ({
    items: s.items.map(i => i.name)
  }));

  const systemInstruction = `
    You are an intelligent retail inventory manager for a construction materials store.
    
    Data Provided:
    1. Current Product Inventory (Stock levels).
    2. Recent Sales Transactions (Items bought together).

    Your tasks:
    1. REORDERS: Identify items critically low (stock <= minStock) and suggest reorder qty.
    2. NEW PRODUCTS: Suggest NEW products we should add based on gaps in our catalog.
    3. BUNDLES: Analyze the sales transactions. If certain items are frequently bought together (e.g. Cement + Sand), suggest a "Bundle" or "Combo Pack" product we could create to simplify purchasing or offer a deal.

    Return the result strictly as a JSON object with 'reorders', 'newProducts', and 'bundles' arrays.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: JSON.stringify({ inventory: productSummary, sales: recentSales }),
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reorders: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  productId: { type: Type.STRING },
                  productName: { type: Type.STRING },
                  currentStock: { type: Type.NUMBER },
                  suggestedReorderQty: { type: Type.NUMBER },
                  priority: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
                  reasoning: { type: Type.STRING }
                }
              }
            },
            newProducts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  categoryName: { type: Type.STRING },
                  estimatedPrice: { type: Type.NUMBER },
                  suggestedUnit: { type: Type.STRING },
                  reasoning: { type: Type.STRING }
                }
              }
            },
            bundles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  bundleName: { type: Type.STRING },
                  components: { type: Type.ARRAY, items: { type: Type.STRING } },
                  estimatedPrice: { type: Type.NUMBER },
                  reasoning: { type: Type.STRING },
                  targetAudience: { type: Type.STRING }
                }
              }
            }
          },
          required: ['reorders', 'newProducts', 'bundles']
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as InventoryAnalysisResult;
    }
    return null;
  } catch (error) {
    console.error("Gemini Inventory Analysis Error:", error);
    return null;
  }
};
