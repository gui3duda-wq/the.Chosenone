import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAuthenticated, getAuthenticatedUsername, hashPassword, verifyPassword } from '@/lib/auth'
import { autoBackup } from '../../backup/route'
import { logAudit } from '@/lib/audit'

// POST /api/auth/change-password — authenticated admin changes own password
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated(req))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const username = await getAuthenticatedUsername(req)
  if (!username) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { currentPassword, newPassword } = await req.json()
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Senha atual e nova senha são obrigatórias' }, { status: 400 })
  }
  if (typeof newPassword !== 'string' || newPassword.length < 6) {
    return NextResponse.json({ error: 'A nova senha deve ter ao menos 6 caracteres' }, { status: 400 })
  }

  const admin = await db.admin.findUnique({ where: { username } })
  if (!admin || !verifyPassword(currentPassword, admin.password)) {
    return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 403 })
  }

  await db.admin.update({
    where: { username },
    data: { password: hashPassword(newPassword) },
  })

  // Audit log (don't store the password itself)
  await logAudit({
    action: 'password_change',
    entity: 'auth',
    summary: `Senha alterada pelo usuário "${username}"`,
    details: { username, changedAt: new Date().toISOString() },
    adminUser: username,
  })
  await autoBackup()

  return NextResponse.json({ success: true })
}
