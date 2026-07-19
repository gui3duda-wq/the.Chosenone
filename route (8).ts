import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAuthenticated } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

/**
 * GET /api/backup — admin only — returns all data as JSON for download.
 */

const BACKUP_DIR = path.join(process.cwd(), 'db')

/**
 * Auto-save a timestamped backup snapshot to disk.
 * Called from settings/products/password APIs on every save.
 * Keeps the latest snapshot as backup.json (for auto-restore) plus
 * a timestamped copy (db/backups/YYYY-MM-DD-HHMMSS.json) for history.
 */
export async function autoBackup() {
  try {
    const [products, settings, admin] = await Promise.all([
      db.product.findMany(),
      db.siteSetting.findMany(),
      db.admin.findFirst(),
    ])
    const snapshot = {
      version: 2,
      exportedAt: new Date().toISOString(),
      admin: admin ? { username: admin.username, password: admin.password } : null,
      settings: settings.map(s => ({ key: s.key, value: s.value })),
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        image: p.image,
        images: p.images,
        sizes: p.sizes,
        category: p.category,
        featured: p.featured,
        inStock: p.inStock,
      })),
    }
    const json = JSON.stringify(snapshot, null, 2)

    // 1. Latest backup (always overwritten) — used by auto-restore
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true })
    fs.writeFileSync(path.join(BACKUP_DIR, 'backup.json'), json)

    // 2. Timestamped backup (history) — keep last 20 snapshots
    const historyDir = path.join(BACKUP_DIR, 'backups')
    if (!fs.existsSync(historyDir)) fs.mkdirSync(historyDir, { recursive: true })
    const ts = new Date().toISOString().replace(/[:.]/g, '-')
    fs.writeFileSync(path.join(historyDir, `backup-${ts}.json`), json)

    // Cleanup: keep only the 20 most recent timestamped backups
    const files = fs.readdirSync(historyDir)
      .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
      .map(f => ({ name: f, mtime: fs.statSync(path.join(historyDir, f)).mtime.getTime() }))
      .sort((a, b) => b.mtime - a.mtime)
    for (const f of files.slice(20)) {
      try { fs.unlinkSync(path.join(historyDir, f.name)) } catch {}
    }

    return true
  } catch (e) {
    console.error('[auto-backup] Failed:', e)
    return false
  }
}

export async function GET(req: NextRequest) {
  if (!(await isAuthenticated(req))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const [products, settings] = await Promise.all([
    db.product.findMany(),
    db.siteSetting.findMany(),
  ])
  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    products,
    settings: settings.map(s => ({ key: s.key, value: s.value })),
  })
}
