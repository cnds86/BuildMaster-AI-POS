/**
 * MHX-POS AI Router — Multi-Provider
 *
 * Supports: gemini | openai | anthropic | ollama
 *           | minimax | openrouter | deepseek
 *
 * Set AI_PROVIDER in .env to switch (default: gemini).
 *
 * All AI calls are server-side only — API keys never reach the browser.
 */

import { Elysia, t } from 'elysia'

// ─── Provider SDK imports ──────────────────────────────────────────────────────
import { GoogleGenAI, Type } from '@google/genai'

// ─── Provider Config ──────────────────────────────────────────────────────────
type AIProvider =
  | 'gemini'
  | 'openai'
  | 'anthropic'
  | 'ollama'
  | 'minimax'
  | 'openrouter'
  | 'deepseek'

const PROVIDER: AIProvider = (process.env.AI_PROVIDER as AIProvider) || 'gemini'

const GEMINI_API_KEY     = process.env.GEMINI_API_KEY     || ''
const OPENAI_API_KEY     = process.env.OPENAI_API_KEY     || ''
const ANTHROPIC_API_KEY  = process.env.ANTHROPIC_API_KEY  || ''
const OLLAMA_BASE_URL    = process.env.OLLAMA_BASE_URL     || 'http://localhost:11434'
const OLLAMA_MODEL       = process.env.OLLAMA_MODEL       || 'llama3.2'
const MINIMAX_API_KEY    = process.env.MINIMAX_API_KEY    || ''
const MINIMAX_GROUP_ID   = process.env.MINIMAX_GROUP_ID    || ''
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ''
const DEEPSEEK_API_KEY   = process.env.DEEPSEEK_API_KEY   || ''

// ─── Prompt Templates ─────────────────────────────────────────────────────────
// Centralised so they're easy to audit and modify per task type.
const SYSTEM_INSTRUCTIONS: Record<string, string> = {
  construction_estimate: `You are an expert construction estimator and civil engineer (Quantity Surveyor).
Calculate required materials with 5-10% waste margin.
Return ONLY a JSON array where each item has: productName, estimatedQuantity, unit, reasoning, matchedProductId (null if no inventory match).
Suggest complementary items (e.g. bricks → cement + sand).`,

  inventory_analysis: `You are an intelligent retail inventory manager for a construction materials store.
Analyze inventory and sales data. Return ONLY a JSON object with:
- reorders[]: low-stock items {productId, productName, currentStock, suggestedReorderQty, priority: "High"|"Medium"|"Low", reasoning}
- newProducts[]: suggested new products {name, categoryName, estimatedPrice, suggestedUnit, reasoning}
- bundles[]: frequently co-purchased bundles {bundleName, components[], estimatedPrice, reasoning, targetAudience}`,

  business_insights: `You are a senior business analyst for a retail store.
Analyze sales data, inventory status, and expenses. Return ONLY a JSON object with:
- summary: 1-sentence executive summary mentioning profitability
- trendDirection: "up" | "down" | "stable"
- actionItems[]: 3 actionable bullet points for the manager
- predictedRevenueNextWeek: number
- topPerformingCategory: string`,
}

// ─── Provider Adapters ─────────────────────────────────────────────────────────
// Each adapter receives (contents, systemInstruction) and returns a string response.

async function geminiChat(contents: string, systemInstruction: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents,
    config: {
      systemInstruction,
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  })
  return response.text ?? ''
}

async function openAIChat(contents: string, systemInstruction: string): Promise<string> {
  const body: Record<string, unknown> = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: contents },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`)
  const data = await res.json() as { choices: { message: { content: string } }[] }
  return data.choices[0]?.message?.content ?? ''
}

async function anthropicChat(contents: string, systemInstruction: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 4096,
      system: systemInstruction,
      messages: [{ role: 'user', content: contents }],
    }),
  })
  if (!res.ok) throw new Error(`Anthropic error: ${res.status}`)
  const data = await res.json() as { content: { text: string }[] }
  return data.content[0]?.text ?? ''
}

async function ollamaChat(contents: string, systemInstruction: string): Promise<string> {
  const model = OLLAMA_MODEL
  const res = await fetch(`${OLLAMA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: contents },
      ],
      stream: false,
    }),
  })
  if (!res.ok) throw new Error(`Ollama error: ${res.status}`)
  const data = await res.json() as { choices: { message: { content: string } }[] }
  return data.choices[0]?.message?.content ?? ''
}

// ── MiniMax ────────────────────────────────────────────────────────────────────
async function minimaxChat(contents: string, systemInstruction: string): Promise<string> {
  const model = process.env.MINIMAX_MODEL || 'MiniMax-Text-01'
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: contents },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  }
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${MINIMAX_API_KEY}`,
    'Content-Type': 'application/json',
  }
  if (MINIMAX_GROUP_ID) headers['GroupId'] = MINIMAX_GROUP_ID

  const res = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`MiniMax error: ${res.status}`)
  const data = await res.json() as { choices: { message: { content: string } }[] }
  return data.choices[0]?.message?.content ?? ''
}

// ── OpenRouter ────────────────────────────────────────────────────────────────
async function openrouterChat(contents: string, systemInstruction: string): Promise<string> {
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku'
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: contents },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  }
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://mhx-pos.local',
      'X-Title': 'MHX-POS',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`)
  const data = await res.json() as { choices: { message: { content: string } }[] }
  return data.choices[0]?.message?.content ?? ''
}

// ── DeepSeek ──────────────────────────────────────────────────────────────────
async function deepseekChat(contents: string, systemInstruction: string): Promise<string> {
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat'
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: contents },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  }
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`DeepSeek error: ${res.status}`)
  const data = await res.json() as { choices: { message: { content: string } }[] }
  return data.choices[0]?.message?.content ?? ''
}

// ─── Dispatcher ────────────────────────────────────────────────────────────────
async function aiChat(contents: string, type: string): Promise<string> {
  const instruction = SYSTEM_INSTRUCTIONS[type] ?? `You are a helpful AI assistant. ${type}`
  switch (PROVIDER) {
    case 'gemini':     return geminiChat(contents, instruction)
    case 'openai':     return openAIChat(contents, instruction)
    case 'anthropic':  return anthropicChat(contents, instruction)
    case 'ollama':     return ollamaChat(contents, instruction)
    case 'minimax':    return minimaxChat(contents, instruction)
    case 'openrouter': return openrouterChat(contents, instruction)
    case 'deepseek':   return deepseekChat(contents, instruction)
    default:           throw new Error(`Unknown AI provider: ${PROVIDER}`)
  }
}

// ─── Request Body Shape ────────────────────────────────────────────────────────
interface AiRequest {
  type: string
  query?:       string
  inventory?:   unknown[]
  products?:    unknown[]
  sales?:       unknown[]
  expenses?:    unknown[]
}

function buildContents(req: AiRequest): string {
  switch (req.type) {
    case 'construction_estimate': {
      const inventoryList = (req.inventory as { id: string; name: string; unit: string; price: number }[])
        ?.map(p => `{id: "${p.id}", name: "${p.name}", unit: "${p.unit}", price: ${p.price}}`).join('\n') ?? ''
      return `Query: ${req.query}\n\nStore Inventory:\n${inventoryList}`
    }
    case 'inventory_analysis':
      return JSON.stringify({ products: req.products, sales: req.sales })
    case 'business_insights':
      return JSON.stringify({ sales: req.sales, products: req.products, expenses: req.expenses })
    default:
      return JSON.stringify(req)
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────
export const aiRoutes = (app: Elysia) =>
  app.group('/api/ai', (app) =>
    app
      // POST /api/ai/chat — unified multi-provider endpoint
      .post('/chat', async ({ body, set }) => {
        const req = body as AiRequest

        // Guard: check provider key is present
        if (PROVIDER === 'gemini'     && !GEMINI_API_KEY)      return { error: 'GEMINI_API_KEY not set' }
        if (PROVIDER === 'openai'     && !OPENAI_API_KEY)      return { error: 'OPENAI_API_KEY not set' }
        if (PROVIDER === 'anthropic'  && !ANTHROPIC_API_KEY)   return { error: 'ANTHROPIC_API_KEY not set' }
        if (PROVIDER === 'minimax'    && !MINIMAX_API_KEY)     return { error: 'MINIMAX_API_KEY not set' }
        if (PROVIDER === 'openrouter' && !OPENROUTER_API_KEY)  return { error: 'OPENROUTER_API_KEY not set' }
        if (PROVIDER === 'deepseek'   && !DEEPSEEK_API_KEY)    return { error: 'DEEPSEEK_API_KEY not set' }
        // ollama has no key requirement

        try {
          const contents = buildContents(req)
          const text = await aiChat(contents, req.type)
          if (!text) return { result: null, error: 'Empty response from AI provider' }
          try {
            const parsed = JSON.parse(text)
            return { result: parsed }
          } catch {
            // Not JSON — return as plain text
            return { result: text }
          }
        } catch (err) {
          console.error(`[AI /chat] provider=${PROVIDER} type=${req.type}`, err)
          set.status = 502
          return { error: `AI request failed (${PROVIDER})` }
        }
      }, {
        body: t.Object({
          type: t.String(),
        }, { additionalProperties: true }),
      })

      // GET /api/ai/providers — which providers are configured
      .get('/providers', () => ({
        current: PROVIDER,
        configured: {
          gemini:     !!GEMINI_API_KEY,
          openai:     !!OPENAI_API_KEY,
          anthropic:  !!ANTHROPIC_API_KEY,
          ollama:     true, // ollama is always "available" (local)
          minimax:    !!MINIMAX_API_KEY,
          openrouter: !!OPENROUTER_API_KEY,
          deepseek:   !!DEEPSEEK_API_KEY,
        },
      }))
  )
