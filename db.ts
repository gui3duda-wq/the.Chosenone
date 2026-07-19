import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()
  if (!username || !password) {
    return NextResponse.json({ error: 'Usuário e senha obrigatórios' }, { status: 400 })
  }
  const admin = await db.admin.findUnique({ where: { username } })
  if (!admin || !verifyPassword(password, admin.password)) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
  }
  const token = createSessionToken(admin.username)
  const res = NextResponse.json({ success: true, username: admin.username, token })
  // Cookie settings compatible with iframe previews:
  // - sameSite: 'none' + secure: true works in cross-site iframes (gateway terminates HTTPS)
  // - We also set a lax fallback so it works in dev (http) too.
  // Some browsers reject 'none' without secure, so we detect scheme via x-forwarded-proto.
  const forwardedProto = req.headers.get('x-forwarded-proto') || ''
  const isHttps = forwardedProto.includes('https') || req.nextUrl.protocol === 'https:'
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
  return res
}
