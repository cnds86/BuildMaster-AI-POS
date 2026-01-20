
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
    console.warn("Gemini API Key is missing. Using mock estimate.");
    // Mock response for demo
    return [
      {
        productName: "Portland Cement Type 1",
        estimatedQuantity: 5,
        unit: "bag",
        reasoning: "Estimated for 10m2 wall area based on standard consumption.",
        matchedProductId: inventory.find(p => p.name.includes('Cement'))?.id
      },
      {
        productName: "Red Brick",
        estimatedQuantity: 500,
        unit: "pc",
        reasoning: "Standard brick wall calculation (50 bricks/m2).",
        matchedProductId: inventory.find(p => p.name.includes('Brick'))?.id
      },
      {
        productName: "Construction Sand",
        estimatedQuantity: 1,
        unit: "m3",
        reasoning: "Required for mortar mix (1:3 ratio).",
        matchedProductId: null // Not in mock inventory
      }
    ];
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
      model: 'gemini-2.5-flash',
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
    console.warn("Gemini API Key is missing. Returning mock inventory analysis.");
    return {
      reorders: [
        {
          productId: products.find(p => p.name.includes('Cement'))?.id || 'p1',
          productName: 'Portland Cement Type 1',
          currentStock: 45,
          suggestedReorderQty: 200,
          priority: 'High',
          reasoning: 'Stock level is nearing minimum threshold and sales velocity is trending up.'
        },
        {
          productId: products.find(p => p.name.includes('Paint'))?.id || 'p4',
          productName: 'Premium Interior Paint',
          currentStock: 12,
          suggestedReorderQty: 50,
          priority: 'Medium',
          reasoning: 'Seasonal demand expected to increase next month.'
        }
      ],
      newProducts: [
        {
          name: 'Safety Helmet (Hard Hat)',
          categoryName: 'Tools & Hardware',
          estimatedPrice: 85000,
          suggestedUnit: 'pc',
          reasoning: 'Essential safety gear frequently requested by contractors but missing from inventory.'
        },
        {
          name: 'Work Gloves (Leather)',
          categoryName: 'General Consumables',
          estimatedPrice: 35000,
          suggestedUnit: 'pair',
          reasoning: 'High volume accessory with good margins, often bought with cement/bricks.'
        }
      ],
      bundles: [
        {
          bundleName: 'Masonry Starter Kit',
          components: ['Portland Cement', 'Red Brick', 'Trowel (Suggested)'],
          estimatedPrice: 1250000,
          reasoning: 'Analysis shows 80% of brick purchases also include cement. Bundling encourages larger average order value.',
          targetAudience: 'Small Contractors & DIY'
        }
      ]
    };
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

export const generateBusinessInsights = async (sales: Sale[], products: Product[]): Promise<BusinessInsight | null> => {
  if (!ai) {
    // Return dummy data if no key, ensuring UI works
    return {
      summary: "Mock Insight: Revenue is trending positively. Consider restocking fast-moving items like Cement.",
      trendDirection: "up",
      actionItems: ["Restock Cement", "Review pricing for Red Brick", "Promote slow-moving Tiles"],
      predictedRevenueNextWeek: 12500000,
      topPerformingCategory: "Cement & Concrete"
    };
  }

  // Summarize daily sales for the last 30 days
  const dailyRevenue: Record<string, number> = {};
  const categoryRevenue: Record<string, number> = {};
  
  sales.forEach(s => {
    const date = new Date(s.date).toISOString().split('T')[0];
    dailyRevenue[date] = (dailyRevenue[date] || 0) + s.total;
    
    s.items.forEach(item => {
       // Simplified category tracking using item name keywords or ID if available
       // In production, map ID to Category Name properly
       const cat = item.category || 'General'; 
       categoryRevenue[cat] = (categoryRevenue[cat] || 0) + (item.sellPrice * item.quantity);
    });
  });

  const lowStockCount = products.filter(p => p.stock <= (p.minStock || 0)).length;

  const context = {
    dailySales: dailyRevenue,
    categoryPerformance: categoryRevenue,
    lowStockItemsCount: lowStockCount,
    totalProducts: products.length
  };

  const systemInstruction = `
    You are a senior business analyst for a retail store.
    Analyze the provided sales data (Daily Revenue map) and Inventory status.
    
    Tasks:
    1. Write a 1-sentence Executive Summary of performance.
    2. Determine the trend direction ('up', 'down', 'stable').
    3. List 3 actionable bullet points for the manager (e.g., restock, run promo, cut costs).
    4. Predict the TOTAL revenue for the NEXT 7 DAYS based on the recent daily trend.
    5. Identify the top performing category name.

    Return JSON matching the BusinessInsight interface.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
