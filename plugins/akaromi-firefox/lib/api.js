/**
 * Akaromi — Backend API Client
 */
;(function (root) {
  const IrisApi = {}

  const DEFAULT_SERVER_URL = "http://localhost:4000"

  const ext = typeof browser !== "undefined" ? browser : chrome
  const storage = typeof IrisStorage !== "undefined" ? IrisStorage : ext.storage.local

    // Step 1: Endpoint Configuration & Token Resolution
  // Step 1.1: Server URL Resolution & Storage Persistence
  function validateServerUrl(url) {
    const raw = (url || DEFAULT_SERVER_URL).trim().replace(/\/+$/, "")
    let parsed
    try {
      parsed = new URL(raw)
    } catch {
      throw new Error("Invalid server URL format")
    }

    const host = parsed.hostname.toLowerCase()
    const isLoopback = host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1"
    if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && isLoopback)) {
      throw new Error("Server URL must use HTTPS (HTTP is only allowed for localhost)")
    }

    return parsed.origin + (parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/+$/, ""))
  }

  IrisApi.getServerUrl = async function () {
    const data = await storage.get(["serverUrl"])
    return (data.serverUrl || DEFAULT_SERVER_URL).replace(/\/+$/, "")
  }

  IrisApi.getValidatedServerUrl = async function () {
    const stored = await IrisApi.getServerUrl()
    return validateServerUrl(stored)
  }

  IrisApi.setServerUrl = async function (url) {
    const cleanUrl = validateServerUrl(url)
    await storage.set({ serverUrl: cleanUrl })
    return cleanUrl
  }

  const AUTH_KEYSTORE_DB = "akaromi_auth_keystore"
  const AUTH_KEYSTORE_STORE = "keys"
  const AUTH_KEY_ID = "token_wrap_v1"

  function openAuthKeystore() {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB unavailable"))
      const req = indexedDB.open(AUTH_KEYSTORE_DB, 1)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(AUTH_KEYSTORE_STORE)) {
          db.createObjectStore(AUTH_KEYSTORE_STORE)
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error || new Error("Failed to open auth keystore"))
    })
  }

  async function getOrCreateTokenWrapKey(createIfMissing = true) {
    if (typeof crypto === "undefined" || !crypto.subtle) return null
    let db
    try {
      db = await openAuthKeystore()
      const existing = await new Promise((resolve, reject) => {
        const tx = db.transaction(AUTH_KEYSTORE_STORE, "readonly")
        const req = tx.objectStore(AUTH_KEYSTORE_STORE).get(AUTH_KEY_ID)
        req.onsuccess = () => resolve(req.result || null)
        req.onerror = () => reject(req.error)
      })
      if (existing) return existing
      if (!createIfMissing) return null

      const newKey = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
      )
      await new Promise((resolve, reject) => {
        const tx = db.transaction(AUTH_KEYSTORE_STORE, "readwrite")
        const req = tx.objectStore(AUTH_KEYSTORE_STORE).put(newKey, AUTH_KEY_ID)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
      })
      return newKey
    } catch {
      return null
    } finally {
      try { db?.close() } catch {}
    }
  }

  async function encryptTokenValue(plaintext) {
    if (!plaintext) return ""
    const key = await getOrCreateTokenWrapKey(true)
    if (!key) return null
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encoded = new TextEncoder().encode(plaintext)
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded))
    const toB64 = (arr) => {
      let bin = ""
      for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i])
      return btoa(bin)
    }
    return `enc:v1:${toB64(iv)}:${toB64(ct)}`
  }

  async function decryptTokenValue(stored) {
    if (!stored || typeof stored !== "string") return ""
    if (!stored.startsWith("enc:v1:")) return stored
    const parts = stored.split(":")
    if (parts.length !== 4) return ""
    const key = await getOrCreateTokenWrapKey(false)
    if (!key) return ""
    try {
      const fromB64 = (b64) => {
        const bin = atob(b64)
        const out = new Uint8Array(bin.length)
        for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
        return out
      }
      const iv = fromB64(parts[2])
      const ct = fromB64(parts[3])
      const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct)
      return new TextDecoder().decode(pt)
    } catch {
      return ""
    }
  }

  async function saveTokens(authToken, apiKey, user) {
    const cleanAuth = authToken || ""
    const cleanApi = apiKey || ""
    if (ext.storage?.session) {
      await ext.storage.session.set({
        sessionAuthToken: cleanAuth,
        sessionApiKey: cleanApi,
      }).catch(() => {})
    }
    const encAuth = cleanAuth ? await encryptTokenValue(cleanAuth) : ""
    const encApi = cleanApi ? await encryptTokenValue(cleanApi) : ""
    const payload = {}
    if (encAuth !== null) payload.authToken = encAuth
    if (encApi !== null) payload.apiKey = encApi
    if (user !== undefined) payload.user = user
    if (Object.keys(payload).length > 0) {
      await storage.set(payload)
    }
  }

  IrisApi.getToken = async function () {
    if (ext.storage?.session) {
      try {
        const sess = await ext.storage.session.get(["sessionAuthToken", "sessionApiKey"])
        if (sess?.sessionAuthToken || sess?.sessionApiKey) {
          const authToken = sess.sessionAuthToken || ""
          const apiKey = sess.sessionApiKey || ""
          return { authToken, apiKey, token: authToken || apiKey }
        }
      } catch {}
    }

    const data = await storage.get(["authToken", "apiKey"])
    const authToken = await decryptTokenValue(data.authToken || "")
    const apiKey = await decryptTokenValue(data.apiKey || "")

    // Migrate legacy plaintext tokens to encrypted-at-rest format on read
    if ((data.authToken && !data.authToken.startsWith("enc:v1:")) || (data.apiKey && !data.apiKey.startsWith("enc:v1:"))) {
      await saveTokens(authToken, apiKey).catch(() => {})
    } else if ((authToken || apiKey) && ext.storage?.session) {
      await ext.storage.session.set({
        sessionAuthToken: authToken,
        sessionApiKey: apiKey,
      }).catch(() => {})
    }

    return {
      authToken,
      apiKey,
      token: authToken || apiKey || "",
    }
  }

  async function request(path, options = {}) {
    const serverUrl = await IrisApi.getValidatedServerUrl()
    const { authToken, apiKey } = await IrisApi.getToken()

    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    }

    if (apiKey) {
      headers["x-api-key"] = apiKey
    } else if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`
    }

    const res = await fetch(`${serverUrl}${path}`, {
      ...options,
      headers,
      credentials: "include", // For session cookies
    })

    if (!res.ok) {
      let errMessage = `HTTP error ${res.status}`
      try {
        const body = await res.json()
        if (body?.message) errMessage = body.message
        else if (body?.error) errMessage = body.error
      } catch {}
      throw new Error(errMessage)
    }

    return res.json()
  }

  /**
   * Log into IRIS account (returns mfaRequired/mfaTicket if 2FA active)
   */
    // Step 2: Authentication & Session Verification
  // Step 2.1: Login Submission & Session Token Persistence
  IrisApi.login = async function (identifier, password) {
    const data = await request("/carina/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    })

    if (data?.token) {
      await saveTokens(data.token, "", data.user)

      // Fetch full profile (avatar, customization)
      try {
        const auth = await IrisApi.checkAuth()
        if (auth?.authenticated && auth?.user) {
          data.user = auth.user
          await storage.set({ user: auth.user })
        }
      } catch (e) {}
    }

    return data
  }

  /**
   * Complete MFA verification challenge (email OTP or totp)
   */
  IrisApi.verifyMfa = async function (mfaTicket, code, mfaType = "email") {
    let endpoint = "/carina/auth/twofactor/email/verify"
    if (mfaType === "totp") {
      endpoint = "/carina/auth/twofactor/totp/verify"
    } else if (mfaType === "backup_code" || mfaType === "backupcodes") {
      endpoint = "/carina/auth/twofactor/backupcodes/verify"
    }
    const data = await request(endpoint, {
      method: "POST",
      body: JSON.stringify({
        mfaTicket,
        code: String(code).trim(),
      }),
    })

    if (data?.token) {
      await saveTokens(data.token, "", data.user)

      try {
        const auth = await IrisApi.checkAuth()
        if (auth?.authenticated && auth?.user) {
          data.user = auth.user
          await storage.set({ user: auth.user })
        }
      } catch (e) {}
    }

    return data
  }

  /**
   * Dispatch / resend MFA verification email
   */
  IrisApi.sendMfaEmail = async function (mfaTicket) {
    return request("/carina/auth/twofactor/email/send", {
      method: "POST",
      body: JSON.stringify({ mfaTicket }),
    })
  }

  /**
   * Authenticate directly via API Key
   */
  IrisApi.loginWithApiKey = async function (apiKey) {
    const cleanKey = (apiKey || "").trim()
    if (!cleanKey) throw new Error("API Key cannot be empty")

    const serverUrl = await IrisApi.getValidatedServerUrl()
    const res = await fetch(`${serverUrl}/carina/users/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": cleanKey,
      },
    })

    if (!res.ok) {
      let errMessage = `HTTP error ${res.status}`
      try {
        const body = await res.json()
        if (body?.message) errMessage = body.message
        else if (body?.error) errMessage = body.error
      } catch {}
      throw new Error(errMessage)
    }

    const data = await res.json()
    const user = data?.user || data

    await saveTokens("", cleanKey, user)

    return user
  }

  /**
   * Log out of IRIS account and clear all credentials
   */
  IrisApi.logout = async function () {
    await storage.clear()
    if (ext.storage?.local) {
      await ext.storage.local.clear().catch(() => {})
    }
    if (ext.storage?.session) {
      await ext.storage.session.clear().catch(() => {})
    }
    if (typeof indexedDB !== "undefined") {
      try {
        indexedDB.deleteDatabase(AUTH_KEYSTORE_DB)
      } catch {}
    }
  }

  /**
   * Check connection and user status
   */
  IrisApi.checkAuth = async function () {
    try {
      const data = await request("/carina/users/me")
      return { authenticated: true, user: data?.user || data }
    } catch (err) {
      return { authenticated: false, error: err.message }
    }
  }

  /**
   * Fetch encryption keys (publicKey, encryptedPrivateKey, salt)
   */
  IrisApi.fetchEncryptionKeys = async function () {
    return request("/akaromi/encryption/keys")
  }

  /**
   * Fetch all vault ciphers
   */
  IrisApi.fetchCiphers = async function (query = {}) {
    const params = new URLSearchParams()
    if (query.type) params.append("type", query.type)
    if (typeof query.favorite === "boolean") params.append("favorite", String(query.favorite))
    if (typeof query.trash === "boolean") params.append("trash", String(query.trash))
    const qStr = params.toString() ? `?${params.toString()}` : ""
    return request(`/akaromi/ciphers${qStr}`)
  }

  /**
   * Create cipher in vault
   */
  IrisApi.createCipher = async function (payload) {
    return request("/akaromi/ciphers", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  /**
   * Update cipher in vault
   */
  IrisApi.updateCipher = async function (id, payload) {
    return request(`/akaromi/ciphers/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  }

  /**
   * Delete / trash cipher in vault
   */
  IrisApi.deleteCipher = async function (id, permanent = false) {
    const q = permanent ? "?permanent=true" : ""
    return request(`/akaromi/ciphers/${encodeURIComponent(id)}${q}`, {
      method: "DELETE",
    })
  }

  /**
   * Restore cipher from trash
   */
  IrisApi.restoreCipher = async function (id) {
    return request(`/akaromi/ciphers/${encodeURIComponent(id)}/restore`, {
      method: "POST",
    })
  }

  /**
   * Permanently empty trash bin
   */
  IrisApi.emptyTrash = async function () {
    return request("/akaromi/ciphers/trash", {
      method: "DELETE",
    })
  }

  /**
   * Delta sync
   */
  IrisApi.syncVault = async function (sinceTimestamp) {
    const query = sinceTimestamp ? `?since=${sinceTimestamp}` : ""
    return request(`/akaromi/sync${query}`)
  }

  root.IrisApi = IrisApi
})(typeof self !== "undefined" ? self : this)
