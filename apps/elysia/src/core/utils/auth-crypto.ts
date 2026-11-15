import {
  createCipheriv,
  createDecipheriv,
  createHash,
  generateKeyPairSync,
  hkdfSync,
  randomBytes,
  scrypt,
  timingSafeEqual,
} from "node:crypto"
import { promisify } from "node:util"
import { SignJWT } from "jose"

const scryptAsync = promisify(scrypt)

/**
 * Standard password hashing utilizing native Bun Argon2id.
 */
export async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password, {
    algorithm: "argon2id",
    memoryCost: 65536,
    timeCost: 2,
  })
}

/**
 * Hashes an API key using SHA-256 for secure database persistence and lookup.
 */
export function hashApiKey(apiKey: string): string {
  return createHash("sha256").update(apiKey.trim()).digest("hex")
}

/**
 * Generates an array of 10 cryptographic backup recovery codes and their hashes.
 */
export async function generateBackupCodes(): Promise<{
  plain: string[]
  hashed: string[]
}> {
  const plain: string[] = []
  const hashed: string[] = []
  const CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"

  for (let i = 0; i < 10; i++) {
    const bytes = randomBytes(16)
    let code = ""
    for (let b = 0; b < 16; b++) {
      code += CHARS[bytes[b]! % CHARS.length]
    }
    const formatted = `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}-${code.slice(12, 16)}`
    plain.push(formatted)
    hashed.push(await hashPassword(formatted))
  }

  return { plain, hashed }
}

/**
 * Verifies an entered backup code against an array of hashed backup codes.
 * Returns the index of the matched code in `storedHashes`, or -1 if invalid.
 */
export async function verifyBackupCode(
  inputCode: string,
  storedHashes: readonly string[]
): Promise<number> {
  const cleanCode = inputCode.trim().toUpperCase()
  const cleanNoDash = cleanCode.replaceAll("-", "")
  const reconstructedDash =
    cleanNoDash.length === 16
      ? `${cleanNoDash.slice(0, 4)}-${cleanNoDash.slice(4, 8)}-${cleanNoDash.slice(8, 12)}-${cleanNoDash.slice(12, 16)}`
      : cleanCode

  for (let i = 0; i < storedHashes.length; i++) {
    const storedHash = storedHashes[i]
    if (!storedHash) continue

    if (
      (await verifyPassword(cleanCode, storedHash)) ||
      (await verifyPassword(cleanNoDash, storedHash)) ||
      (await verifyPassword(reconstructedDash, storedHash))
    ) {
      return i
    }
  }

  return -1
}

/**
 * Derives a legacy v1 256-bit encryption key strictly from `JWT_SECRET` (kept for decrypting existing rows).
 */
function getLegacyEncryptionKey(): Buffer {
  const secret = Bun.env.JWT_SECRET
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required")
  }
  return createHash("sha256").update(secret).digest()
}

/**
 * Derives a domain-separated 256-bit encryption key using HKDF-SHA256 from `JWT_SECRET`.
 */
function getHkdfEncryptionKey(): Buffer {
  const secret = Bun.env.JWT_SECRET
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required")
  }
  return Buffer.from(
    hkdfSync("sha256", Buffer.from(secret, "utf8"), "iris-auth-crypto-salt-v2", "iris-totp-secret-v2", 32)
  )
}

/**
 * Encrypts sensitive credentials (such as TOTP base32 secrets) using AES-256-GCM with HKDF key separation (`enc:v2:`).
 */
export function encryptSecret(plaintext: string): string {
  // Step 1: Derive domain-separated 256-bit key and generate 96-bit random IV
  const key = getHkdfEncryptionKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key, iv)

  // Step 2: Encrypt UTF-8 plaintext and attach authentication tag
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()

  return `enc:v2:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`
}

/**
 * Decrypts data encrypted with `encryptSecret` (supports both `enc:v2:` HKDF and legacy v1 `iv:tag:ct`).
 */
export function decryptSecret(serialized: string): string {
  // Step 1: Handle versioned HKDF v2 payloads strictly (fail closed on tampering)
  if (serialized.startsWith("enc:v2:")) {
    const parts = serialized.slice(7).split(":")
    if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
      throw new Error("Malformed encrypted v2 secret payload")
    }
    const [ivHex, authTagHex, encryptedHex] = parts as [string, string, string]
    const decipher = createDecipheriv(
      "aes-256-gcm",
      getHkdfEncryptionKey(),
      Buffer.from(ivHex, "hex")
    )
    decipher.setAuthTag(Buffer.from(authTagHex, "hex"))
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedHex, "hex")),
      decipher.final(),
    ]).toString("utf8")
  }

  // Step 2: Fall back to legacy v1 format (iv:tag:ct) or unencrypted legacy base32 secrets
  if (!serialized.includes(":")) {
    return serialized
  }

  const [ivHex, authTagHex, encryptedHex] = serialized.split(":")
  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error("Malformed legacy encrypted secret payload")
  }

  const key = getLegacyEncryptionKey()
  const iv = Buffer.from(ivHex, "hex")
  const authTag = Buffer.from(authTagHex, "hex")
  const encrypted = Buffer.from(encryptedHex, "hex")

  const decipher = createDecipheriv("aes-256-gcm", key, iv)
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ])

  return decrypted.toString("utf8")
}



/**
 * Password verification utilizing native Bun.password.
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  if (!password || !storedHash) {
    return false
  }

  try {
    return await Bun.password.verify(password, storedHash)
  } catch {
    return false
  }
}

export interface UserSessionTokenData {
  id: string
  username: string
  email: string | null
  passwordChangedAt?: Date | null
  permissions?: number[]
}

/**
 * Signs a standard JWT session token using HS256.
 */
export async function signUserJwt(user: UserSessionTokenData): Promise<string> {
  const secret = Bun.env.JWT_SECRET
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required")
  }

  const pwdChangedSeconds = user.passwordChangedAt
    ? Math.floor(user.passwordChangedAt.getTime() / 1000)
    : null

  const secretKey = new TextEncoder().encode(secret)
  const now = Math.floor(Date.now() / 1000)

  return await new SignJWT({
    id: user.id,
    username: user.username,
    email: user.email ?? "",
    passwordChangedAt: pwdChangedSeconds,
    permissions: user.permissions ?? [],
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime("365d")
    .sign(secretKey)
}

/**
 * Encrypts a private key using AES-256-GCM with a key derived
 * from the user's password via scrypt.
 */
export async function encryptPrivateKey(
  secretKey: Uint8Array | Buffer | string,
  password: string
): Promise<string> {
  const salt = randomBytes(16)
  const key = (await scryptAsync(password, salt, 32)) as Buffer
  const iv = randomBytes(12)

  const cipher = createCipheriv("aes-256-gcm", key, iv)
  const secretBuffer =
    typeof secretKey === "string"
      ? Buffer.from(secretKey, "utf8")
      : Buffer.from(secretKey)
  const encrypted = Buffer.concat([
    cipher.update(secretBuffer),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()

  return `${salt.toString("hex")}:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`
}

/**
 * Decrypts a private key previously encrypted with `encryptPrivateKey`.
 */
export async function decryptPrivateKey(
  encryptedPayload: string,
  password: string
): Promise<string> {
  const [saltHex, ivHex, authTagHex, encryptedHex] = encryptedPayload.split(":")
  if (!saltHex || !ivHex || !authTagHex || !encryptedHex) {
    throw new Error("Invalid encrypted private key format.")
  }

  const salt = Buffer.from(saltHex, "hex")
  const iv = Buffer.from(ivHex, "hex")
  const authTag = Buffer.from(authTagHex, "hex")
  const encrypted = Buffer.from(encryptedHex, "hex")

  const key = (await scryptAsync(password, salt, 32)) as Buffer
  const decipher = createDecipheriv("aes-256-gcm", key, iv)
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ])

  return decrypted.toString("utf8")
}

/**
 * Generates a standard RSA-OAEP 2048-bit keypair and encrypts
 * the private key with the user's password using AES-256-GCM.
 */
export async function generateUserKeypair(
  password: string
): Promise<{ publicKey: string; encryptedPrivateKey: string }> {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  })

  const encryptedPrivateKey = await encryptPrivateKey(privateKey, password)

  return {
    publicKey,
    encryptedPrivateKey,
  }
}
