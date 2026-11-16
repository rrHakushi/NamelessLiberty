import fs from 'node:fs'
import path from 'node:path'
import type {
  AlgorithmStep,
  ExportedSymbol,
  ExtractedRoute,
  FileAnalysis,
  MethodDoc,
  ModelSchemaField,
} from './generate-docs'

export interface IrisNode {
  type: string
  key?: string | number
  props?: Record<string, any>
  children?: (IrisNode | string | number)[] | IrisNode | string | number | null
  text?: string
}

export interface IrisPageSchema {
  id: string
  title: string
  description: string
  icon: string
  metadata: {
    pathname: string
    relPath: string
    role: string
    methods: string[]
    routePaths: string[]
    errorCount: number
  }
  root: IrisNode
}

export interface IrisManifestEntry {
  slug: string
  title: string
  description: string
  role: string
  pathname: string
  relPath: string
  methods: string[]
  routePaths: string[]
  errorCount: number
}

export interface ErrorEntry {
  status: string
  errorName: string
  condition: string
  message: string
  source: string
  kind: 'Error' | 'Warning'
}

interface IrisDocsContext {
  byRel: Map<string, FileAnalysis>
  schemaByName: Map<string, ModelSchemaField>
  classByName: Map<string, FileAnalysis>
}

const STEP_BADGE_STYLES: Record<AlgorithmStep['kind'], { variant: string; className: string }> = {
  Sequence: { variant: 'secondary', className: 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-300' },
  If: { variant: 'outline', className: 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300' },
  Else: { variant: 'outline', className: 'border-sky-500/30 bg-sky-500/5 text-sky-700 dark:text-sky-300' },
  Loop: { variant: 'outline', className: 'border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300' },
  Switch: { variant: 'outline', className: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300' },
  Case: { variant: 'outline', className: 'border-indigo-500/30 bg-indigo-500/5 text-indigo-700 dark:text-indigo-300' },
  Try: { variant: 'outline', className: 'border-teal-500/40 bg-teal-500/10 text-teal-700 dark:text-teal-300' },
  Catch: { variant: 'outline', className: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300' },
  Warning: { variant: 'outline', className: 'border-amber-500/50 bg-amber-500/15 text-amber-700 dark:text-amber-300' },
  Error: { variant: 'destructive', className: 'bg-destructive/15 text-destructive border-destructive/40' },
  VarDef: { variant: 'outline', className: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300' },
  Return: { variant: 'outline', className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
}

const METHOD_BADGE_CLASS: Record<string, string> = {
  GET: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  POST: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
  PUT: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  PATCH: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30',
  DELETE: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
}

function buildContext(analyses: FileAnalysis[]): IrisDocsContext {
  const byRel = new Map<string, FileAnalysis>()
  const schemaByName = new Map<string, ModelSchemaField>()
  const classByName = new Map<string, FileAnalysis>()

  for (const a of analyses) {
    byRel.set(a.relPath, a)
    for (const s of a.modelSchemas) {
      schemaByName.set(s.schemaName, s)
    }
    for (const e of a.exports) {
      if (e.kind === 'class') {
        classByName.set(e.name, a)
      }
    }
  }

  return { byRel, schemaByName, classByName }
}

function resolveSchemaFields(
  schemaRef: string | undefined,
  file: FileAnalysis,
  ctx: IrisDocsContext
): ModelSchemaField | undefined {
  if (!schemaRef) return undefined
  const local = file.modelSchemas.find((s) => s.schemaName === schemaRef)
  if (local) return local

  for (const imp of file.imports) {
    if (!imp.targetRelPath) continue
    const target = ctx.byRel.get(imp.targetRelPath)
    if (!target) continue
    const match = target.modelSchemas.find((s) => s.schemaName === schemaRef)
    if (match) return match
  }

  return ctx.schemaByName.get(schemaRef)
}

function findCalledMethodAlgorithm(
  callName: string,
  file: FileAnalysis,
  ctx: IrisDocsContext
): { owner: string; method: MethodDoc } | undefined {
  const parts = callName.split('.')
  const methodName = parts.length > 1 ? parts[parts.length - 1] : callName
  const ownerHint = parts.length > 1 ? parts[0] : undefined

  for (const imp of file.imports) {
    if (!imp.targetRelPath) continue
    const target = ctx.byRel.get(imp.targetRelPath)
    if (!target) continue

    for (const exp of target.exports) {
      if (ownerHint && exp.name.toLowerCase() !== ownerHint.toLowerCase() && !imp.symbols.includes(exp.name)) {
        continue
      }
      const method = exp.methods?.find((m) => m.name === methodName)
      if (method && method.algorithm.length > 0) {
        return { owner: `${exp.name}.${method.name}`, method }
      }
    }
  }

  if (ownerHint) {
    const classFile = ctx.classByName.get(ownerHint)
    if (classFile) {
      for (const exp of classFile.exports) {
        const method = exp.methods?.find((m) => m.name === methodName)
        if (method && method.algorithm.length > 0) {
          return { owner: `${exp.name}.${method.name}`, method }
        }
      }
    }
  }

  return undefined
}

function parseErrorStep(step: AlgorithmStep, source: string, parentCondition?: string): ErrorEntry {
  // Expected title formats from generate-docs.ts extractThrowStep:
  // "Throws `BadRequest` (HTTP 400)" with step.detail = "\"Message\""
  // or "Throws `Error`" or Warning "Logs warning"
  let status = step.kind === 'Warning' ? 'WARN' : '500'
  let errorName = step.kind === 'Warning' ? 'Warning' : 'Error'
  let message = step.detail || step.title

  const throwsMatch = step.title.match(/^Throws\s+`([^`]+)`(?:\s+\(HTTP\s+(\d{3})\))?/)
  if (throwsMatch) {
    errorName = throwsMatch[1] ?? errorName
    if (throwsMatch[2]) status = throwsMatch[2]
    message = step.detail || errorName
  } else {
    const httpMatch = step.title.match(/^HTTP\s+(\d{3})\s+([A-Za-z0-9_]+):\s*(.*)$/)
    if (httpMatch) {
      status = httpMatch[1] ?? status
      errorName = httpMatch[2] ?? errorName
      message = httpMatch[3] ?? message
    }
  }

  const trimmedMessage = message.replace(/^["'`]|["'`]$/g, '').trim()
  const condition = parentCondition
    ? `${parentCondition} (step ${step.number})`
    : `Step ${step.number}`

  return {
    status,
    errorName,
    condition,
    message: trimmedMessage || step.title,
    source,
    kind: step.kind === 'Warning' ? 'Warning' : 'Error',
  }
}

function collectErrorsFromSteps(
  steps: AlgorithmStep[],
  source: string,
  out: ErrorEntry[],
  parentCondition?: string
) {
  for (const step of steps) {
    const nextCondition =
      step.kind === 'If' || step.kind === 'Else' || step.kind === 'Catch'
        ? step.title
        : parentCondition

    if (step.kind === 'Error' || step.kind === 'Warning') {
      out.push(parseErrorStep(step, source, parentCondition))
    }

    if (step.children.length > 0) {
      collectErrorsFromSteps(step.children, source, out, nextCondition)
    }
  }
}

function collectAllFileErrors(file: FileAnalysis, ctx: IrisDocsContext): ErrorEntry[] {
  const collected: ErrorEntry[] = []

  for (const route of file.routes) {
    const routeLabel = `${route.method} ${route.path}`
    collectErrorsFromSteps(route.algorithm, routeLabel, collected)
    for (const call of route.calls) {
      const called = findCalledMethodAlgorithm(call, file, ctx)
      if (called) {
        collectErrorsFromSteps(called.method.algorithm, called.owner, collected)
      }
    }
  }

  for (const exp of file.exports) {
    if (exp.algorithm && exp.algorithm.length > 0) {
      collectErrorsFromSteps(exp.algorithm, exp.name, collected)
    }
    for (const method of exp.methods ?? []) {
      collectErrorsFromSteps(method.algorithm, `${exp.name}.${method.name}`, collected)
    }
  }

  const seen = new Set<string>()
  return collected.filter((e) => {
    const key = `${e.status}|${e.errorName}|${e.message}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

interface AlgoNodeJson {
  id: string
  kind:
    | 'step'
    | 'sequence'
    | 'selection'
    | 'iteration'
    | 'warning'
    | 'error'
    | 'try_catch_finally'
    | 'var_def'
    | 'alg_call'
    | 'return'
  title?: string
  description?: string
  condition?: string
  selectionMode?: 'if_else' | 'switch'
  thenBranch?: AlgoNodeJson[]
  elseBranch?: AlgoNodeJson[]
  cases?: Array<{ id: string; label: string; children: AlgoNodeJson[] }>
  loopType?: 'for_each' | 'for' | 'while' | 'do_while'
  code?: string
  httpStatus?: number
  message?: string
  catchVar?: string
  tryBlock?: AlgoNodeJson[]
  catchBlock?: AlgoNodeJson[]
  variables?: Array<{
    id: string
    mutable?: boolean
    name: string
    type?: string
    value?: string
  }>
  returnValue?: string
  targetAlg?: string
  isAsync?: boolean
  payload?: string
  payloadLanguage?: string
  children?: AlgoNodeJson[]
}

function convertStepsToAlgoNodes(steps: AlgorithmStep[], idPrefix = 'n'): AlgoNodeJson[] {
  const result: AlgoNodeJson[] = []

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]!
    const id = `${idPrefix}_${i}_${step.number.replace(/\./g, '_')}`
    const payload = step.codeBlock?.code
    const payloadLanguage = step.codeBlock?.lang || 'typescript'

    if (step.kind === 'If') {
      const next = steps[i + 1]
      const hasElseSibling = next?.kind === 'Else'
      const desc = step.description ?? step.detail
      result.push({
        id,
        kind: 'selection',
        title: step.title,
        selectionMode: 'if_else',
        condition: step.title,
        ...(desc ? { description: desc } : {}),
        thenBranch: convertStepsToAlgoNodes(step.children, `${id}_then`),
        elseBranch: hasElseSibling ? convertStepsToAlgoNodes(next.children, `${id}_else`) : [],
        ...(payload ? { payload, payloadLanguage } : {}),
      })
      if (hasElseSibling) i++
      continue
    }

    if (step.kind === 'Switch') {
      const desc = step.description ?? step.detail
      result.push({
        id,
        kind: 'selection',
        title: step.title,
        selectionMode: 'switch',
        condition: step.title,
        ...(desc ? { description: desc } : {}),
        cases: step.children.map((c, cIdx) => ({
          id: `${id}_case_${cIdx}`,
          label: c.title,
          children: convertStepsToAlgoNodes(c.children, `${id}_c${cIdx}`),
        })),
      })
      continue
    }

    if (step.kind === 'Try') {
      const next = steps[i + 1]
      const hasCatchSibling = next?.kind === 'Catch'
      const catchMatch = next?.title.match(/\(`?([^)`]+)`?\)/)
      const desc = step.description ?? step.detail
      result.push({
        id,
        kind: 'try_catch_finally',
        title: step.title,
        ...(desc ? { description: desc } : {}),
        catchVar: catchMatch?.[1] || 'err',
        tryBlock: convertStepsToAlgoNodes(step.children, `${id}_try`),
        catchBlock: hasCatchSibling ? convertStepsToAlgoNodes(next.children, `${id}_catch`) : [],
        finallyBlock: [],
      } as AlgoNodeJson)
      if (hasCatchSibling) i++
      continue
    }

    if (step.kind === 'Loop') {
      const desc = step.description ?? step.detail
      result.push({
        id,
        kind: 'iteration',
        title: step.title,
        loopType: 'while',
        condition: step.title,
        ...(desc ? { description: desc } : {}),
        children: convertStepsToAlgoNodes(step.children, `${id}_loop`),
        ...(payload ? { payload, payloadLanguage } : {}),
      })
      continue
    }

    if (step.kind === 'Error' || step.kind === 'Warning') {
      const parsed = parseErrorStep(step, idPrefix)
      const numericStatus = Number(parsed.status)
      result.push({
        id,
        kind: step.kind === 'Warning' ? 'warning' : 'error',
        code: parsed.errorName,
        ...(step.kind === 'Error' && !Number.isNaN(numericStatus) ? { httpStatus: numericStatus } : {}),
        message: parsed.message,
        ...(step.description ? { description: step.description } : {}),
        ...(step.kind === 'Warning' && payload ? { payload, payloadLanguage } : {}),
      })
      continue
    }

    if (step.kind === 'VarDef') {
      const desc = step.description ?? step.detail
      result.push({
        id,
        kind: 'var_def',
        title: step.title,
        ...(desc ? { description: desc } : {}),
        ...(payload ? { payload, payloadLanguage } : {}),
      })
      continue
    }

    if (step.kind === 'Return') {
      result.push({
        id,
        kind: 'return',
        title: step.title,
        ...(step.description ? { description: step.description } : {}),
        ...(step.detail ? { returnValue: step.detail } : {}),
        ...(payload ? { payload, payloadLanguage } : {}),
      })
      continue
    }

    const hasChildren = step.children.length > 0
    const desc = step.description ?? step.detail
    result.push({
      id,
      kind: hasChildren ? 'sequence' : 'step',
      title: step.title,
      ...(desc ? { description: desc } : {}),
      ...(payload ? { payload, payloadLanguage } : {}),
      ...(hasChildren ? { children: convertStepsToAlgoNodes(step.children, `${id}_sub`) } : {}),
    })
  }

  return result
}

function buildSectionHeader(iconName: string, title: string, subtitle?: string): IrisNode {
  return {
    type: 'div',
    props: { className: 'flex items-center justify-between gap-2 mb-3 text-start' },
    children: [
      {
        type: 'div',
        props: { className: 'flex items-center gap-2' },
        children: [
          { type: iconName, props: { className: 'size-5 text-primary shrink-0' } },
          { type: 'h2', props: { className: 'text-lg font-semibold tracking-tight' }, text: title },
        ],
      },
      ...(subtitle
        ? [{ type: 'span', props: { className: 'text-xs text-muted-foreground font-mono' }, text: subtitle }]
        : []),
    ],
  }
}

function buildInputsOutputsSection(
  file: FileAnalysis,
  ctx: IrisDocsContext,
  omitIfEmpty = false
): IrisNode | null {
  const rows: Array<{ location: string; field: string; type: string; ref: string }> = []

  for (const route of file.routes) {
    const routePrefix = file.routes.length > 1 ? `${route.method} ${route.path} · ` : ''
    const specs: Array<{ label: string; ref?: string }> = [
      { label: `${routePrefix}Params`, ref: route.paramsRef },
      { label: `${routePrefix}Query`, ref: route.queryRef },
      { label: `${routePrefix}Body`, ref: route.bodyRef },
      ...route.responses.map((r) => ({
        label: `${routePrefix}Response ${r.status}`,
        ref: r.schemaRef,
      })),
    ]

    for (const spec of specs) {
      if (!spec.ref) continue
      const resolved = resolveSchemaFields(spec.ref, file, ctx)
      if (resolved && resolved.fields.length > 0) {
        for (const f of resolved.fields) {
          rows.push({
            location: spec.label,
            field: f.name,
            type: f.typeExpr,
            ref: resolved.schemaName,
          })
        }
      } else {
        rows.push({
          location: spec.label,
          field: '(schema)',
          type: spec.ref,
          ref: spec.ref,
        })
      }
    }
  }

  if (rows.length === 0 && file.modelSchemas.length > 0) {
    for (const schema of file.modelSchemas) {
      for (const f of schema.fields) {
        rows.push({
          location: schema.schemaName,
          field: f.name,
          type: f.typeExpr,
          ref: schema.schemaName,
        })
      }
    }
  }

  if (rows.length === 0) {
    for (const exp of file.exports) {
      for (const m of exp.methods ?? []) {
        rows.push({
          location: `${exp.name}.${m.name}`,
          field: m.params ? `(${m.params})` : '()',
          type: m.returnType ?? 'unknown',
          ref: exp.name,
        })
      }
    }
  }

  if (rows.length === 0) {
    if (omitIfEmpty) return null
    return {
      type: 'Card',
      props: { className: 'rounded-2xl' },
      children: [
        {
          type: 'CardContent',
          props: { className: 'pt-6' },
          children: [
            buildSectionHeader('IconArrowsLeftRight', 'Inputs & Outputs'),
            {
              type: 'p',
              props: { className: 'text-sm text-muted-foreground text-start' },
              text: 'No explicit request/response schemas or typed method signatures extracted for this module.',
            },
          ],
        },
      ],
    }
  }

  return {
    type: 'Card',
    props: { className: 'rounded-2xl' },
    children: [
      {
        type: 'CardContent',
        props: { className: 'pt-6' },
        children: [
          buildSectionHeader('IconArrowsLeftRight', 'Inputs & Outputs', `${rows.length} entries`),
          {
            type: 'Table',
            children: [
              {
                type: 'TableHeader',
                children: [
                  {
                    type: 'TableRow',
                    children: [
                      { type: 'TableHead', props: { className: 'text-start' }, text: 'Location / Scope' },
                      { type: 'TableHead', props: { className: 'text-start' }, text: 'Field / Params' },
                      { type: 'TableHead', props: { className: 'text-start' }, text: 'Type / Output' },
                    ],
                  },
                ],
              },
              {
                type: 'TableBody',
                children: rows.map((r, i) => ({
                  type: 'TableRow',
                  key: `io-${i}`,
                  children: [
                    {
                      type: 'TableCell',
                      props: { className: 'font-mono text-xs font-medium text-start' },
                      children: [
                        { type: 'Badge', props: { variant: 'outline', className: 'font-mono text-[11px]' }, text: r.location },
                      ],
                    },
                    {
                      type: 'TableCell',
                      props: { className: 'font-mono text-xs text-foreground text-start' },
                      text: r.field,
                    },
                    {
                      type: 'TableCell',
                      props: { className: 'font-mono text-xs text-muted-foreground text-start break-all' },
                      text: r.type,
                    },
                  ],
                })),
              },
            ],
          },
        ],
      },
    ],
  }
}

function buildSequenceSection(
  file: FileAnalysis,
  ctx: IrisDocsContext,
  omitIfEmpty = false
): IrisNode | null {
  const blocks: IrisNode[] = []

  for (const [rIdx, route] of file.routes.entries()) {
    const routeAlgoSteps = convertStepsToAlgoNodes(route.algorithm, `route_${rIdx}`)
    for (const call of route.calls) {
      const resolved = findCalledMethodAlgorithm(call, file, ctx)
      if (resolved) {
        routeAlgoSteps.push({
          id: `call_${rIdx}_${call.replace(/[^a-zA-Z0-9_]/g, '_')}`,
          kind: 'alg_call',
          title: `Invoke ${resolved.owner}`,
          isAsync: true,
          targetAlg: resolved.owner,
        })
        routeAlgoSteps.push({
          id: `svc_${rIdx}_${call.replace(/[^a-zA-Z0-9_]/g, '_')}`,
          kind: 'sequence',
          title: `${resolved.owner} Flow`,
          children: convertStepsToAlgoNodes(
            resolved.method.algorithm,
            `svc_${rIdx}_${call.replace(/[^a-zA-Z0-9_]/g, '_')}`
          ),
        })
      }
    }

    blocks.push({
      type: 'AlgoBuilder',
      key: `route-algo-${rIdx}`,
      props: {
        mode: 'render',
        allowModeToggle: true,
        defaultValue: {
          id: `${file.relPath}-route-${rIdx}`,
          title: `${route.method} ${route.path}`,
          description: route.summary || 'Route execution sequence',
          steps: routeAlgoSteps,
        },
      },
    })
  }

  for (const exp of file.exports) {
    if (exp.algorithm && exp.algorithm.length > 0) {
      blocks.push({
        type: 'AlgoBuilder',
        key: `exp-algo-${exp.name}`,
        props: {
          mode: 'render',
          allowModeToggle: true,
          defaultValue: {
            id: `${file.relPath}-${exp.name}`,
            title: `${exp.kind} ${exp.name}`,
            description: exp.doc || 'Exported algorithm sequence',
            steps: convertStepsToAlgoNodes(exp.algorithm, `exp_${exp.name}`),
          },
        },
      })
    }
    for (const m of exp.methods ?? []) {
      if (m.algorithm.length === 0) continue
      blocks.push({
        type: 'AlgoBuilder',
        key: `method-algo-${exp.name}-${m.name}`,
        props: {
          mode: 'render',
          allowModeToggle: true,
          defaultValue: {
            id: `${file.relPath}-${exp.name}-${m.name}`,
            title: `${exp.name}.${m.name}(${m.params})`,
            description: m.doc || 'Method execution sequence',
            steps: convertStepsToAlgoNodes(m.algorithm, `m_${exp.name}_${m.name}`),
          },
        },
      })
    }
  }

  if (blocks.length === 0) {
    if (omitIfEmpty) return null
    return {
      type: 'Card',
      props: { className: 'rounded-2xl' },
      children: [
        {
          type: 'CardContent',
          props: { className: 'pt-6 space-y-3' },
          children: [
            buildSectionHeader('IconListNumbers', 'Execution Sequence'),
            {
              type: 'p',
              props: { className: 'text-sm text-muted-foreground text-start' },
              text: 'Declarative / configuration module with no imperative execution sequence.',
            },
          ],
        },
      ],
    }
  }

  return {
    type: 'div',
    props: { className: 'space-y-4' },
    children: blocks,
  }
}

function buildErrorListSection(errors: ErrorEntry[], omitIfEmpty = false): IrisNode | null {
  if (errors.length === 0) {
    if (omitIfEmpty) return null
    return {
      type: 'Card',
      props: { className: 'rounded-2xl' },
      children: [
        {
          type: 'CardContent',
          props: { className: 'pt-6' },
          children: [
            buildSectionHeader('IconAlertCircle', 'Error List & Messages', '0 errors'),
            {
              type: 'Callout',
              props: { variant: 'info', title: 'No explicit error throws detected' },
              children: 'This module does not throw explicit HTTP or domain errors in its analyzed AST paths.',
            },
          ],
        },
      ],
    }
  }

  return {
    type: 'Card',
    props: { className: 'rounded-2xl' },
    children: [
      {
        type: 'CardContent',
        props: { className: 'pt-6 space-y-3' },
        children: [
          buildSectionHeader('IconAlertTriangle', 'Error List & Messages', `${errors.length} documented`),
          {
            type: 'Table',
            children: [
              {
                type: 'TableHeader',
                children: [
                  {
                    type: 'TableRow',
                    children: [
                      { type: 'TableHead', props: { className: 'text-start' }, text: 'Status' },
                      { type: 'TableHead', props: { className: 'text-start' }, text: 'Error' },
                      { type: 'TableHead', props: { className: 'text-start' }, text: 'Message' },
                    ],
                  },
                ],
              },
              {
                type: 'TableBody',
                children: errors.map((err, i) => ({
                  type: 'TableRow',
                  key: `err-${i}`,
                  children: [
                    {
                      type: 'TableCell',
                      props: { className: 'text-start' },
                      children: [
                        {
                          type: 'Badge',
                          props: {
                            variant: err.kind === 'Warning' ? 'outline' : 'destructive',
                            className: 'font-mono text-xs',
                          },
                          text: err.status,
                        },
                      ],
                    },
                    {
                      type: 'TableCell',
                      props: { className: 'font-mono text-xs font-semibold text-start' },
                      text: err.errorName,
                    },
                    {
                      type: 'TableCell',
                      props: { className: 'font-mono text-xs text-foreground text-start' },
                      text: err.message,
                    },
                  ],
                })),
              },
            ],
          },
        ],
      },
    ],
  }
}

export type DocPageType =
  | 'controller'
  | 'service'
  | 'worker'
  | 'queue'
  | 'utils'
  | 'types'
  | 'classes'
  | 'functions'
  | 'module'

const DOC_PAGE_TYPE_META: Record<DocPageType, { label: string; icon: string }> = {
  controller: { label: 'Controller', icon: 'IconRoute' },
  service: { label: 'Service', icon: 'IconCpu' },
  worker: { label: 'Worker', icon: 'IconSettingsAutomation' },
  queue: { label: 'Queue', icon: 'IconStack2' },
  utils: { label: 'Utils', icon: 'IconTools' },
  types: { label: 'Types', icon: 'IconBraces' },
  classes: { label: 'Class', icon: 'IconBox' },
  functions: { label: 'Functions', icon: 'IconFunction' },
  module: { label: 'Module', icon: 'IconFileCode' },
}

function detectDocPageType(file: FileAnalysis): DocPageType {
  if (file.routes.length > 0 || file.relPath.endsWith('.ctrl.ts') || file.relPath.endsWith('.controller.ts')) {
    return 'controller'
  }
  if (file.relPath.endsWith('.serv.ts')) return 'service'
  if (file.relPath.endsWith('.wrk.ts')) return 'worker'
  if (file.relPath.endsWith('.queue.ts')) return 'queue'
  if (file.relPath.includes('/utils/') || file.relPath.endsWith('.util.ts') || file.relPath.endsWith('.utils.ts')) {
    return 'utils'
  }
  const hasExports = file.exports.length > 0
  if (hasExports && file.exports.every((e) => e.kind === 'type' || e.kind === 'interface' || e.kind === 'enum')) {
    return 'types'
  }
  if (file.exports.some((e) => e.kind === 'class')) return 'classes'
  if (file.exports.some((e) => e.kind === 'function')) return 'functions'
  return 'module'
}

function buildTypesExportsSection(file: FileAnalysis): IrisNode | null {
  const typeExports = file.exports.filter((e) => e.kind === 'type' || e.kind === 'interface' || e.kind === 'enum')
  if (typeExports.length === 0) return null

  return {
    type: 'Card',
    props: { className: 'rounded-2xl' },
    children: [
      {
        type: 'CardContent',
        props: { className: 'pt-6' },
        children: [
          buildSectionHeader('IconBraces', 'Exported Types & Interfaces', `${typeExports.length} exported`),
          {
            type: 'Table',
            children: [
              {
                type: 'TableHeader',
                children: [
                  {
                    type: 'TableRow',
                    children: [
                      { type: 'TableHead', props: { className: 'text-start' }, text: 'Kind' },
                      { type: 'TableHead', props: { className: 'text-start' }, text: 'Name' },
                      { type: 'TableHead', props: { className: 'text-start' }, text: 'Description' },
                    ],
                  },
                ],
              },
              {
                type: 'TableBody',
                children: typeExports.map((e, i) => ({
                  type: 'TableRow',
                  key: `type-${i}`,
                  children: [
                    {
                      type: 'TableCell',
                      props: { className: 'font-mono text-xs text-start' },
                      children: [
                        { type: 'Badge', props: { variant: 'outline', className: 'font-mono text-[11px]' }, text: e.kind },
                      ],
                    },
                    {
                      type: 'TableCell',
                      props: { className: 'font-mono text-xs font-medium text-foreground text-start' },
                      text: e.name,
                    },
                    {
                      type: 'TableCell',
                      props: { className: 'text-xs text-muted-foreground text-start' },
                      text: e.doc || '—',
                    },
                  ],
                })),
              },
            ],
          },
        ],
      },
    ],
  }
}

function renderFileIrisPage(file: FileAnalysis, ctx: IrisDocsContext): IrisPageSchema {
  const pageType = detectDocPageType(file)
  const pageMeta = DOC_PAGE_TYPE_META[pageType]
  const primaryRoute = file.routes[0]
  const routePaths = file.routes.map((r) => r.path)
  const methods = Array.from(new Set(file.routes.map((r) => r.method)))
  const pathname = primaryRoute ? primaryRoute.path : `apps/elysia/src/${file.relPath}`

  const summaries = file.routes.map((r) => r.summary).filter(Boolean) as string[]
  const descriptions = file.routes.map((r) => r.description).filter(Boolean) as string[]
  const title =
    summaries[0] ||
    (primaryRoute ? `${primaryRoute.method} ${primaryRoute.path}` : path.posix.basename(file.relPath, '.ts'))
  const description = descriptions[0] || ''

  const errors = collectAllFileErrors(file, ctx)

  const pathnameBadges: IrisNode[] =
    file.routes.length > 0
      ? file.routes.map((r, i) => ({
          type: 'div',
          key: `path-badge-${i}`,
          props: { className: 'flex flex-wrap items-center gap-2' },
          children: [
            {
              type: 'Badge',
              props: {
                variant: 'outline',
                className: `font-mono text-xs ${METHOD_BADGE_CLASS[r.method] ?? ''}`,
              },
              text: r.method,
            },
            {
              type: 'code',
              props: { className: 'rounded-md bg-muted px-2.5 py-1 font-mono text-xs text-foreground' },
              text: r.path,
            },
          ],
        }))
      : [
          {
            type: 'code',
            props: { className: 'rounded-md bg-muted px-2.5 py-1 font-mono text-xs text-foreground' },
            text: `apps/elysia/src/${file.relPath}`,
          },
        ]

  const basicInfoCard: IrisNode = {
    type: 'Card',
    props: { className: 'rounded-2xl' },
    children: [
      {
        type: 'CardHeader',
        children: [
          {
            type: 'div',
            props: { className: 'flex items-center justify-between gap-2' },
            children: [
              {
                type: 'div',
                props: { className: 'flex items-center gap-2' },
                children: [
                  { type: pageMeta.icon, props: { className: 'size-5 text-primary shrink-0' } },
                  { type: 'CardTitle', props: { className: 'text-xl text-start' }, text: title },
                ],
              },
              {
                type: 'Badge',
                props: { variant: 'outline', className: 'font-mono text-xs' },
                text: pageMeta.label,
              },
            ],
          },
          ...(description
            ? [{ type: 'CardDescription', props: { className: 'text-start pt-1' }, text: description }]
            : []),
        ],
      },
      {
        type: 'CardContent',
        props: { className: 'space-y-4' },
        children: [
          {
            type: 'div',
            props: { className: 'space-y-2 text-start' },
            children: [
              {
                type: 'div',
                props: { className: 'text-xs font-semibold uppercase tracking-wider text-muted-foreground' },
                text: 'Pathname',
              },
              {
                type: 'div',
                props: { className: 'flex flex-col gap-2' },
                children: pathnameBadges,
              },
            ],
          },
          { type: 'Separator' },
          {
            type: 'div',
            props: { className: 'rounded-xl border border-border/60 bg-muted/20 p-3 text-start space-y-2' },
            children: [
              {
                type: 'div',
                props: { className: 'flex items-center justify-between gap-2' },
                children: [
                  { type: 'div', props: { className: 'text-[11px] text-muted-foreground' }, text: 'Dependents / Callers' },
                  {
                    type: 'div',
                    props: { className: 'font-mono text-[11px] text-muted-foreground' },
                    text: `${file.calledBy.length} caller(s)${file.extendedBy.length > 0 ? `, ${file.extendedBy.length} subclass(es)` : ''}`,
                  },
                ],
              },
              ...(file.calledBy.length > 0 || file.extendedBy.length > 0
                ? [
                    {
                      type: 'div',
                      props: { className: 'flex flex-wrap gap-1.5' },
                      children: [
                        ...file.calledBy
                          .filter((c) => !c.fromRelPath.includes('.model.'))
                          .map((c, idx) => ({
                            type: 'a',
                            key: `caller-${idx}`,
                            props: {
                              href: `/docs/${c.fromRelPath.replace(/\.tsx?$/, '')}`,
                              className:
                                'inline-flex items-center gap-1 rounded-md border border-border/70 bg-background/80 px-2 py-0.5 font-mono text-[11px] text-foreground transition-colors hover:border-primary/50 hover:text-primary',
                            },
                            text: c.symbols.length > 0 ? `${c.fromRelPath} (${c.symbols.join(', ')})` : c.fromRelPath,
                          })),
                        ...file.extendedBy
                          .filter((s) => !s.relPath.includes('.model.'))
                          .map((s, idx) => ({
                            type: 'a',
                            key: `sub-${idx}`,
                            props: {
                              href: `/docs/${s.relPath.replace(/\.tsx?$/, '')}`,
                              className:
                                'inline-flex items-center gap-1 rounded-md border border-sky-500/40 bg-sky-500/10 px-2 py-0.5 font-mono text-[11px] text-sky-700 dark:text-sky-300 transition-colors hover:opacity-80',
                            },
                            text: `${s.name} (${s.relPath})`,
                          })),
                      ],
                    } as IrisNode,
                  ]
                : [
                    {
                      type: 'div',
                      props: { className: 'font-mono text-xs text-muted-foreground' },
                      text: 'None',
                    } as IrisNode,
                  ]),
            ],
          },
        ],
      },
    ],
  }

  const isController = pageType === 'controller'
  const sections: IrisNode[] = [basicInfoCard]

  if (pageType === 'types') {
    const typesSection = buildTypesExportsSection(file)
    if (typesSection) sections.push(typesSection)
  } else {
    const ioSection = buildInputsOutputsSection(file, ctx, !isController)
    if (ioSection) sections.push(ioSection)

    const seqSection = buildSequenceSection(file, ctx, !isController)
    if (seqSection) sections.push(seqSection)

    const errSection = buildErrorListSection(errors, !isController)
    if (errSection) sections.push(errSection)
  }

  return {
    id: file.relPath.replace(/\.ts$/, ''),
    title,
    description,
    icon: pageMeta.icon,
    metadata: {
      pathname,
      relPath: file.relPath,
      role: pageMeta.label,
      methods,
      routePaths,
      errorCount: errors.length,
    },
    root: {
      type: 'div',
      props: { className: 'space-y-6' },
      children: sections,
    },
  }
}

function pruneStaleJsonDocs(outDir: string, expectedRelPaths: Set<string>): number {
  let pruned = 0
  if (!fs.existsSync(outDir)) return pruned

  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(full)
        if (fs.readdirSync(full).length === 0) fs.rmdirSync(full)
      } else if (entry.name.endsWith('.json')) {
        const rel = path.relative(outDir, full).replace(/\\/g, '/')
        if (!expectedRelPaths.has(rel)) {
          fs.unlinkSync(full)
          pruned++
        }
      }
    }
  }
  walk(outDir)
  return pruned
}

export function writeIrisDocs(analyses: FileAnalysis[], outDir: string): { count: number; pruned: number } {
  const ctx = buildContext(analyses)
  const expectedRelPaths = new Set<string>(['manifest.json'])
  const manifest: IrisManifestEntry[] = []

  fs.mkdirSync(outDir, { recursive: true })

  for (const file of analyses) {
    if (file.relPath.includes('.model.')) continue
    const schema = renderFileIrisPage(file, ctx)
    const jsonRelPath = file.relPath.replace(/\.ts$/, '.json')
    const outPath = path.join(outDir, jsonRelPath)
    fs.mkdirSync(path.dirname(outPath), { recursive: true })
    fs.writeFileSync(outPath, JSON.stringify(schema, null, 2) + '\n', 'utf8')
    expectedRelPaths.add(jsonRelPath)

    manifest.push({
      slug: file.relPath.replace(/\.ts$/, ''),
      title: schema.title,
      description: schema.description,
      role: file.role,
      pathname: schema.metadata.pathname,
      relPath: file.relPath,
      methods: schema.metadata.methods,
      routePaths: schema.metadata.routePaths,
      errorCount: schema.metadata.errorCount,
    })
  }

  manifest.sort((a, b) => a.slug.localeCompare(b.slug))
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8')

  const pruned = pruneStaleJsonDocs(outDir, expectedRelPaths)
  return { count: manifest.length, pruned }
}
