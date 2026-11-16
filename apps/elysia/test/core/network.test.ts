import { describe, it, expect } from 'bun:test'
import {
  isPrivateOrLoopbackIp,
  normalizeIpAddress,
  extractTrustedClientIp,
  assertSafeExternalUrl,
  validateReturnToUrl,
} from '../../src/core/utils/network'

describe('Core Network Security Helpers', () => {
  it('normalizes IPv4-mapped IPv6, brackets, ports, and zone IDs', () => {
    expect(normalizeIpAddress('[::1]:3000')).toBe('::1')
    expect(normalizeIpAddress('192.168.1.50:8080')).toBe('192.168.1.50')
    expect(normalizeIpAddress('::ffff:192.168.1.50')).toBe('192.168.1.50')
    expect(normalizeIpAddress('fe80::1%eth0')).toBe('fe80::1')
  })

  it('detects private, loopback, link-local, and CGNAT IPs', () => {
    expect(isPrivateOrLoopbackIp('127.0.0.1')).toBe(true)
    expect(isPrivateOrLoopbackIp('10.0.0.5')).toBe(true)
    expect(isPrivateOrLoopbackIp('172.16.0.1')).toBe(true)
    expect(isPrivateOrLoopbackIp('192.168.1.1')).toBe(true)
    expect(isPrivateOrLoopbackIp('169.254.169.254')).toBe(true)
    expect(isPrivateOrLoopbackIp('100.64.0.1')).toBe(true)
    expect(isPrivateOrLoopbackIp('::1')).toBe(true)
    expect(isPrivateOrLoopbackIp('8.8.8.8')).toBe(false)
  })

  it('ignores spoofed X-Forwarded-For unless remoteAddress is a trusted proxy', () => {
    const req = new Request('http://localhost/test', {
      headers: { 'x-forwarded-for': '127.0.0.1' },
    })

    // Public remoteAddress must not trust X-Forwarded-For
    expect(extractTrustedClientIp(req, '203.0.113.5')).toBe('203.0.113.5')
    // Loopback proxy remoteAddress trusts left-most X-Forwarded-For hop
    expect(extractTrustedClientIp(req, '127.0.0.1')).toBe('127.0.0.1')
  })

  it('rejects private/loopback/metadata URLs in assertSafeExternalUrl', async () => {
    await expect(assertSafeExternalUrl('http://127.0.0.1:8080/export')).rejects.toThrow()
    await expect(assertSafeExternalUrl('http://169.254.169.254/latest/meta-data')).rejects.toThrow()
    await expect(assertSafeExternalUrl('http://10.0.0.1/secret')).rejects.toThrow()
    await expect(assertSafeExternalUrl('http://localhost:3000/api')).rejects.toThrow()
    await expect(assertSafeExternalUrl('file:///etc/passwd')).rejects.toThrow()
    await expect(assertSafeExternalUrl('ftp://example.com/file')).rejects.toThrow()
  })

  it('validates returnTo URLs against open redirects', () => {
    const fallback = 'http://localhost:3000/connections'

    expect(validateReturnToUrl('/profile?tab=links', fallback).toString()).toBe(
      'http://localhost:3000/profile?tab=links'
    )
    expect(validateReturnToUrl('http://localhost:3000/settings', fallback).toString()).toBe(
      'http://localhost:3000/settings'
    )

    // Disallowed external / protocol-relative / javascript: targets fall back safely
    expect(validateReturnToUrl('https://evil.example/phish', fallback).toString()).toBe(fallback)
    expect(validateReturnToUrl('//evil.example/phish', fallback).toString()).toBe(fallback)
    expect(validateReturnToUrl('javascript:alert(1)', fallback).toString()).toBe(fallback)
  })
})
