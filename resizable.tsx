import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'

// Resolve a writable database path. In production (serverless/container),
// the cwd may be read-only, so we try multiple locations.
function resolveDbPath(): string {
  const candidates = [
    process.env.DATABASE_URL,
    path.join(process.cwd(), 'db', 'custom.db'),
    '/tmp/custom.db',
    '/app/db/custom.db',
  ].filter(Boolean) as string[]

  for (const c of candidates) {
    if (c.startsWith('file:')) {
      const p = c.replace('file:', '')
      const dir = path.dirname(p)
      try {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
        // Test write access
        fs.accessSync(dir, fs.constants.W_OK)
        return c
      } catch {
        continue
      }
    }
  }
  // Fallback to /tmp which is always writable
  return 'file:/tmp/custom.db'
}

const dbUrl = process.env.DATABASE_URL || resolveDbPath()
process.env.DATABASE_URL = dbUrl

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: dbUrl } },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
