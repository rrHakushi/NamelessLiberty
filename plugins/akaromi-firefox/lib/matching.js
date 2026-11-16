/**
 * Akaromi — Bitwarden-Compatible URI Matching Engine
 */
;(function (root) {
  const IrisMatching = {}

  const BitwardenUriMatch = {
    BASE_DOMAIN: 0,
    HOST: 1,
    STARTS_WITH: 2,
    EXACT: 3,
    REGULAR_EXPRESSION: 4,
    NEVER: 5,
  }
  IrisMatching.BitwardenUriMatch = BitwardenUriMatch

  const BITWARDEN_MATCH_LABELS = {
    BASE_DOMAIN: "Base domain",
    HOST: "Host",
    STARTS_WITH: "Starts with",
    EXACT: "Exact",
    REGULAR_EXPRESSION: "Regular expression",
    NEVER: "Never",
  }
  IrisMatching.BITWARDEN_MATCH_LABELS = BITWARDEN_MATCH_LABELS

    // Step 2: Bitwarden Matching Strategy Normalization
  // Step 2.1: Strategy Enum & Case-Insensitive Normalization
  function normalizeMatchStrategy(strategy) {
    if (typeof strategy === "number") return strategy
    if (typeof strategy === "string") {
      const upper = strategy.toUpperCase()
      if (upper === "BASE_DOMAIN" || upper === "0") return BitwardenUriMatch.BASE_DOMAIN
      if (upper === "HOST" || upper === "1") return BitwardenUriMatch.HOST
      if (upper === "STARTS_WITH" || upper === "STARTSWITH" || upper === "2") return BitwardenUriMatch.STARTS_WITH
      if (upper === "EXACT" || upper === "3") return BitwardenUriMatch.EXACT
      if (upper === "REGULAR_EXPRESSION" || upper === "REGEX" || upper === "4") return BitwardenUriMatch.REGULAR_EXPRESSION
      if (upper === "NEVER" || upper === "5") return BitwardenUriMatch.NEVER
    }
    return BitwardenUriMatch.BASE_DOMAIN
  }
  IrisMatching.normalizeMatchStrategy = normalizeMatchStrategy

  /**
   * Extracts hostname from a URL string safely
   */
    // Step 1: URL Normalization & Domain Extraction
  // Step 1.1: Safe Hostname Extraction
  IrisMatching.extractHost = function (urlString) {
    if (!urlString) return ""
    try {
      const url = new URL(
        urlString.includes("://") ? urlString : `https://${urlString}`
      )
      return url.hostname.toLowerCase()
    } catch {
      const bare = urlString.toLowerCase().split("/")[0] || ""
      return bare.replace(/^.*@/, "").replace(/:\d+$/, "")
    }
  }

  // Multi-tenant and compound public suffixes
  const PUBLIC_SUFFIXES = [
    "co.uk", "org.uk", "me.uk", "gov.uk", "ac.uk",
    "co.jp", "ne.jp", "ac.jp", "go.jp",
    "com.au", "net.au", "org.au", "edu.au", "gov.au",
    "co.nz", "net.nz", "org.nz", "govt.nz",
    "com.br", "net.br", "org.br",
    "co.in", "net.in", "org.in", "gov.in",
    "com.mx", "org.mx", "gob.mx",
    "com.sg", "net.sg", "org.sg", "gov.sg",
    "co.za", "org.za", "gov.za",
    "com.tr", "org.tr", "edu.tr", "gov.tr",
    "co.kr", "ne.kr", "or.kr", "go.kr",
    "com.tw", "org.tw", "gov.tw",
    "github.io", "gitlab.io", "pages.dev", "vercel.app",
    "netlify.app", "azurewebsites.net", "herokuapp.com",
    "cloudfront.net", "s3.amazonaws.com",
    "workers.dev", "fly.dev", "onrender.com", "web.app",
    "firebaseapp.com", "ngrok-free.app", "ngrok.io",
    "duckdns.org", "supabase.co"
  ]
  IrisMatching.PUBLIC_SUFFIXES = PUBLIC_SUFFIXES

  const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"])
  IrisMatching.LOOPBACK_HOSTS = LOOPBACK_HOSTS

  function isLoopbackHost(host) {
    return Boolean(host && LOOPBACK_HOSTS.has(String(host).toLowerCase()))
  }
  IrisMatching.isLoopbackHost = isLoopbackHost

  /**
   * Checks whether a host is a public suffix using Mozilla's Public Suffix List (IrisPsl)
   */
  IrisMatching.isPublicSuffix = function (urlOrHost) {
    const host = IrisMatching.extractHost(urlOrHost)
    if (!host) return false
    if (root.IrisPsl && typeof root.IrisPsl.isPublicSuffix === "function") {
      return root.IrisPsl.isPublicSuffix(host)
    }
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host) || host.includes(":")) return false
    if (PUBLIC_SUFFIXES.includes(host)) return true
    return IrisMatching.extractBaseDomain("sub." + host) !== IrisMatching.extractBaseDomain(host)
  }

  /**
   * Extracts base domain (eTLD+1 via Mozilla PSL when available)
   */
  // Step 1.2: Public Suffix List & Base Domain Resolution
  IrisMatching.extractBaseDomain = function (urlString) {
    const host = IrisMatching.extractHost(urlString)
    if (!host) return ""

    // IP address check
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host) || host.includes(":")) {
      return host
    }

    if (root.IrisPsl && typeof root.IrisPsl.getBaseDomain === "function") {
      return root.IrisPsl.getBaseDomain(host)
    }

    const parts = host.split(".")
    if (parts.length <= 2) return host

    const lastTwo = parts.slice(-2).join(".")
    if (PUBLIC_SUFFIXES.includes(lastTwo) && parts.length >= 3) {
      return parts.slice(-3).join(".")
    }

    // Common standard SLD checks (e.g. .co.xx, .com.xx, .gov.xx)
    const secondToLast = parts[parts.length - 2]
    if (["co", "com", "org", "net", "edu", "gov", "ac", "ne", "or"].includes(secondToLast) && parts.length >= 3) {
      return parts.slice(-3).join(".")
    }

    return parts.slice(-2).join(".")
  }

  function isInsecureHttpDowngrade(cleanTarget, cleanVault) {
    const lowerVault = cleanVault.toLowerCase()
    const lowerTarget = cleanTarget.toLowerCase()
    if (lowerTarget.startsWith("http://") && !lowerVault.startsWith("http://")) {
      const targetHost = IrisMatching.extractHost(cleanTarget)
      return !isLoopbackHost(targetHost)
    }
    return false
  }

  /**
   * Tests whether targetUrl matches vaultUri according to Bitwarden match strategy
   */
    // Step 3: Match Evaluation Engine (Exact, Starts With, Host, Regex, Base Domain, Never)
  // Step 3.1: Multi-Strategy Match Evaluation
  IrisMatching.isUriMatch = function (
    targetUrl,
    vaultUri,
    matchStrategy = BitwardenUriMatch.BASE_DOMAIN
  ) {
    if (!targetUrl || !vaultUri) return false
    const strategy = normalizeMatchStrategy(matchStrategy)
    if (strategy === BitwardenUriMatch.NEVER) return false

    const cleanTarget = targetUrl.trim()
    const cleanVault = vaultUri.trim()

    switch (strategy) {
      case BitwardenUriMatch.EXACT: {
        const normTarget = cleanTarget.replace(/\/+$/, "").toLowerCase()
        const normVault = cleanVault.replace(/\/+$/, "").toLowerCase()
        return normTarget === normVault
      }

      case BitwardenUriMatch.STARTS_WITH: {
        const lowerTarget = cleanTarget.toLowerCase()
        const lowerVault = cleanVault.toLowerCase()
        if (!lowerTarget.startsWith(lowerVault)) return false

        // Parse URLs to prevent userinfo authority spoofing (e.g. https://example.com:x@evil.com)
        let tUrl = null
        let vUrl = null
        try {
          tUrl = new URL(cleanTarget.includes("://") ? cleanTarget : `https://${cleanTarget}`)
          vUrl = new URL(cleanVault.includes("://") ? cleanVault : `https://${cleanVault}`)
        } catch {
          return false
        }

        if (isInsecureHttpDowngrade(cleanTarget, cleanVault)) {
          return false
        }
        if (cleanVault.includes("://") && tUrl.protocol !== vUrl.protocol) {
          return false
        }
        const tHost = tUrl.hostname.toLowerCase()
        const vHost = vUrl.hostname.toLowerCase()
        if (!tHost || !vHost || tHost !== vHost) {
          return false
        }
        if (tUrl.port !== vUrl.port) {
          return false
        }

        // Boundary check: if match is exact or followed by boundary character (/ ? # :port or end)
        if (lowerTarget.length === lowerVault.length) return true
        const nextChar = lowerTarget[lowerVault.length]
        if (lowerVault.endsWith("/") || ["/", "?", "#", ":"].includes(nextChar)) {
          return true
        }
        return false
      }

      case BitwardenUriMatch.HOST: {
        if (isInsecureHttpDowngrade(cleanTarget, cleanVault)) return false
        const targetHost = IrisMatching.extractHost(cleanTarget)
        const vaultHost = IrisMatching.extractHost(cleanVault)
        return Boolean(targetHost && vaultHost && targetHost === vaultHost)
      }

      case BitwardenUriMatch.REGULAR_EXPRESSION: {
        try {
          if (cleanVault.length > 256) return false
          // Reject nested quantifiers, quantified alternations, and nested groups with quantifiers (ReDoS protection)
          let depth = 0
          let hasQuantifiedGroup = false
          const groupStack = []
          for (let i = 0; i < cleanVault.length; i++) {
            const ch = cleanVault[i]
            if (ch === "\\") {
              i++
              continue
            }
            if (ch === "(") {
              depth++
              groupStack.push({ hasQuantifierOrAlt: false })
            } else if (ch === ")") {
              const top = groupStack.pop()
              depth = Math.max(0, depth - 1)
              const next = cleanVault[i + 1]
              const isQuantified = next === "+" || next === "*" || next === "?" || next === "{"
              if (top && isQuantified && top.hasQuantifierOrAlt) {
                hasQuantifiedGroup = true
                break
              }
              if (groupStack.length > 0 && (isQuantified || top?.hasQuantifierOrAlt)) {
                groupStack[groupStack.length - 1].hasQuantifierOrAlt = true
              }
            } else if (groupStack.length > 0 && (ch === "+" || ch === "*" || ch === "?" || ch === "{" || ch === "|")) {
              groupStack[groupStack.length - 1].hasQuantifierOrAlt = true
            }
          }
          if (hasQuantifiedGroup) return false
          const regex = new RegExp(cleanVault, "i")
          return regex.test(cleanTarget.slice(0, 512))
        } catch {
          return false
        }
      }

      case BitwardenUriMatch.BASE_DOMAIN:
      default: {
        if (isInsecureHttpDowngrade(cleanTarget, cleanVault)) return false
        const targetBase = IrisMatching.extractBaseDomain(cleanTarget)
        const vaultBase = IrisMatching.extractBaseDomain(cleanVault)
        return Boolean(targetBase && vaultBase && targetBase === vaultBase)
      }
    }
  }

  root.IrisMatching = IrisMatching
})(typeof self !== "undefined" ? self : this)
