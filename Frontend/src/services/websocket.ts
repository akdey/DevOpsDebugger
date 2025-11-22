import { WS_URL } from './constants'

interface WebSocketConfig {
  token: string
  onMessage: (data: any) => void
  onError?: (err: Event) => void
  onClose?: (evt?: CloseEvent) => void
}

export class WebSocketClient {
  private ws: WebSocket | null = null
  private config: WebSocketConfig
  private reconnectAttempts = 0
  private maxReconnectAttempts = 6
  private pending: string[] = []

  constructor(config: WebSocketConfig) {
    this.config = config
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Build URL with token as query param, strip trailing slash
        const baseUrl = WS_URL.replace(/\/$/, '')
        let wsUrl = baseUrl
        if (this.config.token) {
          wsUrl = `${baseUrl}/chat?token=${encodeURIComponent(this.config.token)}`
        }
        console.debug('[WebSocketClient] connecting to', wsUrl)
        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
          this.reconnectAttempts = 0
          console.debug('[WebSocketClient] open')
          // flush any pending messages
          while (this.pending.length > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
            const m = this.pending.shift() as string
            try {
              this.ws.send(m)
            } catch (e) {
              console.warn('[WebSocketClient] failed to send pending message', e)
              this.pending.unshift(m)
              break
            }
          }
          resolve()
        }

        this.ws.onmessage = (evt) => {
          try {
            const data = JSON.parse(evt.data)
            this.config.onMessage(data)
          } catch (e) {
            this.config.onMessage(evt.data)
          }
        }

        this.ws.onerror = (err) => {
          this.config.onError?.(err)
        }

        this.ws.onclose = (evt) => {
          // forward close event to caller
          this.config.onClose?.(evt)
          // if unauthorized close code (1008), do not attempt reconnect and let caller handle redirect
          if (evt && (evt as CloseEvent).code === 1008) {
            return
          }
          // try reconnect
          this.attemptReconnect()
        }
      } catch (err) {
        reject(err)
      }
    })
  }

  send(message: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message)
      return
    }
    // queue message to send when connection opens
    this.pending.push(message)
  }

  isOpen() {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return
    const delay = Math.pow(2, this.reconnectAttempts) * 500
    this.reconnectAttempts += 1
    setTimeout(() => {
      this.connect().catch(() => this.attemptReconnect())
    }, delay)
  }
}

export function createWebSocketClient(config: WebSocketConfig) {
  return new WebSocketClient(config)
}
