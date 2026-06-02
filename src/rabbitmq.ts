/**
 * RabbitMQ Client for MHX-POS
 * Publishes sale events to mahaxay.events exchange
 */

import amqp from 'amqplib'

interface RabbitMQConfig {
  url: string
  exchange: string
}

class RabbitMQClient {
  private connection: amqp.Connection | null = null
  private channel: amqp.Channel | null = null
  private config: RabbitMQConfig
  private pendingMessages: Array<{ routingKey: string; message: object }> = []
  private isConnected = false
  private retryInterval: ReturnType<typeof setInterval> | null = null

  constructor(config: RabbitMQConfig) {
    this.config = config
  }

  async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.config.url)
      this.channel = await this.connection.createChannel()
      await this.channel.assertExchange(this.config.exchange, 'topic', { durable: true })
      this.isConnected = true
      console.log('[RabbitMQ] Connected to', this.config.url)
      
      // Flush pending messages
      if (this.pendingMessages.length > 0) {
        console.log('[RabbitMQ] Flushing', this.pendingMessages.length, 'pending messages')
        for (const { routingKey, message } of this.pendingMessages) {
          await this.publish(routingKey, message)
        }
        this.pendingMessages = []
      }

      // Handle connection close
      this.connection.on('close', () => {
        console.log('[RabbitMQ] Connection closed, will retry...')
        this.isConnected = false
        this.scheduleReconnect()
      })
    } catch (err) {
      console.error('[RabbitMQ] Connect error:', err)
      this.isConnected = false
      this.scheduleReconnect()
      throw err
    }
  }

  private scheduleReconnect(): void {
    if (this.retryInterval) return
    this.retryInterval = setInterval(async () => {
      console.log('[RabbitMQ] Attempting reconnect...')
      try {
        await this.connect()
        if (this.retryInterval) {
          clearInterval(this.retryInterval)
          this.retryInterval = null
        }
      } catch {
        // Will retry again
      }
    }, 30000) // Retry every 30 seconds
  }

  async publish(routingKey: string, message: object): Promise<boolean> {
    const content = Buffer.from(JSON.stringify(message))
    
    if (!this.channel || !this.isConnected) {
      console.log('[RabbitMQ] Not connected, queueing message')
      this.pendingMessages.push({ routingKey, message })
      
      // Alert if queue too large
      if (this.pendingMessages.length > 100) {
        console.error('[RabbitMQ] WARNING: Pending messages exceeds 100!')
      }
      return false
    }

    try {
      return this.channel.publish(this.config.exchange, routingKey, content, {
        persistent: true,
        contentType: 'application/json',
        timestamp: Date.now(),
      })
    } catch (err) {
      console.error('[RabbitMQ] Publish error:', err)
      this.pendingMessages.push({ routingKey, message })
      return false
    }
  }

  async close(): Promise<void> {
    if (this.retryInterval) {
      clearInterval(this.retryInterval)
      this.retryInterval = null
    }
    if (this.channel) await this.channel.close()
    if (this.connection) await this.connection.close()
    this.isConnected = false
  }

  isReady(): boolean {
    return this.isConnected
  }

  pendingCount(): number {
    return this.pendingMessages.length
  }
}

// Singleton instance
const posRabbitMQ = new RabbitMQClient({
  url: process.env.RABBITMQ_URL || 'amqp://admin:mhxrabbit123@localhost:5672/%2Fmhx-erp',
  exchange: 'mahaxay.events',
})

export async function initRabbitMQ(): Promise<void> {
  try {
    await posRabbitMQ.connect()
  } catch (err) {
    console.warn('[RabbitMQ] Initial connection failed, will retry in background:', err)
  }
}

export function getRabbitMQ(): RabbitMQClient {
  return posRabbitMQ
}

// ─── Event Publishing Helper ──────────────────────────────────────────────

export interface SaleEventPayload {
  id: string
  branch_id: string | null
  customer_id: string | null
  items: Array<{
    product_id: string
    sku?: string
    name?: string
    quantity: number
    sell_price: number
    stock_before?: number
    stock_after?: number
  }>
  subtotal: number
  discount_amount: number
  tax_amount: number
  total: number
  payment_method: string
  payment_status: string
  status: string
  created_at: string
}

export function createSaleCompletedEvent(
  sale: SaleEventPayload,
  correlationId?: string
): object {
  return {
    event_id: crypto.randomUUID(),
    event_type: 'sale.completed',
    version: '1.0',
    timestamp: new Date().toISOString(),
    source_system: 'MHX-POS',
    correlation_id: correlationId || sale.id,
    payload: { sale },
  }
}

export function createSaleReturnedEvent(
  sale: SaleEventPayload,
  correlationId?: string,
  causationId?: string
): object {
  return {
    event_id: crypto.randomUUID(),
    event_type: 'sale.returned',
    version: '1.0',
    timestamp: new Date().toISOString(),
    source_system: 'MHX-POS',
    correlation_id: correlationId || sale.id,
    causation_id: causationId,
    payload: { sale },
  }
}

export async function publishSaleCompleted(sale: SaleEventPayload): Promise<boolean> {
  const event = createSaleCompletedEvent(sale)
  const published = await posRabbitMQ.publish('pos.sale.completed', event)
  console.log('[RabbitMQ] sale.completed published:', published, 'event_id:', (event as any).event_id)
  return published
}

export async function publishSaleReturned(sale: SaleEventPayload, causationId?: string): Promise<boolean> {
  const event = createSaleReturnedEvent(sale, undefined, causationId)
  const published = await posRabbitMQ.publish('pos.sale.returned', event)
  console.log('[RabbitMQ] sale.returned published:', published, 'event_id:', (event as any).event_id)
  return published
}

export default posRabbitMQ
