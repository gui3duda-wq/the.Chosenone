import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAuthenticated, getAuthenticatedUsername } from '@/lib/auth'

/**
 * GET /api/audit — admin only — returns audit log entries.
 * Query params:
 *   - limit (default 100, max 500)
 *   - entity (filter: product | settings | auth)
 *   - action (filter: product_create | product_update | product_delete | settings_update | password_change)
 */
export async function GET(req: NextRequest) {
  if (!(await isAuthenticated(req))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const _user = await getAuthenticatedUsername(req)

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500)
  const entity = searchParams.get('entity')
  const action = searchParams.get('action')

  const where: Record<string, unknown> = {}
  if (entity) where.entity = entity
  if (action) where.action = action

  const logs = await db.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  // Parse details JSON for convenience
  const parsed = logs.map((l) => ({
    ...l,
    details: (() => {
      try { return JSON.parse(l.details) } catch { return {} }
    })(),
  }))

  return NextResponse.json({ logs: parsed, total: logs.length })
}
