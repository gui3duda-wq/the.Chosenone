import { db } from './db'
import crypto from 'crypto'

const SESSION_SECRET = process.env.SESSION_SECRET || 'apex-store-secret-change-me-in-production'
const SESSION_COOKIE = 'apex_admin_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days in seconds

// --- Password hashing (scrypt) ---
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const verify = crypto.scryptSync(password, salt, 64).toString('hex')
  // timingSafeEqual requires equal-length buffers
  const hashBuf = Buffer.from(hash, 'hex')
  const verifyBuf = Buffer.from(verify, 'hex')
  if (hashBuf.length !== verifyBuf.length) return false
  return crypto.timingSafeEqual(hashBuf, verifyBuf)
}

// --- Session token (HMAC signed) ---
export function createSessionToken(username: string): string {
  const payload = {
    username,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  }
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url')
  return `${data}.${sig}`
}

export function verifySessionToken(token: string): { username: string; exp: number } | null {
  try {
    const [data, sig] = token.split('.')
    if (!data || !sig) return null
    const expected = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url')
    // timingSafeEqual requires equal-length buffers; compare safely
    const sigBuf = Buffer.from(sig)
    const expectedBuf = Buffer.from(expected)
    if (sigBuf.length !== expectedBuf.length) return null
    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString())
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE
export const SESSION_MAX_AGE_SECONDS = SESSION_MAX_AGE

// --- Auth helpers for API routes ---
import type { NextRequest } from 'next/server'

/**
 * Extract session token from request — checks cookie first, then Authorization header.
 * The header fallback is essential for iframe previews where sameSite cookies may be blocked.
 */
function extractToken(req: NextRequest): string | null {
  // 1. Cookie
  const cookieToken = req.cookies.get(SESSION_COOKIE)?.value
  if (cookieToken) return cookieToken
  // 2. Authorization header (Bearer token) — client-side fallback
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return null
}

export async function isAuthenticated(req: NextRequest): Promise<boolean> {
  const token = extractToken(req)
  if (!token) return false
  const payload = verifySessionToken(token)
  if (!payload) return false
  const admin = await db.admin.findUnique({ where: { username: payload.username } })
  return !!admin
}

export async function getAuthenticatedUsername(req: NextRequest): Promise<string | null> {
  const token = extractToken(req)
  if (!token) return null
  const payload = verifySessionToken(token)
  if (!payload) return null
  return payload.username
}
