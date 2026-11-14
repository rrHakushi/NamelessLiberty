import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import { ServarrServ } from '../../src/services/servarr/servarr.serv'
import { ServarrExtendedServ } from '../../src/services/servarr/servarr-extended.serv'
import { ServarrRealtimeServ } from '../../src/services/servarr/servarr-realtime.serv'
import { wsHub } from '../../src/services/ws.serv'

describe('Servarr Extended Services & Realtime Bridge', () => {
  let getCtxSpy: ReturnType<typeof spyOn>
  let sendToUserSpy: ReturnType<typeof spyOn>
  let hasConnSpy: ReturnType<typeof spyOn>

  beforeEach(() => {
    sendToUserSpy = spyOn(wsHub, 'sendToUser').mockImplementation(() => 1)
    hasConnSpy = spyOn(wsHub, 'hasUserConnections').mockReturnValue(true)
  })

  afterEach(() => {
    getCtxSpy?.mockRestore()
    sendToUserSpy?.mockRestore()
    hasConnSpy?.mockRestore()
    ServarrRealtimeServ.disconnectUser('user-1')
  })

  it('ServarrServ.getLibrary surfaces upstream errors without local DB fallback', async () => {
    getCtxSpy = spyOn(ServarrServ, 'getConnectionContext').mockResolvedValue({
      connected: true,
      provider: 'RADARR',
      hostUrl: 'http://localhost:7878',
      credentials: { hostUrl: 'http://localhost:7878', apiKey: 'test-key' },
      adapter: {
        getMovies: async () => {
          throw new Error('Radarr connection refused')
        },
      } as any,
    })

    const res = await ServarrServ.getLibrary('radarr', 'user-1')
    expect(res.success).toBe(false)
    expect(res.items).toEqual([])
    expect(res.message).toContain('Radarr connection refused')
  })

  it('ServarrExtendedServ.getConfigSection reads Sonarr v5 general settings', async () => {
    let calledSection = ''
    getCtxSpy = spyOn(ServarrServ, 'getConnectionContext').mockResolvedValue({
      connected: true,
      provider: 'SONARR',
      hostUrl: 'http://localhost:8989',
      credentials: { hostUrl: 'http://localhost:8989', apiKey: 'sonarr-key' },
      adapter: {
        getConfigSection: async (_creds: any, section: string) => {
          calledSection = section
          return { port: 8989, branch: 'main' }
        },
      } as any,
    })

    const res = await ServarrExtendedServ.getConfigSection(
      'sonarr',
      'user-1',
      'general'
    )
    expect(res.success).toBe(true)
    expect(calledSection).toBe('general')
    expect((res.data as any).port).toBe(8989)
  })

  it('ServarrExtendedServ.getCollections rewrites cover URLs to IRIS proxy', async () => {
    getCtxSpy = spyOn(ServarrServ, 'getConnectionContext').mockResolvedValue({
      connected: true,
      provider: 'RADARR',
      hostUrl: 'http://localhost:7878',
      credentials: { hostUrl: 'http://localhost:7878', apiKey: 'radarr-key' },
      adapter: {
        getCollections: async () => [
          {
            id: 42,
            title: 'Dune Collection',
            images: [
              { coverType: 'poster', remoteUrl: '/MediaCover/42/poster.jpg' },
            ],
          },
        ],
      } as any,
    })

    const res = await ServarrExtendedServ.getCollections('user-1')
    expect(res.success).toBe(true)
    const first = (res.data as any[])[0]
    expect(first.images[0].url).toBe(
      '/elysia/servarr/radarr/mediacover/42/poster.jpg'
    )
  })

  it('ServarrExtendedServ.runSeasonPass delegates to Sonarr v5 adapter', async () => {
    let capturedPayload: any = null
    getCtxSpy = spyOn(ServarrServ, 'getConnectionContext').mockResolvedValue({
      connected: true,
      provider: 'SONARR',
      hostUrl: 'http://localhost:8989',
      credentials: { hostUrl: 'http://localhost:8989', apiKey: 'sonarr-key' },
      adapter: {
        runSeasonPass: async (_creds: any, payload: any) => {
          capturedPayload = payload
          return { ok: true }
        },
      } as any,
    })

    const payload = {
      series: [{ id: 10 }],
      monitoringOptions: { monitor: 'future' },
    }
    const res = await ServarrExtendedServ.runSeasonPass('user-1', payload)
    expect(res.success).toBe(true)
    expect(capturedPayload).toEqual(payload)
  })

  it('ServarrRealtimeServ ignores notification/calendar topics and relays silent servarr:sync', async () => {
    const OriginalWebSocket = globalThis.WebSocket
    const OriginalFetch = globalThis.fetch
    const sentFrames: string[] = []
    let createdWs: any = null

    class MockWebSocket {
      onopen: (() => void) | null = null
      onmessage: ((evt: { data: string }) => void) | null = null
      onclose: (() => void) | null = null
      onerror: (() => void) | null = null
      readyState = 1
      constructor(_url: string) {
        createdWs = this
        queueMicrotask(() => {
          this.onopen?.()
        })
      }
      send(data: string) {
        sentFrames.push(data)
      }
      close() {
        this.readyState = 3
      }
    }

    ;(globalThis as any).WebSocket = MockWebSocket
    ;(globalThis as any).fetch = async () => ({
      ok: true,
      json: async () => ({ connectionToken: 'tok-1' }),
    })
    try {
      await ServarrRealtimeServ.ensureConnected('user-1', 'radarr', {
        hostUrl: 'http://localhost:7878',
        apiKey: 'radarr-key',
      })
      await new Promise((r) => setTimeout(r, 10))
      expect(createdWs).not.toBeNull()

      // Ignored SignalR topics must NOT emit servarr:sync
      createdWs.onmessage?.({
        data:
          JSON.stringify({
            type: 1,
            target: 'receiveMessage',
            arguments: [{ name: 'notification', body: { message: 'Ignored' } }],
          }) +
          '\x1e' +
          JSON.stringify({
            type: 1,
            target: 'receiveMessage',
            arguments: [{ name: 'calendar', body: {} }],
          }) +
          '\x1e',
      })

      const syncCallsBefore = sendToUserSpy.mock.calls.filter(
        (c) => c[1] === 'servarr:sync'
      )
      expect(syncCallsBefore.length).toBe(0)

      // Data topic emits silent servarr:sync
      createdWs.onmessage?.({
        data:
          JSON.stringify({
            type: 1,
            target: 'receiveMessage',
            arguments: [
              { name: 'movie', body: { action: 'updated', resource: { id: 7 } } },
            ],
          }) + '\x1e',
      })

      const syncCallsAfter = sendToUserSpy.mock.calls.filter(
        (c) => c[1] === 'servarr:sync'
      )
      expect(syncCallsAfter.length).toBe(1)
      expect(syncCallsAfter[0][0]).toBe('user-1')
      expect(syncCallsAfter[0][2]).toEqual({
        provider: 'RADARR',
        app: 'radarr',
        name: 'movie',
        action: 'updated',
        resource: { id: 7 },
      })
    } finally {
      ;(globalThis as any).WebSocket = OriginalWebSocket
      ;(globalThis as any).fetch = OriginalFetch
    }
  })
})
