import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAuthenticated, getAuthenticatedUsername } from '@/lib/auth'
import { autoBackup } from '../backup/route'
import { logAudit, diffProduct } from '@/lib/audit'

// GET /api/products — public list
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const featured = searchParams.get('featured')

  const where: Record<string, unknown> = {}
  if (category && category !== 'all') where.category = category
  if (featured === 'true') where.featured = true

  const products = await db.product.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ products })
}

// POST /api/products — admin only
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated(req))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const username = await getAuthenticatedUsername(req) || 'admin'
  const body = await req.json()
  const { name, description, price, image, images, sizes, category, featured, inStock } = body
  if (!name || !description || price == null || !image || !sizes) {
    return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
  }
  const product = await db.product.create({
    data: {
      name,
      description,
      price: Number(price),
      image,
      images: Array.isArray(images) ? images.join('|') : (typeof images === 'string' ? images : ''),
      sizes: Array.isArray(sizes) ? sizes.join(',') : sizes,
      category: category || 'Coleção',
      featured: !!featured,
      inStock: inStock !== false,
    },
  })

  // Audit log
  const { summary, details } = diffProduct(null, product as any)
  await logAudit({
    action: 'product_create',
    entity: 'product',
    entityId: product.id,
    summary,
    details,
    adminUser: username,
  })
  await autoBackup()
  return NextResponse.json({ product }, { status: 201 })
}
