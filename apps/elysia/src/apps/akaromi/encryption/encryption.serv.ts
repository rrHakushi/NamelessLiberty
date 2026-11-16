import { prisma } from '@NamelessLiberty/db'
import { BaseService } from '../../../core/base/base.serv'
import { NotFound } from '../../../core/errors/http-errors'

/**
 * Service managing user post-quantum encryption keys and cryptographic salts for Akaromi.
 */
export class AkaromiEncryptionService extends BaseService {
  constructor() {
    super('Akaromi:Encryption')
  }

  /**
   * Retrieves the authenticated user's post-quantum encryption keys and cryptographic salt.
   */
  public async getEncryptionKeys(userId: string) {
    // Step 1: Fetch user key material and password hash fallback from PostgreSQL
    const user = await prisma.orm.public.User
      .select('id', 'publicKey', 'encryptedPrivateKey', 'passwordHash')
      .first({ id: userId })

    if (!user) {
      throw new NotFound('User not found.')
    }

    // Step 2: Extract salt prefix from encryptedPrivateKey or fall back to passwordHash salt
    let salt: string | null = null
    if (user.encryptedPrivateKey && user.encryptedPrivateKey.includes(':')) {
      salt = user.encryptedPrivateKey.split(':')[0] || null
    } else if (user.passwordHash && user.passwordHash.includes(':')) {
      salt = user.passwordHash.split(':')[0] || null
    }

    // Step 3: Return public/encrypted key metadata without exposing sensitive server secrets
    return {
      success: true,
      userId: user.id,
      publicKey: user.publicKey ?? null,
      encryptedPrivateKey: user.encryptedPrivateKey ?? null,
      salt,
      hasEncryptionKeys: Boolean(user.publicKey && user.encryptedPrivateKey),
    }
  }
}

export const akaromiEncryptionServ = new AkaromiEncryptionService()

/**
 * Static facade preserving legacy callers.
 */
export abstract class AkaromiEncryptionServ {
  static async getEncryptionKeys(userId: string) {
    return await akaromiEncryptionServ.getEncryptionKeys(userId)
  }
}
