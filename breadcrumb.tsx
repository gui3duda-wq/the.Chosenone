import { db } from './db'
import type { Product, SiteSettings } from './types'

export type AuditAction =
  | 'product_create'
  | 'product_update'
  | 'product_delete'
  | 'settings_update'
  | 'password_change'

export type AuditEntity = 'product' | 'settings' | 'auth'

interface AuditEntry {
  action: AuditAction
  entity: AuditEntity
  entityId?: string
  summary: string
  details?: Record<string, unknown>
  adminUser: string
}

/**
 * Records an audit log entry. Non-blocking — failures are logged but don't break the request.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId || null,
        summary: entry.summary,
        details: JSON.stringify(entry.details || {}),
        adminUser: entry.adminUser,
      },
    })
  } catch (e) {
    console.error('[audit] Failed to log:', e)
  }
}

// --- Helpers to build human-readable summaries + diff details ---

const fmt = (n: number) => `R$ ${n.toFixed(2).replace('.', ',')}`

export function diffProduct(before: Product | null, after: Partial<Product>): { summary: string; details: Record<string, unknown> } {
  const changes: string[] = []
  const details: Record<string, { from: unknown; to: unknown }> = {}

  if (!before) {
    return {
      summary: `Produto criado: "${after.name}" — ${fmt(after.price || 0)}`,
      details: { created: after },
    }
  }

  const fields: Array<{ key: keyof Product; label: string; format?: (v: unknown) => string }> = [
    { key: 'name', label: 'Nome' },
    { key: 'price', label: 'Preço', format: (v) => fmt(Number(v)) },
    { key: 'description', label: 'Descrição' },
    { key: 'category', label: 'Categoria' },
    { key: 'sizes', label: 'Tamanhos' },
    { key: 'image', label: 'Imagem principal' },
    { key: 'images', label: 'Imagens adicionais' },
    { key: 'featured', label: 'Destaque' },
    { key: 'inStock', label: 'Em estoque' },
  ]

  for (const f of fields) {
    const oldVal = before[f.key]
    const newVal = after[f.key]
    if (newVal === undefined) continue
    if (oldVal === newVal) continue
    // For image fields, just note "alterada" instead of dumping base64
    if (f.key === 'image' || f.key === 'images') {
      changes.push(`${f.label} alterada`)
      details[f.key] = { from: '[imagem anterior]', to: '[nova imagem]' }
    } else {
      const from = f.format ? f.format(oldVal) : String(oldVal)
      const to = f.format ? f.format(newVal) : String(newVal)
      changes.push(`${f.label}: ${from} → ${to}`)
      details[f.key] = { from: oldVal, to: newVal }
    }
  }

  return {
    summary: changes.length ? `Produto "${after.name || before.name}" — ${changes.join('; ')}` : `Produto "${before.name}" — sem alterações detectadas`,
    details,
  }
}

export function diffSettings(before: SiteSettings, after: Record<string, string>): { summary: string; details: Record<string, unknown> } {
  const changes: string[] = []
  const details: Record<string, { from: string; to: string }> = {}

  for (const [key, newVal] of Object.entries(after)) {
    const oldVal = before[key] || ''
    if (oldVal === newVal) continue
    // mask sensitive keys
    const displayKey = key
    let fromDisplay = oldVal
    let toDisplay = newVal
    if (key.toLowerCase().includes('password') || key.toLowerCase().includes('whatsappmessage')) {
      // don't dump full message templates in summary, keep short
      fromDisplay = oldVal.length > 40 ? oldVal.substring(0, 40) + '…' : oldVal
      toDisplay = newVal.length > 40 ? newVal.substring(0, 40) + '…' : newVal
    }
    changes.push(`${displayKey}: "${fromDisplay}" → "${toDisplay}"`)
    details[displayKey] = { from: oldVal, to: newVal }
  }

  return {
    summary: changes.length ? `Configurações atualizadas — ${changes.join('; ')}` : 'Configurações salvas (sem alterações)',
    details,
  }
}
