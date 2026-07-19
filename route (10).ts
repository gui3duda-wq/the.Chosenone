import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAuthenticated } from '@/lib/auth'

/**
 * POST /api/backup/restore — admin only — restores all data from a JSON snapshot.
 * Body: { settings: [{key,value}], products: [{...}], admin?: {username,password} }
 */
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated(req))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const body = await req.json()
  const { settings, products, admin } = body

  // Restore settings (upsert — preserves keys, updates values)
  if (Array.isArray(settings)) {
    for (const s of settings) {
      await db.siteSetting.upsert({
        where: { key: s.key },
        update: { value: String(s.value) },
        create: { key: s.key, value: String(s.value) },
      })
    }
  }

  // Restore products (delete all, then recreate from snapshot)
  if (Array.isArray(products)) {
    await db.product.deleteMany({})
    for (const p of products) {
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
    }
  }

  // Restore admin password (only if provided)
  if (admin && admin.username && admin.password) {
    const existing = await db.admin.findUnique({ where: { username: admin.username } })
    if (existing) {
      await db.admin.update({ where: { username: admin.username }, data: { password: admin.password } })
    }
  }

  return NextResponse.json({ success: true, message: 'Dados restaurados do backup.' })
}
