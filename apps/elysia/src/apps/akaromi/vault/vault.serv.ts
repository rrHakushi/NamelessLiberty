import { prisma, toDate, type PassCipherType } from '@NamelessLiberty/db'
import { BaseService } from '../../../core/base/base.serv'
import { AkaromiCiphersServ } from '../ciphers/ciphers.serv'

export interface ImportCipherItem {
  type: PassCipherType
  encryptedTitle: string
  encryptedData: string
  favorite?: boolean
}

export interface ImportVaultBody {
  ciphers: ImportCipherItem[]
}

/**
 * Service handling Akaromi vault synchronization, backup export, and cipher import.
 */
export class AkaromiVaultService extends BaseService {
  constructor() {
    super('Akaromi:Vault')
  }

  /**
   * Synchronizes full or incremental vault state for the authenticated user.
   */
  public async syncVault(userId: string, since?: string) {
    // Step 1: Parse optional incremental sync timestamp
    const now = new Date()
    const sinceDate = since ? new Date(since) : null
    const hasValidSince = sinceDate !== null && !isNaN(sinceDate.getTime())

    // Step 2: Query user ciphers modified since the requested cursor
    let query = prisma.orm.public.PassCipher.where({ userId })
    if (hasValidSince && sinceDate) {
      query = query.where((c) => c.updatedAt.gte(sinceDate))
    }

    const rawCiphers = await query
      .orderBy((c) => c.updatedAt.desc())
      .all()

    // Step 3: Partition soft-deleted cipher IDs for client-side trash reconciliation
    const deletedCipherIds = rawCiphers
      .filter((c) => c.deletedAt !== null)
      .map((c) => c.id)

    return {
      success: true,
      serverTime: now.toISOString(),
      ciphers: rawCiphers.map((c) => AkaromiCiphersServ.formatCipher(c)),
      deletedCipherIds,
    }
  }

  /**
   * Exports full non-deleted vault data for backup or client migration.
   */
  public async exportVault(userId: string) {
    // Step 1: Query all active (non-deleted) ciphers ordered chronologically
    const ciphers = await prisma.orm.public.PassCipher
      .where({ userId })
      .where((c) => c.deletedAt.isNull())
      .select('id', 'type', 'favorite', 'encryptedTitle', 'encryptedData', 'createdAt', 'updatedAt')
      .orderBy((c) => c.createdAt.asc())
      .all()

    // Step 2: Serialize cipher records with ISO-8601 timestamps
    return {
      success: true,
      exportedAt: new Date().toISOString(),
      ciphers: ciphers.map((c) => ({
        id: c.id,
        type: c.type as 'LOGIN' | 'SSH_KEY',
        favorite: c.favorite,
        encryptedTitle: c.encryptedTitle,
        encryptedData: c.encryptedData,
        createdAt: toDate(c.createdAt).toISOString(),
        updatedAt: toDate(c.updatedAt).toISOString(),
      })),
    }
  }

  /**
   * Imports ciphers into the user's vault.
   */
  public async importVault(userId: string, body: ImportVaultBody) {
    // Step 1: Validate and persist each non-empty encrypted cipher payload
    let importedCiphersCount = 0
    for (const cipherItem of body.ciphers) {
      if (cipherItem.encryptedTitle?.trim() && cipherItem.encryptedData?.trim()) {
        await prisma.orm.public.PassCipher.create({
          userId,
          type: cipherItem.type,
          encryptedTitle: cipherItem.encryptedTitle,
          encryptedData: cipherItem.encryptedData,
          favorite: cipherItem.favorite ?? false,
        })
        importedCiphersCount++
      }
    }

    // Step 2: Return summary count of imported ciphers
    return {
      success: true,
      importedCiphersCount,
      message: `Successfully imported ${importedCiphersCount} ciphers`,
    }
  }
}

export const akaromiVaultServ = new AkaromiVaultService()

/**
 * Static facade preserving legacy callers.
 */
export abstract class AkaromiVaultServ {
  static async syncVault(userId: string, since?: string) {
    return await akaromiVaultServ.syncVault(userId, since)
  }

  static async exportVault(userId: string) {
    return await akaromiVaultServ.exportVault(userId)
  }

  static async importVault(userId: string, body: ImportVaultBody) {
    return await akaromiVaultServ.importVault(userId, body)
  }
}
