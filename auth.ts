import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated, getAuthenticatedUsername } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const authed = await isAuthenticated(req)
  if (!authed) return NextResponse.json({ authenticated: false })
  const username = await getAuthenticatedUsername(req)
  return NextResponse.json({ authenticated: true, username })
}
