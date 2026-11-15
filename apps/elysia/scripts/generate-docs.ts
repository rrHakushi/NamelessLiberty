import fs from 'node:fs'
import path from 'node:path'
import { parse } from '@babel/parser'
import { writeIrisDocs } from './generate-iris-docs'

const ELYSIA_ROOT = path.resolve(import.meta.dir, '..')
const REPO_ROOT = path.resolve(ELYSIA_ROOT, '../..')
const SRC_DIR = path.join(ELYSIA_ROOT, 'src')
const DOCS_DIR = path.join(REPO_ROOT, 'Docs/apps/elysia/src')
const IRIS_DOCS_DIR = path.join(REPO_ROOT, 'Docs/apps/elysia/iris-page')

export interface AlgorithmStep {
  number: string
  kind: 'Sequence' | 'If' | 'Else' | 'Error' | 'Warning' | 'Loop' | 'Switch' | 'Case' | 'Try' | 'Catch' | 'Return' | 'VarDef'
  title: string
  description?: string
  detail?: string
  varDef?: { mutable: boolean; name: string; typeExpr?: string; value?: string }
  codeBlock?: { lang: string; code: string }
  children: AlgorithmStep[]
}

export interface MethodDoc {
  name: string
  params: string
  returnType?: string
  line: number
  doc?: string
  algorithm: AlgorithmStep[]
}

export interface ModelSchemaField {
  schemaName: string
  fields: Array<{ name: string; typeExpr: string }>
}

export interface ExportedSymbol {
  kind: 'class' | 'interface' | 'type' | 'enum' | 'function' | 'const'
  name: string
  extendsName?: string | null
  line: number
  doc?: string
  methods?: MethodDoc[]
  algorithm?: AlgorithmStep[]
}

export interface ExtractedRoute {
  method: string
  path: string
  summary?: string
  description?: string
  tags?: string[]
  queryRef?: string
  paramsRef?: string
  bodyRef?: string
  responses: Array<{ status: string; schemaRef: string }>
  calls: string[]
  algorithm: AlgorithmStep[]
  line: number
}

export interface FileAnalysis {
  relPath: string
  docRelPath: string
  role: string
  imports: Array<{ targetRelPath: string | null; specifier: string; symbols: string[] }>
  exports: ExportedSymbol[]
  routes: ExtractedRoute[]
  modelSchemas: ModelSchemaField[]
  calledBy: Array<{ fromRelPath: string; fromDocRelPath: string; symbols: string[] }>
  extendedBy: Array<{ name: string; relPath: string; docRelPath: string }>
}

const HTTP_ERROR_CODES: Record<string, number> = {
  BadRequest: 400,
  Unauthorized: 401,
  Forbidden: 403,
  NotFound: 404,
  Conflict: 409,
  TooManyRequests: 429,
  InternalServerError: 500,
}

function toPosix(p: string): string {
  return p.split(path.sep).join('/')
}

function walkSourceFiles(dir: string): string[] {
  const results: string[] = []
  if (!fs.existsSync(dir)) return results
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...walkSourceFiles(full))
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      results.push(full)
    }
  }
  return results
}

function detectRole(relPath: string): string {
  if (relPath.endsWith('.ctrl.ts') || relPath.endsWith('.controller.ts')) return 'Controller (HTTP / WS Routes)'
  if (relPath.endsWith('.serv.ts')) return 'Service (Business Logic)'
  if (relPath.endsWith('.model.ts')) return 'Model (TypeBox Schemas)'
  if (relPath.endsWith('.queue.ts')) return 'BullMQ Queue Manager'
  if (relPath.endsWith('.wrk.ts')) return 'BullMQ Background Worker'
  if (relPath.endsWith('.provider.ts')) return 'External Metadata Provider'
  if (relPath.endsWith('.syncer.ts')) return 'Media Syncer'
  if (relPath.endsWith('.tsx')) return 'Email Template (React Email)'
  if (relPath.startsWith('core/')) return 'Core Infrastructure'
  if (relPath === 'index.ts' || relPath === 'server.ts') return 'Application Entrypoint'
  return 'Module / Helper'
}

function resolveRelativeImport(fromRelPath: string, specifier: string, knownRelPaths: Set<string>): string | null {
  if (!specifier.startsWith('.')) return null
  const baseDir = path.posix.dirname(fromRelPath)
  const rawJoined = path.posix.normalize(path.posix.join(baseDir, specifier))
  const candidates = [
    rawJoined,
    `${rawJoined}.ts`,
    `${rawJoined}.tsx`,
    `${rawJoined}/index.ts`,
    `${rawJoined}/index.tsx`,
  ]
  for (const c of candidates) {
    if (knownRelPaths.has(c)) return c
  }
  return null
}

function cleanJsDoc(raw: string): string {
  return raw
    .replace(/^\/\*\*/, '')
    .replace(/\*\/$/, '')
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, '').trim())
    .filter(Boolean)
    .join(' ')
}

function findLeadingDoc(comments: any[], targetLine: number): string | undefined {
  for (let i = comments.length - 1; i >= 0; i--) {
    const c = comments[i]
    if (!c?.loc) continue
    if (c.loc.end.line === targetLine - 1 || c.loc.end.line === targetLine - 2) {
      if (c.type === 'CommentBlock' && typeof c.value === 'string' && c.value.startsWith('*')) {
        return cleanJsDoc(`/*${c.value}*/`)
      }
    }
  }
  return undefined
}

function sliceNodeSource(node: any, sourceLines: string[]): string {
  if (!node?.loc) return ''
  const startLine = node.loc.start.line - 1
  const endLine = node.loc.end.line - 1
  if (startLine === endLine) {
    return (sourceLines[startLine] ?? '').slice(node.loc.start.column, node.loc.end.column).trim()
  }
  const parts: string[] = []
  for (let i = startLine; i <= Math.min(endLine, startLine + 6); i++) {
    const line = sourceLines[i] ?? ''
    if (i === startLine) parts.push(line.slice(node.loc.start.column))
    else if (i === endLine) parts.push(line.slice(0, node.loc.end.column))
    else parts.push(line)
  }
  if (endLine > startLine + 6) parts.push('...')
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

function exprToText(node: any, sourceLines: string[]): string {
  if (!node) return ''
  if (node.type === 'Identifier') return node.name
  if (node.type === 'ThisExpression') return 'this'
  if (node.type === 'StringLiteral') return `'${node.value}'`
  if (node.type === 'NumericLiteral' || node.type === 'BooleanLiteral') return String(node.value)
  if (node.type === 'NullLiteral') return 'null'
  if (node.type === 'MemberExpression') {
    const obj = exprToText(node.object, sourceLines)
    const prop = node.computed ? `[${exprToText(node.property, sourceLines)}]` : `.${exprToText(node.property, sourceLines)}`
    return `${obj}${prop}`
  }
  if (node.type === 'AwaitExpression') return `await ${exprToText(node.argument, sourceLines)}`
  if (node.type === 'UnaryExpression') return `${node.operator}${exprToText(node.argument, sourceLines)}`
  if (node.type === 'LogicalExpression' || node.type === 'BinaryExpression') {
    return `${exprToText(node.left, sourceLines)} ${node.operator} ${exprToText(node.right, sourceLines)}`
  }
  if (node.type === 'AssignmentPattern') {
    return `${exprToText(node.left, sourceLines)} = ${exprToText(node.right, sourceLines)}`
  }
  if (node.type === 'CallExpression') {
    const callee = exprToText(node.callee, sourceLines)
    const args = (node.arguments ?? []).slice(0, 3).map((a: any) => exprToText(a, sourceLines)).join(', ')
    const ellipsis = (node.arguments?.length ?? 0) > 3 ? ', ...' : ''
    return `${callee}(${args}${ellipsis})`
  }
  return sliceNodeSource(node, sourceLines)
}

function getPropKeyName(prop: any): string {
  if (!prop?.key) return ''
  if (prop.key.type === 'Identifier') return prop.key.name
  if (prop.key.type === 'StringLiteral' || prop.key.type === 'NumericLiteral') return String(prop.key.value)
  return ''
}

function extractStringProp(obj: any, keyName: string): string | undefined {
  if (!obj?.properties) return undefined
  for (const prop of obj.properties) {
    if (prop.type === 'ObjectProperty' && !prop.computed && getPropKeyName(prop) === keyName) {
      if (prop.value?.type === 'StringLiteral') return prop.value.value
    }
  }
  return undefined
}

function extractThrowStep(throwNode: any, sourceLines: string[]): Omit<AlgorithmStep, 'number'> {
  const arg = throwNode.argument
  if (arg?.type === 'NewExpression') {
    const errClass = exprToText(arg.callee, sourceLines)
    const status = HTTP_ERROR_CODES[errClass]
    const msgArg = arg.arguments?.[0]
    const msgText = msgArg ? exprToText(msgArg, sourceLines) : ''
    const statusBadge = status ? ` (HTTP ${status})` : ''
    return {
      kind: 'Error',
      title: `Throws \`${errClass}\`${statusBadge}`,
      detail: msgText ? `${msgText}` : undefined,
      children: [],
    }
  }
  return {
    kind: 'Error',
    title: `Throws \`${exprToText(arg, sourceLines)}\``,
    children: [],
  }
}

function findInlineCommentAbove(comments: any[], line: number): string | undefined {
  for (let i = comments.length - 1; i >= 0; i--) {
    const c = comments[i]
    if (
      c.type === 'CommentBlock' &&
      String(c.value ?? '').startsWith('*') &&
      c.loc?.end?.line === line - 1
    ) {
      const cleaned = cleanJsDoc(String(c.value ?? ''))
      if (cleaned) {
        return cleaned.replace(/^Step\s+\d+(?:\.\d+)?[:.\s]+/i, '').replace(/^\d+\.\s+/, '')
      }
    }
  }
  return undefined
}

function describeExpressionCall(
  expr: any,
  sourceLines: string[],
  targetVar?: string,
  commentHint?: string
): Omit<AlgorithmStep, 'number'> | null {
  const raw = exprToText(expr, sourceLines)

  // Warnings
  if (/(?:logger|console)\.warn\b/.test(raw)) {
    const args = expr?.type === 'CallExpression' ? expr.arguments.map((a: any) => exprToText(a, sourceLines)).join(', ') : raw
    return {
      kind: 'Warning',
      title: 'Logs warning',
      detail: args,
      children: [],
    }
  }

  // Skip noisy boilerplate calls (super, logger.info/debug, array.push) unless explicitly commented
  if (!commentHint && /^(?:super|logger\.(?:info|debug)|console\.log)\b/.test(raw)) {
    return null
  }
  if (!commentHint && /\.push\(/.test(raw)) {
    return null
  }

  const unwrapped = expr?.type === 'AwaitExpression' ? expr.argument : expr

  // Prisma ORM queries
  if (raw.includes('prisma.orm.')) {
    const modelMatch = raw.match(/prisma\.orm\.[a-zA-Z0-9_]+\.([A-Za-z0-9_]+)/)
    const opMatch = raw.match(/\.(first|all|create|update|updateAll|delete|deleteAll|upsert|count)\(/)
    const model = modelMatch?.[1] ?? 'Record'
    const op = opMatch?.[1] ?? 'query'
    const storeText = targetVar ? ` and stores it as \`${targetVar}\`` : ''
    return {
      kind: 'Sequence',
      title: `Database \`${op}\` on \`${model}\`${storeText}`,
      children: [],
    }
  }

  // Cache operations
  if (/(?:this\.)?cache\.(get|set|del)\b/.test(raw)) {
    const opMatch = raw.match(/cache\.(get|set|del)/)
    const op = opMatch?.[1] ?? 'access'
    const storeText = targetVar ? ` -> \`${targetVar}\`` : ''
    return {
      kind: 'Sequence',
      title: `Cache \`${op}\`${storeText}`,
      children: [],
    }
  }

  // Meaningful service / crypto / IO / queue / email calls
  if (unwrapped?.type === 'CallExpression') {
    const callee = exprToText(unwrapped.callee, sourceLines)
    const isTrivialTransform = /\.(?:trim|toLowerCase|toUpperCase|replace|split|slice|join|map|filter|includes|startsWith|endsWith|toString)\b/.test(callee)
    if (isTrivialTransform && !commentHint) {
      return null
    }
    const storeText = targetVar ? ` and stores result as \`${targetVar}\`` : ''
    return {
      kind: 'Sequence',
      title: `Calls \`${callee}\`${storeText}`,
      children: [],
    }
  }

  // Skip trivial local variable assignments (VariableDeclaration emits VarDef with commentHint)
  if (!commentHint || targetVar) {
    return null
  }

  return {
    kind: 'Sequence',
    title: commentHint,
    children: [],
  }
}

function buildStepsFromBlock(
  stmts: any[],
  sourceLines: string[],
  comments: any[],
  prefix: string
): AlgorithmStep[] {
  const result: AlgorithmStep[] = []
  let idx = 1

  const nextNum = () => (prefix ? `${prefix}.${idx++}` : `${idx++}`)

  for (const stmt of stmts ?? []) {
    if (!stmt) continue
    const line = stmt.loc?.start?.line ?? 0
    const commentHint = line ? findInlineCommentAbove(comments, line) : undefined

    if (stmt.type === 'ThrowStatement') {
      const num = nextNum()
      const errStep = extractThrowStep(stmt, sourceLines)
      result.push({
        number: num,
        ...errStep,
        detail: commentHint ? `${commentHint} — ${errStep.detail ?? ''}` : errStep.detail,
      })
      continue
    }

function astValueToSampleJson(node: any, sourceLines: string[], depth = 0): unknown {
  if (!node || depth > 3) return '...'
  if (node.type === 'BooleanLiteral' || node.type === 'NumericLiteral' || node.type === 'StringLiteral') {
    return node.value
  }
  if (node.type === 'NullLiteral') return null
  if (node.type === 'ArrayExpression') {
    const first = node.elements?.[0]
    return first ? [astValueToSampleJson(first, sourceLines, depth + 1)] : []
  }
  if (node.type === 'ObjectExpression') {
    return objectExprToSampleJson(node, sourceLines, depth + 1)
  }
  const text = exprToText(node, sourceLines).replace(/\s+/g, ' ').trim()
  return text ? `<${text}>` : '...'
}

function objectExprToSampleJson(objNode: any, sourceLines: string[], depth = 0): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const prop of objNode?.properties ?? []) {
    if (prop.type === 'SpreadElement') {
      const spreadExpr = exprToText(prop.argument, sourceLines).replace(/\s+/g, ' ').trim()
      out[`...${spreadExpr || 'spread'}`] = '...'
      continue
    }
    const key = getPropKeyName(prop)
    if (!key) continue
    const valNode = prop.type === 'ObjectMethod' ? null : prop.value
    out[key] = prop.shorthand ? `<${key}>` : astValueToSampleJson(valNode, sourceLines, depth)
  }
  return out
}

    if (stmt.type === 'ReturnStatement') {
      const num = nextNum()
      if (stmt.argument?.type === 'ObjectExpression') {
        const sample = objectExprToSampleJson(stmt.argument, sourceLines)
        result.push({
          number: num,
          kind: 'Return',
          title: '',
          ...(commentHint ? { description: commentHint } : {}),
          codeBlock: {
            lang: 'json',
            code: JSON.stringify(sample, null, 2),
          },
          children: [],
        })
      } else {
        result.push({
          number: num,
          kind: 'Return',
          title: '',
          ...(commentHint ? { description: commentHint } : {}),
          detail: stmt.argument ? `\`${exprToText(stmt.argument, sourceLines)}\`` : '`void`',
          children: [],
        })
      }
      continue
    }

    if (stmt.type === 'VariableDeclaration') {
      const isMutable = stmt.kind === 'let' || stmt.kind === 'var'
      for (const decl of stmt.declarations ?? []) {
        const rawName = decl.id?.type === 'Identifier' ? decl.id.name : exprToText(decl.id, sourceLines)
        const typeNode = decl.id?.typeAnnotation?.typeAnnotation
        const typeExpr = typeNode ? exprToText(typeNode, sourceLines) : undefined
        const initText = decl.init ? exprToText(decl.init, sourceLines) : undefined

        if (decl.init) {
          const step = describeExpressionCall(decl.init, sourceLines, rawName, commentHint)
          if (step) {
            const num = nextNum()
            result.push({
              number: num,
              ...step,
              ...(commentHint ? { description: commentHint } : {}),
            })
            continue
          }
        }

        const kw = stmt.kind === 'var' ? 'var' : isMutable ? 'let' : 'const'
        const typePart = typeExpr ? `: ${typeExpr}` : ''
        const initPart = initText !== undefined ? ` = ${initText}` : ''
        const codeLine = `${kw} ${rawName}${typePart}${initPart}`

        const prev = result[result.length - 1]
        if (!commentHint && prev?.kind === 'VarDef' && !prev.description && prev.codeBlock) {
          prev.codeBlock.code = `${prev.codeBlock.code}\n${codeLine}`
          prev.title = `${prev.title}, \`${rawName}\``
          continue
        }

        const num = nextNum()
        result.push({
          number: num,
          kind: 'VarDef',
          title: `Define \`${rawName}\``,
          ...(commentHint ? { description: commentHint } : {}),
          codeBlock: {
            lang: 'typescript',
            code: codeLine,
          },
          varDef: {
            mutable: isMutable,
            name: rawName,
            ...(typeExpr ? { typeExpr } : {}),
            ...(initText ? { value: initText } : {}),
          },
          children: [],
        })
      }
      continue
    }

    if (stmt.type === 'ExpressionStatement') {
      if (stmt.expression?.type === 'AssignmentExpression') {
        const left = exprToText(stmt.expression.left, sourceLines)
        const fullCode = exprToText(stmt.expression, sourceLines)
        const num = nextNum()
        result.push({
          number: num,
          kind: 'Sequence',
          title: `Assign \`${left}\``,
          ...(commentHint ? { description: commentHint } : {}),
          codeBlock: {
            lang: 'typescript',
            code: fullCode,
          },
          children: [],
        })
        continue
      }

      const step = describeExpressionCall(stmt.expression, sourceLines, undefined, commentHint)
      if (step) {
        const num = nextNum()
        result.push({
          number: num,
          ...step,
          ...(commentHint ? { description: commentHint } : {}),
        })
      }
      continue
    }

    if (stmt.type === 'IfStatement') {
      const cond = exprToText(stmt.test, sourceLines)
      const thenStmts = stmt.consequent?.type === 'BlockStatement' ? stmt.consequent.body : [stmt.consequent]
      const num = nextNum()

      // Single throw inside if -> clean If -> Error block just like uuCmd docs
      if (thenStmts.length === 1 && thenStmts[0]?.type === 'ThrowStatement') {
        const errStep = extractThrowStep(thenStmts[0], sourceLines)
        result.push({
          number: num,
          kind: 'If',
          title: `\`${cond}\``,
          ...(commentHint ? { description: commentHint } : {}),
          children: [{ number: `${num}.1`, ...errStep }],
        })
      } else {
        result.push({
          number: num,
          kind: 'If',
          title: `\`${cond}\``,
          ...(commentHint ? { description: commentHint } : {}),
          children: buildStepsFromBlock(thenStmts, sourceLines, comments, num),
        })
      }

      if (stmt.alternate) {
        const elseNum = nextNum()
        const elseStmts =
          stmt.alternate.type === 'BlockStatement'
            ? stmt.alternate.body
            : [stmt.alternate]
        result.push({
          number: elseNum,
          kind: 'Else',
          title: 'Otherwise',
          children: buildStepsFromBlock(elseStmts, sourceLines, comments, elseNum),
        })
      }
      continue
    }

    if (stmt.type === 'ForOfStatement' || stmt.type === 'ForInStatement' || stmt.type === 'ForStatement' || stmt.type === 'WhileStatement') {
      const num = nextNum()
      const header =
        stmt.type === 'ForOfStatement' || stmt.type === 'ForInStatement'
          ? `Iterate \`${exprToText(stmt.left, sourceLines)}\` over \`${exprToText(stmt.right, sourceLines)}\``
          : stmt.type === 'WhileStatement'
            ? `While \`${exprToText(stmt.test, sourceLines)}\``
            : `Loop \`${exprToText(stmt.test, sourceLines) || 'range'}\``
      const bodyStmts = stmt.body?.type === 'BlockStatement' ? stmt.body.body : [stmt.body]
      result.push({
        number: num,
        kind: 'Loop',
        title: header,
        ...(commentHint ? { description: commentHint } : {}),
        children: buildStepsFromBlock(bodyStmts, sourceLines, comments, num),
      })
      continue
    }

    if (stmt.type === 'SwitchStatement') {
      const num = nextNum()
      const disc = exprToText(stmt.discriminant, sourceLines)
      const caseChildren: AlgorithmStep[] = []
      let caseIdx = 1
      for (const c of stmt.cases ?? []) {
        const cNum = `${num}.${caseIdx++}`
        const label = c.test ? `Case \`${exprToText(c.test, sourceLines)}\`` : 'Default'
        const cStmts = (c.consequent ?? []).filter((s: any) => s.type !== 'BreakStatement')
        caseChildren.push({
          number: cNum,
          kind: 'Case',
          title: label,
          children: buildStepsFromBlock(cStmts, sourceLines, comments, cNum),
        })
      }
      result.push({
        number: num,
        kind: 'Switch',
        title: `Branch on \`${disc}\``,
        ...(commentHint ? { description: commentHint } : {}),
        children: caseChildren,
      })
      continue
    }

    if (stmt.type === 'TryStatement') {
      const tryNum = nextNum()
      result.push({
        number: tryNum,
        kind: 'Try',
        title: 'Try block',
        ...(commentHint ? { description: commentHint } : {}),
        children: buildStepsFromBlock(stmt.block?.body ?? [], sourceLines, comments, tryNum),
      })
      if (stmt.handler) {
        const catchNum = nextNum()
        const param = stmt.handler.param ? exprToText(stmt.handler.param, sourceLines) : 'err'
        result.push({
          number: catchNum,
          kind: 'Catch',
          title: `Catch (\`${param}\`)`,
          children: buildStepsFromBlock(stmt.handler.body?.body ?? [], sourceLines, comments, catchNum),
        })
      }
      continue
    }
  }

  return result
}

function extractBodySteps(fnNode: any, sourceLines: string[], comments: any[]): AlgorithmStep[] {
  if (!fnNode?.body) return []
  if (fnNode.body.type === 'BlockStatement') {
    return buildStepsFromBlock(fnNode.body.body, sourceLines, comments, '')
  }
  return [
    {
      number: '1',
      kind: 'Return',
      title: 'Returns expression',
      detail: `\`${exprToText(fnNode.body, sourceLines)}\``,
      children: [],
    },
  ]
}

function extractRoutesFromAst(program: any, sourceLines: string[], comments: any[]): ExtractedRoute[] {
  const routes: ExtractedRoute[] = []
  const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'ws'])

  function walkNode(node: any, currentPrefix: string) {
    if (!node || typeof node !== 'object') return

    if (node.type === 'CallExpression' && node.callee?.type === 'MemberExpression') {
      const prop = node.callee.property
      const methodName = prop?.type === 'Identifier' ? prop.name.toLowerCase() : ''

      walkNode(node.callee.object, currentPrefix)

      if (HTTP_METHODS.has(methodName) && Array.isArray(node.arguments) && node.arguments.length >= 2) {
        const pathArg = node.arguments[0]
        const routePath =
          pathArg?.type === 'StringLiteral' ? pathArg.value : exprToText(pathArg, sourceLines)

        const secondArg = node.arguments[1]
        const thirdArg = node.arguments[2]
        let summary: string | undefined
        let description: string | undefined
        let tags: string[] | undefined
        let queryRef: string | undefined
        let paramsRef: string | undefined
        let bodyRef: string | undefined
        const responses: Array<{ status: string; schemaRef: string }> = []

        const optsNode =
          secondArg?.type === 'ObjectExpression'
            ? secondArg
            : thirdArg?.type === 'ObjectExpression'
              ? thirdArg
              : null

        if (optsNode) {
          for (const p of optsNode.properties ?? []) {
            if (p.type !== 'ObjectProperty' || p.computed) continue
            const k = getPropKeyName(p)
            if (k === 'query') queryRef = exprToText(p.value, sourceLines)
            else if (k === 'params') paramsRef = exprToText(p.value, sourceLines)
            else if (k === 'body') bodyRef = exprToText(p.value, sourceLines)
            else if (k === 'detail' && p.value?.type === 'ObjectExpression') {
              summary = extractStringProp(p.value, 'summary')
              description = extractStringProp(p.value, 'description')
              for (const dp of p.value.properties ?? []) {
                if (dp.type === 'ObjectProperty' && getPropKeyName(dp) === 'tags' && dp.value?.type === 'ArrayExpression') {
                  tags = (dp.value.elements ?? [])
                    .filter((e: any) => e?.type === 'StringLiteral')
                    .map((e: any) => String(e.value))
                }
              }
            } else if (k === 'response' && p.value?.type === 'ObjectExpression') {
              for (const rp of p.value.properties ?? []) {
                if (rp.type === 'ObjectProperty') {
                  const status = getPropKeyName(rp)
                  if (status) {
                    responses.push({ status, schemaRef: exprToText(rp.value, sourceLines) })
                  }
                }
              }
            }
          }
        }

        const calls = new Set<string>()
        const handlerNode =
          secondArg?.type === 'ArrowFunctionExpression' || secondArg?.type === 'FunctionExpression'
            ? secondArg
            : thirdArg?.type === 'ArrowFunctionExpression' || thirdArg?.type === 'FunctionExpression'
              ? thirdArg
              : null

        if (handlerNode) {
          const walkHandler = (n: any) => {
            if (!n || typeof n !== 'object') return
            if (n.type === 'CallExpression' && n.callee?.type === 'MemberExpression') {
              const txt = exprToText(n.callee, sourceLines)
              if (/Serv\.|Service\.|QueueManager\./.test(txt)) {
                calls.add(txt)
              }
            }
            for (const key of Object.keys(n)) {
              if (key === 'loc' || key === 'start' || key === 'end' || key === 'extra') continue
              const val = n[key]
              if (Array.isArray(val)) val.forEach((v) => v && typeof v.type === 'string' && walkHandler(v))
              else if (val && typeof val.type === 'string') walkHandler(val)
            }
          }
          walkHandler(handlerNode)
        }

        const algorithm: AlgorithmStep[] = []
        const schemaInputs = [paramsRef && `params: \`${paramsRef}\``, queryRef && `query: \`${queryRef}\``, bodyRef && `body: \`${bodyRef}\``].filter(Boolean)
        if (schemaInputs.length > 0) {
          algorithm.push({
            number: '1',
            kind: 'Sequence',
            title: 'Validates request input (TypeBox)',
            detail: schemaInputs.join(', '),
            children: [],
          })
        }
        const handlerSteps = handlerNode ? extractBodySteps(handlerNode, sourceLines, comments) : []
        const offset = algorithm.length
        for (const hs of handlerSteps) {
          const renumber = (s: AlgorithmStep, baseNum: string): AlgorithmStep => ({
            ...s,
            number: baseNum,
            children: s.children.map((c, ci) => renumber(c, `${baseNum}.${ci + 1}`)),
          })
          const topNum = String(Number(hs.number) + offset)
          algorithm.push(renumber(hs, topNum))
        }

        const fullPath = currentPrefix ? `${currentPrefix}${routePath}` : routePath
        routes.push({
          method: methodName.toUpperCase(),
          path: fullPath || '/',
          summary,
          description,
          tags,
          queryRef,
          paramsRef,
          bodyRef,
          responses,
          calls: Array.from(calls),
          algorithm,
          line: node.loc?.start?.line ?? 1,
        })
      }
      return
    }

    if (
      node.type === 'NewExpression' &&
      node.callee?.type === 'Identifier' &&
      node.callee.name === 'Elysia' &&
      node.arguments?.[0]?.type === 'ObjectExpression'
    ) {
      const p = extractStringProp(node.arguments[0], 'prefix')
      if (p) currentPrefix = p
    }

    for (const key of Object.keys(node)) {
      if (key === 'loc' || key === 'start' || key === 'end' || key === 'extra') continue
      const val = node[key]
      if (Array.isArray(val)) val.forEach((v) => v && typeof v.type === 'string' && walkNode(v, currentPrefix))
      else if (val && typeof val.type === 'string') walkNode(val, currentPrefix)
    }
  }

  for (const stmt of program.body ?? []) {
    let prefix = ''
    if (stmt.type === 'ExportNamedDeclaration' && stmt.declaration?.type === 'VariableDeclaration') {
      for (const decl of stmt.declaration.declarations ?? []) {
        if (decl.init?.loc) {
          const initText = sourceLines
            .slice(decl.init.loc.start.line - 1, Math.min(decl.init.loc.start.line + 2, sourceLines.length))
            .join(' ')
          const m = initText.match(/new\s+Elysia\s*\(\s*\{\s*prefix:\s*['"`]([^'"`]+)['"`]/)
          if (m?.[1]) prefix = m[1]
        }
      }
    }
    walkNode(stmt, prefix)
  }

  return routes
}

function extractModelSchemas(program: any, sourceLines: string[]): ModelSchemaField[] {
  const schemas: ModelSchemaField[] = []

  const extractFieldsFromTObject = (callNode: any): Array<{ name: string; typeExpr: string }> => {
    const objArg = callNode?.arguments?.[0]
    if (objArg?.type !== 'ObjectExpression') return []
    const fields: Array<{ name: string; typeExpr: string }> = []
    for (const prop of objArg.properties ?? []) {
      if (prop.type === 'ObjectProperty') {
        const name = getPropKeyName(prop)
        if (name) {
          fields.push({ name, typeExpr: sliceNodeSource(prop.value, sourceLines) })
        }
      }
    }
    return fields
  }

  for (const stmt of program.body ?? []) {
    if (stmt.type === 'ExportNamedDeclaration' && stmt.declaration?.type === 'VariableDeclaration') {
      for (const decl of stmt.declaration.declarations ?? []) {
        const varName = decl.id?.type === 'Identifier' ? decl.id.name : ''
        if (!varName || !decl.init) continue
        if (decl.init.type === 'CallExpression' && exprToText(decl.init.callee, sourceLines) === 't.Object') {
          schemas.push({ schemaName: varName, fields: extractFieldsFromTObject(decl.init) })
        } else if (decl.init.type === 'ObjectExpression') {
          for (const prop of decl.init.properties ?? []) {
            if (prop.type === 'ObjectProperty' && prop.value?.type === 'CallExpression' && exprToText(prop.value.callee, sourceLines) === 't.Object') {
              schemas.push({
                schemaName: `${varName}.${getPropKeyName(prop)}`,
                fields: extractFieldsFromTObject(prop.value),
              })
            }
          }
        }
      }
    }
  }

  return schemas
}

function analyzeFile(fullPath: string, knownRelPaths: Set<string>): FileAnalysis {
  const relPath = toPosix(path.relative(SRC_DIR, fullPath))
  const docRelPath = relPath.replace(/\.(ts|tsx)$/, '.md')
  const content = fs.readFileSync(fullPath, 'utf8')
  const sourceLines = content.split(/\r?\n/)
  const isTsx = fullPath.endsWith('.tsx')

  const ast = parse(content, {
    sourceType: 'module',
    plugins: isTsx ? ['typescript', 'jsx'] : ['typescript'],
    errorRecovery: true,
  })

  const comments: any[] = (ast as any).comments ?? []
  const imports: FileAnalysis['imports'] = []
  const exports: ExportedSymbol[] = []

  for (const stmt of ast.program.body) {
    if (stmt.type === 'ImportDeclaration' && typeof stmt.source.value === 'string') {
      const spec = stmt.source.value
      const targetRelPath = resolveRelativeImport(relPath, spec, knownRelPaths)
      const symbols = stmt.specifiers.map((s) => s.local.name)
      imports.push({ targetRelPath, specifier: spec, symbols })
    }
  }

  const collectDecl = (decl: any, exportLine: number) => {
    if (!decl) return
    if (decl.type === 'ClassDeclaration' && decl.id) {
      const extendsName = decl.superClass ? exprToText(decl.superClass, sourceLines) : null
      const methods: MethodDoc[] = []
      for (const member of decl.body?.body ?? []) {
        if (member.type === 'ClassMethod' && member.key?.type === 'Identifier') {
          const params = (member.params ?? []).map((p: any) => exprToText(p, sourceLines)).join(', ')
          methods.push({
            name: member.key.name,
            params,
            returnType: member.returnType ? sliceNodeSource(member.returnType, sourceLines).replace(/^:\s*/, '') : undefined,
            line: member.loc?.start?.line ?? 1,
            doc: findLeadingDoc(comments, member.loc?.start?.line ?? 1),
            algorithm: extractBodySteps(member, sourceLines, comments),
          })
        }
      }
      exports.push({
        kind: 'class',
        name: decl.id.name,
        extendsName,
        line: decl.loc?.start?.line ?? exportLine,
        doc: findLeadingDoc(comments, exportLine),
        methods,
      })
    } else if (decl.type === 'TSInterfaceDeclaration' && decl.id) {
      exports.push({
        kind: 'interface',
        name: decl.id.name,
        line: decl.loc?.start?.line ?? exportLine,
        doc: findLeadingDoc(comments, exportLine),
      })
    } else if (decl.type === 'TSTypeAliasDeclaration' && decl.id) {
      exports.push({
        kind: 'type',
        name: decl.id.name,
        line: decl.loc?.start?.line ?? exportLine,
        doc: findLeadingDoc(comments, exportLine),
      })
    } else if (decl.type === 'TSEnumDeclaration' && decl.id) {
      exports.push({
        kind: 'enum',
        name: decl.id.name,
        line: decl.loc?.start?.line ?? exportLine,
        doc: findLeadingDoc(comments, exportLine),
      })
    } else if (decl.type === 'FunctionDeclaration' && decl.id) {
      exports.push({
        kind: 'function',
        name: decl.id.name,
        line: decl.loc?.start?.line ?? exportLine,
        doc: findLeadingDoc(comments, exportLine),
        algorithm: extractBodySteps(decl, sourceLines, comments),
      })
    } else if (decl.type === 'VariableDeclaration') {
      for (const v of decl.declarations ?? []) {
        if (v.id?.type === 'Identifier') {
          const algo =
            v.init?.type === 'ArrowFunctionExpression' || v.init?.type === 'FunctionExpression'
              ? extractBodySteps(v.init, sourceLines, comments)
              : undefined
          exports.push({
            kind: 'const',
            name: v.id.name,
            line: v.loc?.start?.line ?? exportLine,
            doc: findLeadingDoc(comments, exportLine),
            algorithm: algo,
          })
        }
      }
    }
  }

  for (const stmt of ast.program.body) {
    if (stmt.type === 'ExportNamedDeclaration') {
      collectDecl(stmt.declaration, stmt.loc?.start?.line ?? 1)
    } else if (stmt.type === 'ExportDefaultDeclaration') {
      if (stmt.declaration?.type === 'ClassDeclaration' || stmt.declaration?.type === 'FunctionDeclaration') {
        collectDecl(stmt.declaration, stmt.loc?.start?.line ?? 1)
      }
    }
  }

  const routes =
    relPath.endsWith('.ctrl.ts') || relPath.endsWith('.controller.ts')
      ? extractRoutesFromAst(ast.program, sourceLines, comments)
      : []

  const modelSchemas = relPath.endsWith('.model.ts') ? extractModelSchemas(ast.program, sourceLines) : []

  return {
    relPath,
    docRelPath,
    role: detectRole(relPath),
    imports,
    exports,
    routes,
    modelSchemas,
    calledBy: [],
    extendedBy: [],
  }
}

function relativeMdLink(fromDocRelPath: string, toDocRelPath: string): string {
  const fromDir = path.posix.dirname(fromDocRelPath)
  const rel = path.posix.relative(fromDir, toDocRelPath)
  return rel.startsWith('.') ? rel : `./${rel}`
}

function wikilinkTarget(docRelPath: string): string {
  return docRelPath.replace(/\.md$/, '')
}

function renderAlgorithmSteps(steps: AlgorithmStep[], indent = 0): string[] {
  const lines: string[] = []
  const pad = '  '.repeat(indent)
  const badgeFor = (kind: AlgorithmStep['kind']) => {
    switch (kind) {
      case 'Error':
        return '`[Error]`'
      case 'Warning':
        return '`[Warning]`'
      case 'If':
        return '`[If]`'
      case 'Else':
        return '`[Else]`'
      case 'Loop':
        return '`[Loop]`'
      case 'Switch':
        return '`[Switch]`'
      case 'Case':
        return '`[Case]`'
      case 'Try':
        return '`[Try]`'
      case 'Catch':
        return '`[Catch]`'
      case 'Return':
        return '`[Return]`'
      default:
        return '`[Sequence]`'
    }
  }

  for (const s of steps) {
    const detailPart = s.detail ? ` — ${s.detail}` : ''
    lines.push(`${pad}- **${s.number}.** ${badgeFor(s.kind)} ${s.title}${detailPart}`)
    if (s.codeBlock) {
      lines.push(`${pad}  \`\`\`${s.codeBlock.lang}`)
      for (const cl of s.codeBlock.code.split('\n')) {
        lines.push(`${pad}  ${cl}`)
      }
      lines.push(`${pad}  \`\`\``)
    }
    if (s.children.length > 0) {
      lines.push(...renderAlgorithmSteps(s.children, indent + 1))
    }
  }

  return lines
}

function renderFileMarkdown(file: FileAnalysis): string {
  const lines: string[] = []
  const fileName = path.posix.basename(file.relPath)
  const srcLinkDepth = file.docRelPath.split('/').length - 1
  const repoRootPrefix = '../'.repeat(srcLinkDepth + 4)
  const sourceHref = `${repoRootPrefix}apps/elysia/src/${file.relPath}`

  lines.push(`# ${fileName}`)
  lines.push('')
  lines.push(`- **Source**: [\`${file.relPath}\`](${sourceHref})`)
  lines.push(`- **Layer / Role**: ${file.role}`)

  const baseClasses = file.exports.filter((e) => e.extendsName).map((e) => `${e.name} extends ${e.extendsName}`)
  if (baseClasses.length > 0) {
    lines.push(`- **Inheritance**: ${baseClasses.map((b) => `\`${b}\``).join(', ')}`)
  }
  if (file.extendedBy.length > 0) {
    const subLinks = file.extendedBy
      .map((s) => `[\`${s.name}\`](${relativeMdLink(file.docRelPath, s.docRelPath)}) ([[${wikilinkTarget(s.docRelPath)}]])`)
      .join(', ')
    lines.push(`- **Extended By**: ${subLinks}`)
  }
  lines.push('')

  if (file.routes.length > 0) {
    lines.push('## HTTP / WebSocket Routes & Algorithms')
    lines.push('')
    lines.push('| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |')
    lines.push('| :--- | :--- | :--- | :--- | :--- | :--- | :--- |')
    for (const r of file.routes) {
      const reqParts = [
        r.paramsRef ? `params: \`${r.paramsRef}\`` : '',
        r.queryRef ? `query: \`${r.queryRef}\`` : '',
        r.bodyRef ? `body: \`${r.bodyRef}\`` : '',
      ].filter(Boolean)
      const respText = r.responses.map((res) => `\`${res.status}\`: \`${res.schemaRef}\``).join('<br>') || '—'
      const callsText = r.calls.map((c) => `\`${c}\``).join('<br>') || '—'
      const tagsText = r.tags?.join(', ') || '—'
      const summaryText = (r.summary || r.description || '—').replace(/\|/g, '\\|')
      lines.push(
        `| \`${r.method}\` | \`${r.path}\` | ${summaryText} | ${tagsText} | ${reqParts.join('<br>') || '—'} | ${respText} | ${callsText} |`
      )
    }
    lines.push('')

    for (const r of file.routes) {
      if (r.algorithm.length === 0) continue
      lines.push(`### \`${r.method} ${r.path}\` (L${r.line})`)
      if (r.description) lines.push(r.description)
      lines.push('')
      lines.push(...renderAlgorithmSteps(r.algorithm))
      lines.push('')
    }
  }

  if (file.modelSchemas.length > 0) {
    lines.push('## TypeBox Schemas')
    lines.push('')
    for (const schema of file.modelSchemas) {
      lines.push(`### \`${schema.schemaName}\``)
      if (schema.fields.length === 0) {
        lines.push('_Empty object schema_')
      } else {
        lines.push('| Field | TypeBox Definition |')
        lines.push('| :--- | :--- |')
        for (const f of schema.fields) {
          lines.push(`| \`${f.name}\` | \`${f.typeExpr.replace(/\|/g, '\\|')}\` |`)
        }
      }
      lines.push('')
    }
  }

  if (file.exports.length > 0) {
    lines.push('## Exported Types, Methods & Algorithms')
    lines.push('')
    for (const exp of file.exports) {
      const extSuffix = exp.extendsName ? ` extends \`${exp.extendsName}\`` : ''
      lines.push(`### \`${exp.kind} ${exp.name}\`${extSuffix} (L${exp.line})`)
      if (exp.doc) {
        lines.push('')
        lines.push(exp.doc)
      }
      if (exp.methods && exp.methods.length > 0) {
        for (const m of exp.methods) {
          const retPart = m.returnType ? `: \`${m.returnType}\`` : ''
          lines.push('')
          lines.push(`#### \`${m.name}(${m.params || ''})\`${retPart} (L${m.line})`)
          if (m.doc) lines.push(m.doc)
          lines.push('')
          if (m.algorithm.length > 0) {
            lines.push(...renderAlgorithmSteps(m.algorithm))
          } else {
            lines.push('- _No executable statements_')
          }
        }
      } else if (exp.algorithm && exp.algorithm.length > 0) {
        lines.push('')
        lines.push(...renderAlgorithmSteps(exp.algorithm))
      }
      lines.push('')
    }
  }

  const internalImports = file.imports.filter((i) => i.targetRelPath !== null)
  const externalImports = file.imports.filter((i) => i.targetRelPath === null)

  lines.push('## Dependencies & Call Graph')
  lines.push('')
  lines.push('### Internal Modules (Calls / Imports)')
  if (internalImports.length === 0) {
    lines.push('- _None_')
  } else {
    for (const imp of internalImports) {
      const syms = imp.symbols.length > 0 ? ` — \`${imp.symbols.join('`, `')}\`` : ''
      if (imp.targetRelPath!.includes('.model.')) {
        lines.push(`- \`${imp.targetRelPath}\`${syms}`)
      } else {
        const targetDoc = imp.targetRelPath!.replace(/\.(ts|tsx)$/, '.md')
        const relHref = relativeMdLink(file.docRelPath, targetDoc)
        lines.push(`- [${imp.targetRelPath}](${relHref}) ([[${wikilinkTarget(targetDoc)}]])${syms}`)
      }
    }
  }
  lines.push('')

  lines.push('### External / Workspace Packages')
  if (externalImports.length === 0) {
    lines.push('- _None_')
  } else {
    for (const imp of externalImports) {
      const syms = imp.symbols.length > 0 ? ` — \`${imp.symbols.join('`, `')}\`` : ''
      lines.push(`- \`${imp.specifier}\`${syms}`)
    }
  }
  lines.push('')

  lines.push('### Called By / Imported By')
  if (file.calledBy.length === 0) {
    lines.push('- _None_')
  } else {
    for (const caller of file.calledBy) {
      const relHref = relativeMdLink(file.docRelPath, caller.fromDocRelPath)
      const syms = caller.symbols.length > 0 ? ` — \`${caller.symbols.join('`, `')}\`` : ''
      lines.push(`- [${caller.fromRelPath}](${relHref}) ([[${wikilinkTarget(caller.fromDocRelPath)}]])${syms}`)
    }
  }
  lines.push('')

  return lines.join('\n')
}

function generateIndexFiles(analyses: FileAnalysis[]): Set<string> {
  const written = new Set<string>()
  const dirs = new Set<string>([''])
  for (const a of analyses) {
    let d = path.posix.dirname(a.docRelPath)
    while (d && d !== '.') {
      dirs.add(d)
      d = path.posix.dirname(d)
      if (d === '.') d = ''
    }
  }

  for (const dirRel of Array.from(dirs).sort()) {
    const childFiles = analyses
      .filter((a) => (path.posix.dirname(a.docRelPath) === '.' ? '' : path.posix.dirname(a.docRelPath)) === dirRel)
      .sort((a, b) => a.relPath.localeCompare(b.relPath))

    const childDirs = Array.from(dirs)
      .filter((d) => d !== '' && (path.posix.dirname(d) === '.' ? '' : path.posix.dirname(d)) === dirRel)
      .sort()

    const title = dirRel ? `src/${dirRel}` : 'apps/elysia/src'
    const lines: string[] = [`# ${title}`, '']

    if (childDirs.length > 0) {
      lines.push('## Subdirectories')
      lines.push('')
      for (const cd of childDirs) {
        const name = path.posix.basename(cd)
        lines.push(`- [${name}/](./${name}/README.md) ([[${cd}/README]])`)
      }
      lines.push('')
    }

    if (childFiles.length > 0) {
      lines.push('## Modules')
      lines.push('')
      lines.push('| Module | Role | Routes | Exports |')
      lines.push('| :--- | :--- | :--- | :--- |')
      for (const f of childFiles) {
        const base = path.posix.basename(f.docRelPath)
        const name = path.posix.basename(f.relPath)
        const exps = f.exports.slice(0, 4).map((e) => `\`${e.name}\``).join(', ')
        lines.push(`| [${name}](./${base}) ([[${wikilinkTarget(f.docRelPath)}]]) | ${f.role} | ${f.routes.length} | ${exps || '—'} |`)
      }
      lines.push('')
    }

    const indexRel = dirRel ? `${dirRel}/README.md` : 'README.md'
    const outPath = path.join(DOCS_DIR, indexRel)
    fs.mkdirSync(path.dirname(outPath), { recursive: true })
    fs.writeFileSync(outPath, lines.join('\n'), 'utf8')
    written.add(indexRel)
  }

  return written
}

function pruneStaleDocs(expectedRelPaths: Set<string>): number {
  let removed = 0
  if (!fs.existsSync(DOCS_DIR)) return 0

  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(full)
        if (fs.readdirSync(full).length === 0) {
          fs.rmdirSync(full)
        }
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const rel = toPosix(path.relative(DOCS_DIR, full))
        if (!expectedRelPaths.has(rel)) {
          fs.unlinkSync(full)
          removed++
        }
      }
    }
  }
  walk(DOCS_DIR)
  return removed
}

function verifyInternalLinks(expectedRelPaths: Set<string>): string[] {
  const broken: string[] = []
  for (const rel of expectedRelPaths) {
    const full = path.join(DOCS_DIR, rel)
    const text = fs.readFileSync(full, 'utf8')
    const linkRegex = /\[[^\]]+\]\((\.[^)]+\.md)\)/g
    let match: RegExpExecArray | null
    while ((match = linkRegex.exec(text)) !== null) {
      const targetRel = path.posix.normalize(path.posix.join(path.posix.dirname(rel), match[1]!))
      if (!expectedRelPaths.has(targetRel)) {
        broken.push(`${rel} -> ${match[1]} (resolved: ${targetRel})`)
      }
    }
  }
  return broken
}

export function generateDocs() {
  const sourceFiles = walkSourceFiles(SRC_DIR)
  const knownRelPaths = new Set(sourceFiles.map((f) => toPosix(path.relative(SRC_DIR, f))))

  const analyses = sourceFiles.map((f) => analyzeFile(f, knownRelPaths))
  const byRel = new Map(analyses.map((a) => [a.relPath, a]))
  const classToAnalysis = new Map<string, FileAnalysis>()
  for (const a of analyses) {
    for (const e of a.exports) {
      if (e.kind === 'class') classToAnalysis.set(e.name, a)
    }
  }

  for (const caller of analyses) {
    for (const imp of caller.imports) {
      if (!imp.targetRelPath) continue
      const target = byRel.get(imp.targetRelPath)
      if (target) {
        target.calledBy.push({
          fromRelPath: caller.relPath,
          fromDocRelPath: caller.docRelPath,
          symbols: imp.symbols,
        })
      }
    }

    for (const exp of caller.exports) {
      if (exp.kind === 'class' && exp.extendsName) {
        const baseAnalysis = classToAnalysis.get(exp.extendsName)
        if (baseAnalysis) {
          baseAnalysis.extendedBy.push({
            name: exp.name,
            relPath: caller.relPath,
            docRelPath: caller.docRelPath,
          })
        }
      }
    }
  }

  for (const a of analyses) {
    a.calledBy.sort((x, y) => x.fromRelPath.localeCompare(y.fromRelPath))
    a.extendedBy.sort((x, y) => x.relPath.localeCompare(y.relPath))
  }

  const docAnalyses = analyses.filter((a) => !a.relPath.includes('.model.'))

  const expectedRelPaths = new Set<string>()
  for (const a of docAnalyses) {
    const outPath = path.join(DOCS_DIR, a.docRelPath)
    fs.mkdirSync(path.dirname(outPath), { recursive: true })
    fs.writeFileSync(outPath, renderFileMarkdown(a), 'utf8')
    expectedRelPaths.add(a.docRelPath)
  }

  const indexFiles = generateIndexFiles(docAnalyses)
  for (const idx of indexFiles) expectedRelPaths.add(idx)

  const pruned = pruneStaleDocs(expectedRelPaths)
  const broken = verifyInternalLinks(expectedRelPaths)

  if (broken.length > 0) {
    throw new Error(`Broken internal doc links detected:\n${broken.join('\n')}`)
  }

  const irisResult = writeIrisDocs(analyses, IRIS_DOCS_DIR)

  console.log(
    `[DocsGenerator] Generated ${docAnalyses.length} module docs + ${indexFiles.size} README indexes (pruned ${pruned} stale files, 0 broken links) + ${irisResult.count} IrisPage JSON docs (pruned ${irisResult.pruned} stale JSON).`
  )
  return {
    modules: docAnalyses.length,
    indexes: indexFiles.size,
    pruned,
    brokenLinks: broken.length,
    irisPages: irisResult.count,
  }
}

if (import.meta.main) {
  generateDocs()
}
