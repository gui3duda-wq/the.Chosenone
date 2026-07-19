import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAuthenticated, getAuthenticatedUsername } from '@/lib/auth'
import { autoBackup } from '../../backup/route'
import { logAudit, diffProduct } from '@/lib/audit'
import type { Product } from '@/lib/types'

// GET /api/products/[id] — public
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await db.product.findUnique({ where: { id } })
  if (!product) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
  return NextResponse.json({ product })
}

// PUT /api/products/[id] — admin only
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated(req))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const username = await getAuthenticatedUsername(req) || 'admin'
  const { id } = await params
  const body = await req.json()
  const { name, description, price, image, images, sizes, category, featured, inStock } = body

  // Fetch BEFORE state for audit diff
  const before = await db.product.findUnique({ where: { id } }) as Product | null
  if (!before) {
    return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
  }

  const data: Record<string, unknown> = {}
  if (name !== undefined) data.name = name
  if (description !== undefined) data.description = description
  if (price !== undefined) data.price = Number(price)
  if (image !== undefined) data.image = image
  if (images !== undefined) data.images = Array.isArray(images) ? images.join('|') : (typeof images === 'string' ? images : '')
  if (sizes !== undefined) data.sizes = Array.isArray(sizes) ? sizes.join(',') : sizes
  if (category !== undefined) data.category = category
  if (featured !== undefined) data.featured = !!featured
  if (inStock !== undefined) data.inStock = !!inStock

  const product = await db.product.update({ where: { id }, data })

  // Audit log with diff (before vs after)
  const afterData = { ...before, ...data } as Partial<Product>
  const { summary, details } = diffProduct(before, afterData)
  await logAudit({
    action: 'product_update',
    entity: 'product',
    entityId: id,
    summary,
    details,
    adminUser: username,
  })
  await autoBackup()
  return NextResponse.json({ product })
}

// DELETE /api/products/[id] — admin only
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated(req))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const username = await getAuthenticatedUsername(req) || 'admin'
  const { id } = await params

  // Fetch before delete for audit
  const before = await db.product.findUnique({ where: { id } }) as Product | null
  if (!before) {
    return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
  }

  await db.product.delete({ where: { id } })

  await logAudit({
    action: 'product_delete',
    entity: 'product',
    entityId: id,
    summary: `Produto excluído: "${before.name}" — ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(before.price)}`,
    details: { deleted: { name: before.name, price: before.price, category: before.category } },
    adminUser: username,
  })
  await autoBackup()
  return NextResponse.json({ success: true })
}
