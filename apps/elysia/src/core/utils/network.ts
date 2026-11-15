import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { BadRequest } from '../errors/http-errors'

/**
 * Checks whether an IPv4 or IPv6 address belongs to loopback, private, link-local,
 * carrier-grade NAT, or multicast ranges.
 */
export function isPrivateOrLoopbackIp(rawIp?: string | null): boolean {
  if (!rawIp) return false
  let ip = rawIp.trim().toLowerCase()
  if (!ip) return false

  // Step 1: Unwrap IPv4-mapped IPv6 addresses (e.g. ::ffff:127.0.0.1)
  if (ip.startsWith('::ffff:')) {
    ip = ip.slice(7)
  }

  // Step 2: Evaluate IPv4 private/reserved ranges
  if (isIP(ip) === 4) {
    const parts = ip.split('.').map(Number)
    if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
      return true
    }
    const [a, b] = parts as [number, number, number, number]
    if (a === 0 || a === 10 || a === 127) return true
    if (a === 169 && b === 254) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 100 && b >= 64 && b <= 127) return true
    if (a >= 224) return true
    return false
  }

  // Step 3: Evaluate IPv6 loopback, ULA, link-local, and multicast ranges
  if (isIP(ip) === 6) {
    if (ip === '::1' || ip === '::') return true
    if (ip.startsWith('fc') || ip.startsWith('fd')) return true
    if (ip.startsWith('fe8') || ip.startsWith('fe9') || ip.startsWith('fea') || ip.startsWith('feb')) {
      return true
    }
    if (ip.startsWith('ff')) return true
    return false
  }

  return false
}

/**
 * Normalizes raw IP strings by stripping brackets, port suffixes, and IPv4-mapped prefixes.
 */
export function normalizeIpAddress(raw?: string | null): string {
  if (!raw) return ''
  let ip = raw.trim()
  if (ip.startsWith('[')) {
    const endBracket = ip.indexOf(']')
    if (endBracket !== -1) ip = ip.slice(1, endBracket)
  } else if (ip.includes('.') && ip.includes(':')) {
    ip = ip.split(':')[0] || ip
  }
  const zoneIdx = ip.indexOf('%')
  if (zoneIdx !== -1) {
    ip = ip.slice(0, zoneIdx)
  }
  if (ip.toLowerCase().startsWith('::ffff:')) {
    ip = ip.slice(7)
  }
  return ip.trim()
}

/**
 * Extracts client IP from forwarded headers ONLY when the immediate peer is a trusted proxy
 * or `TRUST_PROXY=true` is explicitly configured.
 */
export function extractTrustedClientIp(request: Request, remoteAddress?: string | null): string {
  // Step 1: Normalize the direct socket peer address
  const peerIp = normalizeIpAddress(remoteAddress)
  const trustProxy =
    Bun.env.TRUST_PROXY === 'true' ||
    (peerIp.length > 0 && isPrivateOrLoopbackIp(peerIp))

  // Step 2: Only inspect proxy headers if the socket connection originates from a trusted proxy
  if (trustProxy) {
    const xff = request.headers.get('x-forwarded-for')
    if (xff) {
      const first = normalizeIpAddress(xff.split(',')[0])
      if (first && isIP(first) !== 0) return first
    }

    const cfIp = normalizeIpAddress(request.headers.get('cf-connecting-ip'))
    if (cfIp && isIP(cfIp) !== 0) return cfIp

    const realIp = normalizeIpAddress(request.headers.get('x-real-ip'))
    if (realIp && isIP(realIp) !== 0) return realIp
  }

  return peerIp || 'unknown'
}

/**
 * Validates that a target URL is a safe public HTTP(S) URL and does not resolve to
 * loopback, link-local, metadata, or private RFC1918/ULA addresses (SSRF protection).
 */
export async function assertSafeExternalUrl(rawUrl: string): Promise<URL> {
  // Step 1: Parse URL and enforce http/https protocol without embedded credentials
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    throw new BadRequest('Invalid remote URL provided')
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new BadRequest('Only HTTP and HTTPS remote URLs are permitted')
  }
  if (parsed.username || parsed.password) {
    throw new BadRequest('Embedded credentials in remote URLs are prohibited')
  }

  // Step 2: Block local/internal hostnames and literal private IP addresses
  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (
    !hostname ||
    hostname === 'localhost' ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.localhost')
  ) {
    throw new BadRequest('Access to local or internal network hosts is prohibited')
  }

  if (isIP(hostname) !== 0) {
    if (isPrivateOrLoopbackIp(hostname)) {
      throw new BadRequest('Access to private or loopback IP addresses is prohibited')
    }
    return parsed
  }

  // Step 3: Resolve DNS records and verify none point to private/internal networks (rebinding defense)
  let addresses: Array<{ address: string }>
  try {
    addresses = await lookup(hostname, { all: true })
  } catch {
    throw new BadRequest('Could not resolve remote hostname')
  }

  if (!addresses.length || addresses.some((entry) => isPrivateOrLoopbackIp(entry.address))) {
    throw new BadRequest('Remote hostname resolves to a restricted network address')
  }

  return parsed
}

/**
 * Validates a `returnTo` redirect target against relative paths or allowlisted application origins.
 * Prevents Open Redirect vulnerabilities on OAuth callbacks.
 */
export function validateReturnToUrl(
  rawReturnTo: string | null | undefined,
  fallbackUrl: string
): URL {
  // Step 1: Fall back when no returnTo value is supplied
  if (!rawReturnTo || !rawReturnTo.trim()) {
    return new URL(fallbackUrl)
  }

  const trimmed = rawReturnTo.trim()
  const baseOrigin = new URL(fallbackUrl).origin

  // Step 2: Allow safe same-site relative paths (e.g. "/settings?tab=connections"), reject "//evil.com"
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return new URL(trimmed, baseOrigin)
  }

  // Step 3: Parse absolute URLs and verify origin matches allowlisted origins
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return new URL(fallbackUrl)
    }

    const allowedOrigins = new Set<string>([baseOrigin])
    if (Bun.env.NEXT_PUBLIC_URL) {
      try {
        allowedOrigins.add(new URL(Bun.env.NEXT_PUBLIC_URL).origin)
      } catch {}
    }
    if (Bun.env.CORS_ORIGINS) {
      for (const origin of Bun.env.CORS_ORIGINS.split(',')) {
        const clean = origin.trim()
        if (clean) {
          try {
            allowedOrigins.add(new URL(clean).origin)
          } catch {}
        }
      }
    }
    if (Bun.env.NODE_ENV !== 'production') {
      allowedOrigins.add('http://localhost:3000')
      allowedOrigins.add('http://127.0.0.1:3000')
      allowedOrigins.add('http://localhost:4000')
      allowedOrigins.add('http://127.0.0.1:4000')
    }

    if (allowedOrigins.has(parsed.origin)) {
      return parsed
    }
  } catch {
    // Malformed URL falls back safely
  }

  return new URL(fallbackUrl)
}
