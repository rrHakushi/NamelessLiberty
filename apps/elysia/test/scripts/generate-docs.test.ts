import { describe, it, expect } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { generateDocs } from '../../scripts/generate-docs'

describe('Docs Auto-Generator', () => {
  it('mirrors apps/elysia/src into Docs/apps/elysia/src with zero broken links and deterministic output', () => {
    const first = generateDocs()
    expect(first.modules).toBeGreaterThan(50)
    expect(first.indexes).toBeGreaterThan(5)
    expect(first.brokenLinks).toBe(0)

    const repoRoot = path.resolve(import.meta.dir, '../../../..')
    const sampleDoc = path.join(repoRoot, 'Docs/apps/elysia/src/apps/carina/auth/auth.ctrl.md')
    expect(fs.existsSync(sampleDoc)).toBe(true)

    const content = fs.readFileSync(sampleDoc, 'utf8')
    expect(content).toContain('## HTTP / WebSocket Routes')
    expect(content).toContain('[[apps/carina/auth/auth.serv]]')

    expect(first.irisPages).toBe(first.modules)

    const manifestPath = path.join(repoRoot, 'Docs/apps/elysia/iris-page/manifest.json')
    expect(fs.existsSync(manifestPath)).toBe(true)
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    expect(manifest.length).toBe(first.modules)

    const irisSamplePath = path.join(repoRoot, 'Docs/apps/elysia/iris-page/apps/carina/auth/auth.ctrl.json')
    expect(fs.existsSync(irisSamplePath)).toBe(true)
    const irisRaw = fs.readFileSync(irisSamplePath, 'utf8')
    const irisDoc = JSON.parse(irisRaw)
    expect(irisDoc.metadata.pathname).toBe('/carina/auth/login')
    expect(irisDoc.root.type).toBe('div')
    expect(irisRaw).toContain('Inputs & Outputs')
    expect(irisRaw).toContain('"type": "AlgoBuilder"')
    expect(irisRaw).toContain('Error List & Messages')
    expect(irisRaw).toContain('BadRequest')
    expect(irisRaw).toContain('Username must contain at least 3 characters')

    // Re-running should be idempotent (0 pruned, same counts)
    const second = generateDocs()
    expect(second.modules).toBe(first.modules)
    expect(second.indexes).toBe(first.indexes)
    expect(second.irisPages).toBe(first.irisPages)
    expect(second.pruned).toBe(0)
  })
})
