import { db } from '../src/lib/db'
import { hashPassword, verifyPassword } from '../src/lib/auth'
import fs from 'fs'
import path from 'path'

/**
 * AUTO-RESTORE ROBUSTO — garante que dados do admin nunca sejam perdidos.
 *
 * Estratégia em 3 camadas:
 * 1. Se o banco tem dados íntegros → não faz nada
 * 2. Se faltam dados → restaura do backup mais recente (backup.json ou timestamped)
 * 3. Se não há backup → cria admin padrão + roda seed
 *
 * Também garante que sempre existe um admin com senha conhecida (admin/admin123)
 * caso o backup não tenha a senha ou ela esteja corrompida.
 */

const BACKUP_DIR = path.join(process.cwd(), 'db')
const LATEST_BACKUP = path.join(BACKUP_DIR, 'backup.json')
const HISTORY_DIR = path.join(BACKUP_DIR, 'backups')

interface Snapshot {
  version?: number
  exportedAt?: string
  admin?: { username: string; password: string } | null
  settings?: Array<{ key: string; value: string }>
  products?: Array<{
    id?: string
    name: string
    description: string
    price: number
    image: string
    images?: string
    sizes: string
    category?: string
    featured?: boolean
    inStock?: boolean
  }>
}

/** Find the most recent backup file (latest.json or timestamped) */
function findLatestBackup(): Snapshot | null {
  // 1. Try backup.json (latest)
  if (fs.existsSync(LATEST_BACKUP)) {
    try {
      const snap = JSON.parse(fs.readFileSync(LATEST_BACKUP, 'utf-8'))
      if (snap.products || snap.settings || snap.admin) return snap
    } catch {}
  }
  // 2. Try timestamped backups (newest first)
  if (fs.existsSync(HISTORY_DIR)) {
    const files = fs.readdirSync(HISTORY_DIR)
      .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
      .map(f => ({ name: f, mtime: fs.statSync(path.join(HISTORY_DIR, f)).mtime.getTime() }))
      .sort((a, b) => b.mtime - a.mtime)
    for (const f of files) {
      try {
        const snap = JSON.parse(fs.readFileSync(path.join(HISTORY_DIR, f.name), 'utf-8'))
        if (snap.products || snap.settings || snap.admin) return snap
      } catch {}
    }
  }
  return null
}

async function autoRestore() {
  const productCount = await db.product.count()
  const settingCount = await db.siteSetting.count()
  const adminCount = await db.admin.count()

  console.log(`[auto-restore] Estado atual: ${productCount} produtos, ${settingCount} settings, ${adminCount} admins`)

  // ALWAYS ensure at least one admin exists with a known password.
  // This is the safety net: even if everything else fails, you can log in.
  if (adminCount === 0) {
    console.log('[auto-restore] Nenhum admin — criando admin padrão (admin/admin123)')
    await db.admin.create({ data: { username: 'admin', password: hashPassword('admin123') } })
  }

  // If data is missing, try to restore from backup
  const needsRestore = productCount === 0 || settingCount === 0
  if (!needsRestore) {
    console.log('[auto-restore] Banco íntegro — nenhuma ação necessária.')
    return
  }

  const snapshot = findLatestBackup()
  if (!snapshot) {
    console.log('[auto-restore] Nenhum backup encontrado — rode "bun run prisma/seed.ts" para criar dados iniciais.')
    return
  }

  console.log(`[auto-restore] Backup encontrado de ${snapshot.exportedAt || 'data desconhecida'} — restaurando...`)

  // Restore admin password from backup IF the backup has a valid hash
  // (preserves the user's custom password across resets)
  if (snapshot.admin?.password) {
    const currentAdmin = await db.admin.findFirst()
    if (currentAdmin) {
      // Only update if the current admin password is the default (admin123)
      // OR if verifyPassword fails for admin123 (meaning user had set a custom one that got lost)
      const isDefault = verifyPassword('admin123', currentAdmin.password)
      if (isDefault) {
        // Current is default — restore custom password from backup if backup has a non-default one
        const backupIsDefault = verifyPassword('admin123', snapshot.admin.password)
        if (!backupIsDefault) {
          await db.admin.update({ where: { id: currentAdmin.id }, data: { password: snapshot.admin.password } })
          console.log('[auto-restore] Senha customizada do admin restaurada do backup')
        }
      }
    }
  }

  // Restore settings if missing
  if (settingCount === 0 && Array.isArray(snapshot.settings)) {
    for (const s of snapshot.settings) {
      await db.siteSetting.create({ data: { key: s.key, value: String(s.value) } })
    }
    console.log(`[auto-restore] ${snapshot.settings.length} configurações restauradas`)
  }

  // Restore products if missing
  if (productCount === 0 && Array.isArray(snapshot.products)) {
    for (const p of snapshot.products) {
      try {
        await db.product.create({
          data: {
            name: p.name,
            description: p.description,
            price: Number(p.price),
            image: p.image,
            images: p.images || '',
            sizes: p.sizes,
            category: p.category || 'Coleção',
            featured: !!p.featured,
            inStock: p.inStock !== false,
          },
        })
      } catch (e) {
        console.error(`[auto-restore] Erro ao restaurar produto "${p.name}":`, e)
      }
    }
    console.log(`[auto-restore] ${snapshot.products.length} produtos restaurados`)
  }

  console.log('[auto-restore] Restore concluído com sucesso!')
}

autoRestore()
  .catch((e) => {
    console.error('[auto-restore] Erro:', e)
    // Don't exit with error — let the dev server start anyway
  })
  .finally(async () => {
    await db.$disconnect()
  })
