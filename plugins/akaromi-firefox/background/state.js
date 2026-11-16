/**
 * Akaromi for Firefox — Background State & Lifecycle Manager
 */

// Universal browser API shim (Firefox & Chromium compatible)
const ext = typeof browser !== "undefined" ? browser : chrome
const storage = typeof IrisStorage !== "undefined" ? IrisStorage : ext.storage.local

try {
  ext.storage?.session?.setAccessLevel?.({ accessLevel: "TRUSTED_CONTEXTS" })?.catch?.(() => {})
} catch {}

// In-memory vault state (strictly zero-history, wiped on lock or restart)
// Step 1: In-Memory Volatile Vault Store
// Step 1.1: Zero-History Vault Key & Decrypted Ciphers State
let inMemoryVaultKey = null
let inMemoryCiphers = []
let autoLockTimer = null
let pendingScannedTotpMemory = null
let ensureVaultPromise = null

const ONE_HOUR_MS = 60 * 60 * 1000

/**
 * Saves current in-memory vault key to session storage
 */
// Step 2: Session Storage Vault Key Persistence
// Step 2.1: Ephemeral Session Storage Backup & Cleansing on Vault Lock
async function saveVaultKeyToSession() {
  if (!ext.storage?.session || !inMemoryVaultKey) return
  try {
    const vaultKeyHex = IrisCrypto.bytesToHex(inMemoryVaultKey)
    await ext.storage.session.set({
      vaultKeyHex,
      lastActive: Date.now(),
    })
  } catch (err) {
    console.warn("[Akaromi] Failed to save session vault key:", err)
  }
}

/**
 * Removes session vault key
 */
async function clearVaultKeyFromSession() {
  pendingScannedTotpMemory = null
  if (ext.storage?.session) {
    await ext.storage.session
      .remove(["vaultKeyHex", "encryptedVaultKey", "lastActive", "pendingScannedTotp", "pinUnlockData", "pinUnlockEnabled"])
      .catch(() => {})
  }
}

/**
 * Helper: ensure vault is active and unlocked
 * Uses cached encrypted ciphers from local storage to avoid redundant network calls!
 */
async function ensureVaultActive() {
  if (ensureVaultPromise) return ensureVaultPromise
  ensureVaultPromise = (async () => {
    try {
      if (inMemoryVaultKey) {
        if (inMemoryCiphers.length === 0) {
          await decryptCachedVault(inMemoryVaultKey)
        }
        // Check if background hourly sync is due
        checkHourlySyncDue()
        return true
      }

      if (ext.storage?.session) {
        try {
          const sessionData = await ext.storage.session.get([
            "vaultKeyHex",
            "lastActive",
          ])
          if (sessionData?.vaultKeyHex) {
            const settings = await storage.get(["autoLockMinutes"])
            const minutes = settings.autoLockMinutes ?? 15

            if (minutes > 0 && sessionData.lastActive) {
              const elapsed = Date.now() - sessionData.lastActive
              if (elapsed >= minutes * 60 * 1000) {
                console.log(
                  "[Akaromi] Auto-lock expired while background worker was idle"
                )
                lockVault()
                return false
              }
            }

            inMemoryVaultKey = IrisCrypto.hexToBytes(sessionData.vaultKeyHex)
            await decryptCachedVault(inMemoryVaultKey)
            await resetAutoLock({ preserveLastActive: true })
            checkHourlySyncDue()
            return true
          }
        } catch (err) {
          console.warn("[Akaromi] Session restore error:", err)
        }
      }

      return false
    } finally {
      ensureVaultPromise = null
    }
  })()
  return ensureVaultPromise
}

/**
 * Checks if 1 hour has elapsed since last sync and triggers background sync
 */
async function checkHourlySyncDue() {
  try {
    const sData = await storage.get(["lastSyncTimestamp"])
    const lastSync = sData.lastSyncTimestamp || 0
    if (Date.now() - lastSync >= ONE_HOUR_MS && inMemoryVaultKey) {
      syncVault({ force: true }).catch((err) => {
        console.warn("[Akaromi] Hourly background sync warning:", err)
      })
    }
  } catch {}
}

/**
 * Reset auto-lock timer based on settings
 */
async function resetAutoLock(options = {}) {
  const { preserveLastActive = false } = options
  if (autoLockTimer) clearTimeout(autoLockTimer)

  const settings = await storage.get(["autoLockMinutes"])
  const minutes = settings.autoLockMinutes ?? 15 // 15 min default (0 = Never)

  let lastActive = Date.now()
  if (preserveLastActive && ext.storage?.session) {
    const s = await ext.storage.session.get(["lastActive"])
    if (s.lastActive) lastActive = s.lastActive
  }

  if (ext.storage?.session && inMemoryVaultKey && !preserveLastActive) {
    ext.storage.session.set({ lastActive }).catch(() => {})
  }

  if (minutes > 0 && inMemoryVaultKey) {
    const elapsed = Date.now() - lastActive
    const remainingMs = Math.max(5000, minutes * 60 * 1000 - elapsed)
    const delayInMinutes = Math.max(0.1, remainingMs / 60000)

    try {
      ext.alarms?.create("autoLock", { delayInMinutes })
    } catch (e) {
      console.warn("[Akaromi] Could not create autoLock alarm:", e)
    }

    autoLockTimer = setTimeout(
      () => {
        console.log("[Akaromi] Auto-locking vault due to inactivity")
        lockVault()
      },
      remainingMs
    )
  } else {
    try {
      ext.alarms?.clear("autoLock")
    } catch {}
  }
}

// Register alarm listener for background auto-lock
if (ext.alarms?.onAlarm) {
  ext.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "autoLock") {
      console.log("[Akaromi] Auto-locking vault due to alarm")
      lockVault()
    }
  })
}

/**
 * Locks vault and purges all decrypted data from memory and session storage
 */
function lockVault() {
  if (inMemoryVaultKey) {
    IrisCrypto.zeroize(inMemoryVaultKey)
    inMemoryVaultKey = null
  }
  inMemoryCiphers = []
  pendingScannedTotpMemory = null
  if (typeof lastAutofilledCipherByTab !== "undefined") {
    lastAutofilledCipherByTab.clear()
  }
  if (typeof inlineSearchAuthorizedByTab !== "undefined") {
    inlineSearchAuthorizedByTab.clear()
  }
  if (autoLockTimer) clearTimeout(autoLockTimer)
  try {
    ext.alarms?.clear("autoLock")
  } catch {}
  if (ext.storage?.session) {
    ext.storage.session
      .remove(["vaultKeyHex", "encryptedVaultKey", "lastActive", "pendingScannedTotp"])
      .catch(() => {})
  }
  storage
    .remove([
      "sessionMasterKey",
      "akaromi_auth_draft",
      "akaromi_edit_draft",
      "akaromi_gen_draft",
      "pendingScannedTotp",
    ])
    .catch(() => {})
  updateBadge()
  try {
    ext.runtime.sendMessage({ action: "VAULT_LOCKED" }).catch(() => {})
  } catch {}
}

function isPrivilegedSender(sender) {
  // Allow internal extension pages (toolbar popup, standalone popup window, extension tab, options page)
  // while rejecting webpage content scripts.
  if (!sender || sender.id !== ext.runtime.id) return false
  const extOrigin = ext.runtime.getURL("")
  if (sender.url) {
    return sender.url.startsWith(extOrigin)
  }
  return !sender.tab
}
