/**
 * MHX-POS AI Service — Server-side proxy (multi-provider)
 *
 * ALL AI calls go through the Elysia backend at /api/ai/chat.
 * API keys live ONLY in the server's .env — never exposed to the browser.
 *
 * Provider selection: set AI_PROVIDER=gemini|openai|anthropic|ollama on the server.
 * Frontend can optionally pass `provider` in the request body.
 *
 * This file lives outside src/ so Vite does NOT bundle it.
 */

import type { EstimateResultItem, Product, InventoryAnalysisResult, Sale, BusinessInsight } from '../src/types';

type AIProvider = 'gemini' | 'openai' | 'anthropic' | 'ollama'

async function aiRequest(type: string, payload: Record<string, unknown>): Promise<unknown> {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, ...payload }),
  })
  if (!res.ok) throw new Error(`AI request failed: ${res.status}`)
  const data = await res.json() as { result?: unknown; error?: string }
  if (data.error) throw new Error(data.error)
  return data.result
}

export const getConstructionEstimate = async (
  query: string,
  inventory: Product[],
): Promise<EstimateResultItem[]> => {
  const result = await aiRequest('construction_estimate', { query, inventory }) as EstimateResultItem[]
  return result ?? []
}

export const analyzeInventory = async (
  products: Product[],
  sales: Sale[],
): Promise<InventoryAnalysisResult | null> => {
  try {
    const result = await aiRequest('inventory_analysis', { products, sales }) as InventoryAnalysisResult
    return result ?? null
  } catch {
    return null
  }
}

export const generateBusinessInsights = async (
  sales: Sale[],
  products: Product[],
  expenses: unknown[] = [],
): Promise<BusinessInsight | null> => {
  try {
    const result = await aiRequest('business_insights', { sales, products, expenses }) as BusinessInsight
    return result ?? null
  } catch {
    return null
  }
}

// Optional: query which provider is active
export async function getActiveProvider(): Promise<{ current: AIProvider; configured: Record<AIProvider, boolean> }> {
  const res = await fetch('/api/ai/providers')
  if (!res.ok) throw new Error('Failed to fetch AI provider info')
  return res.json() as Promise<{ current: AIProvider; configured: Record<AIProvider, boolean> }>
}

// Stub: image product identification (not yet routed through /api/ai/chat)
export async function identifyProductFromImage(_base64Image: string): Promise<Partial<Product> | null> {
  console.warn('[geminiService] identifyProductFromImage is not yet implemented — set AI_PROVIDER to a provider with vision support')
  return null
}
