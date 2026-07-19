import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAuthenticated, getAuthenticatedUsername } from '@/lib/auth'
import { autoBackup } from '../backup/route'
import { logAudit, diffSettings } from '@/lib/audit'
import type { SiteSettings } from '@/lib/types'

// GET /api/settings — public
export async function GET() {
  const rows = await db.siteSetting.findMany()
  const settings: Record<string, string> = {}
  for (const r of rows) settings[r.key] = r.value
  return NextResponse.json({ settings })
}

// PUT /api/settings — admin only
export async function PUT(req: NextRequest) {
  if (!(await isAuthenticated(req))) {
    return NextResponse.json({ error: 'Não autorizado. Faça login novamente.' }, { status: 401 })
  }
  const username = await getAuthenticatedUsername(req) || 'admin'
  const body = await req.json()
  const { settings } = body as { settings: Record<string, string> }
  if (!settings || typeof settings !== 'object') {
    return NextResponse.json({ error: 'Formato inválido' }, { status: 400 })
  }

  // Fetch BEFORE state for audit diff
  const beforeRows = await db.siteSetting.findMany()
  const before: SiteSettings = {}
  for (const r of beforeRows) before[r.key] = r.value

  for (const [key, value] of Object.entries(settings)) {
    await db.siteSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    })
  }

  // Audit log with diff
  const { summary, details } = diffSettings(before, settings)
  await logAudit({
    action: 'settings_update',
    entity: 'settings',
    summary,
    details,
    adminUser: username,
  })
  await autoBackup()
  return NextResponse.json({ success: true })
}
