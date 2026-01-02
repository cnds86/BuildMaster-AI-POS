
import { GoogleGenAI, Type } from "@google/genai";
import { EstimateResultItem, Product, InventoryAnalysisResult, Sale, BusinessInsight } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getConstructionEstimate = async (
  query: string, 
  inventory: Product[]
): Promise<EstimateResultItem[]> => {
  const inventoryList = inventory.map(p => `${p.name} (ID: ${p.id}, Unit: ${p.unit})`).join(', ');

  const systemInstruction = `
    You are an expert construction estimator. Analyze project requests and calculate materials.
    Store Inventory: [${inventoryList}]
    Rules: 1. 10% waste margin. 2. Match matchedProductId. 3. JSON array output.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: query,
      config: {
        systemInstruction,
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

    return JSON.parse(response.text || '[]') as EstimateResultItem[];
  } catch (error) {
    console.error("Gemini Estimate Error:", error);
    return [];
  }
};

export const analyzeInventory = async (products: Product[], sales: Sale[]): Promise<InventoryAnalysisResult | null> => {
  const context = {
    inventory: products.map(p => ({ id: p.id, name: p.name, stock: p.stock, min: p.minStock })),
    recentSales: sales.slice(0, 20).map(s => s.items.map(i => i.name))
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: JSON.stringify(context),
      config: {
        systemInstruction: "You are an AI Inventory Manager. Identify reorders, suggest new products, and detect frequently bought together bundles. Return JSON object.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reorders: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { productId: { type: Type.STRING }, productName: { type: Type.STRING }, currentStock: { type: Type.NUMBER }, suggestedReorderQty: { type: Type.NUMBER }, priority: { type: Type.STRING }, reasoning: { type: Type.STRING } } } },
            newProducts: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, categoryName: { type: Type.STRING }, estimatedPrice: { type: Type.NUMBER }, reasoning: { type: Type.STRING }, suggestedUnit: { type: Type.STRING } } } },
            bundles: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { bundleName: { type: Type.STRING }, components: { type: Type.ARRAY, items: { type: Type.STRING } }, estimatedPrice: { type: Type.NUMBER }, reasoning: { type: Type.STRING }, targetAudience: { type: Type.STRING } } } }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}') as InventoryAnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
};

export const generateBusinessInsights = async (sales: Sale[], products: Product[]): Promise<BusinessInsight | null> => {
  const context = {
    totalSales: sales.length,
    lowStock: products.filter(p => p.stock <= (p.minStock || 0)).length
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: JSON.stringify(context),
      config: {
        systemInstruction: "Senior business analyst. Analyze data. Return 1-sentence summary, trend (up/down/stable), 3 action items, predicted 7-day revenue, and top category. JSON output.",
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text || '{}') as BusinessInsight;
  } catch (error) {
    return {
      summary: "Performance analysis currently unavailable.",
      trendDirection: "stable",
      actionItems: ["Monitor stock levels", "Verify sales data", "Check network connection"],
      predictedRevenueNextWeek: 0,
      topPerformingCategory: "General"
    };
  }
};
