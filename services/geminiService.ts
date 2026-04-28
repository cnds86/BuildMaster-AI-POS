
import { GoogleGenAI, Type } from "@google/genai";
import { EstimateResultItem, Product, InventoryAnalysisResult, Sale, BusinessInsight } from "../types";

const API_KEY = process.env.API_KEY || '';

// Initialize the client only if the key is present
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export const getConstructionEstimate = async (
  query: string, 
  inventory: Product[]
): Promise<EstimateResultItem[]> => {
  if (!ai) {
    console.warn("Gemini API Key is missing.");
    return [];
  }

  // Optimize inventory context to save tokens, but include Price for value estimation
  const inventoryList = inventory.map(p => 
    `{id: "${p.id}", name: "${p.name}", unit: "${p.unit}", price: ${p.price}}`
  ).join('\n');

  const systemInstruction = `
    You are an expert construction estimator and civil engineer (Quantity Surveyor).
    
    Current Store Inventory:
    ${inventoryList}

    Your Task:
    Analyze the user's construction project request (e.g., "build a 4x3m brick wall").
    Calculate the required materials with a standard 5-10% waste margin included.
    
    Rules:
    1. MATCHING: Attempt to match requirements to items in the 'Current Store Inventory'. 
       - If a match is found, return the exact 'id' as 'matchedProductId' and the exact 'name' from inventory.
       - If no match is found, suggest a generic product name and leave 'matchedProductId' null.
    2. QUANTITY: Return the total quantity required in the product's unit.
       - Example: If the inventory unit is 'bag' (50kg) and 200kg is needed, return 4.
    3. REASONING: Briefly explain the formula used (e.g., "Area = 12m2, approx 125 bricks/m2 + 10% waste").
    4. VARIETY: Suggest complementary items (e.g., if asking for bricks, also suggest cement and sand).

    Return ONLY a JSON array.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: query,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2, // Low temperature for math consistency
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
  const recentSales = sales.slice(0, 50).map(s => ({
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
      model: 'gemini-3-pro-preview', // Use Pro for complex reasoning on large datasets
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

export const generateBusinessInsights = async (
  sales: Sale[], 
  products: Product[],
  expenses: any[] = []
): Promise<BusinessInsight | null> => {
  if (!ai) {
    return null;
  }

  // Summarize daily sales for the last 30 days
  const dailyRevenue: Record<string, number> = {};
  const categoryRevenue: Record<string, number> = {};
  
  sales.forEach(s => {
    const date = new Date(s.date).toISOString().split('T')[0];
    dailyRevenue[date] = (dailyRevenue[date] || 0) + s.total;
    
    s.items.forEach(item => {
       const cat = item.category || 'General'; 
       categoryRevenue[cat] = (categoryRevenue[cat] || 0) + (item.sellPrice * item.quantity);
    });
  });

  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);

  const lowStockCount = products.filter(p => p.stock <= (p.minStock || 0)).length;

  const context = {
    dailySales: dailyRevenue,
    categoryPerformance: categoryRevenue,
    lowStockItemsCount: lowStockCount,
    totalProducts: products.length,
    totalExpenses
  };

  const systemInstruction = `
    You are a senior business analyst for a retail store.
    Analyze the provided sales data, inventory status, and total expenses.
    
    Tasks:
    1. Write a 1-sentence Executive Summary of performance (mentioning profitability after expenses).
    2. Determine the trend direction ('up', 'down', 'stable').
    3. List 3 actionable bullet points for the manager (e.g. restock, promo, cut expenses).
    4. Predict the TOTAL revenue for the NEXT 7 DAYS based on the recent daily trend.
    5. Identify the top performing category name.

    Return JSON matching the BusinessInsight interface.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Pro for financial analysis
      contents: JSON.stringify(context),
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            trendDirection: { type: Type.STRING, enum: ['up', 'down', 'stable'] },
            actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
            predictedRevenueNextWeek: { type: Type.NUMBER },
            topPerformingCategory: { type: Type.STRING }
          },
          required: ['summary', 'trendDirection', 'actionItems', 'predictedRevenueNextWeek', 'topPerformingCategory']
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as BusinessInsight;
    }
    return null;
  } catch (error) {
    console.error("Gemini Business Insight Error:", error);
    return null;
  }
};

/**
 * Identifies a product from an image (Base64) and suggests details.
 */
export const identifyProductFromImage = async (base64Image: string): Promise<Partial<Product> | null> => {
  if (!ai) return null;

  try {
    // Correct way to pass image data to gemini-2.5-flash-image or newer models via generateContent
    // The previous code had a slight issue with data format for the new SDK
    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg', // Assuming jpeg from capture
        data: base64Image.split(',')[1] // Remove data:image/jpeg;base64, prefix
      }
    };

    const prompt = `
      Analyze this product image for a POS system.
      Identify the product and return a JSON object with:
      - name: A concise product name (e.g., "Coca Cola 325ml", "Hammer 16oz").
      - estimatedPrice: An estimated retail price in local currency number (LAK/THB/USD mix context, just give a number).
      - category: A suggested general category name.
      - unit: Suggested unit (e.g., "pc", "can", "bottle", "kg").
      - description: Short description.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Specialized image model
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        // Nano banana models do NOT support responseMimeType/responseSchema as of current version
        // We must parse the text manually or use a standard text model with image capabilities if schema is required.
        // However, gemini-3-flash-preview DOES support images + schema. Let's switch to that for reliability.
      }
    });
    
    // Better Approach: Use Gemini 3 Flash for Multimodal + Schema
    const robustResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    estimatedPrice: { type: Type.NUMBER },
                    category: { type: Type.STRING },
                    unit: { type: Type.STRING },
                    description: { type: Type.STRING }
                },
                required: ['name', 'estimatedPrice', 'unit']
            }
        }
    });

    if (robustResponse.text) {
      const data = JSON.parse(robustResponse.text);
      return {
        name: data.name,
        price: data.estimatedPrice,
        unit: data.unit,
      };
    }
    return null;
  } catch (error) {
    console.error("Gemini Image Analysis Error:", error);
    return null;
  }
};
