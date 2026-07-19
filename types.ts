import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAuthenticated } from '@/lib/auth'

/**
 * GET /api/analytics — admin only — returns aggregate click analytics.
 *
 * Returns:
 *  - totals: { views, whatsappClicks, conversionRate }
 *  - byProduct: [{ productName, views, whatsappClicks, conversionRate }]
 *  - byDay: [{ date, views, whatsappClicks }] (last 14 days)
 *  - bySize: [{ size, count }] (whatsapp clicks by size)
 *
 * All data is computed live from the ProductClick table, so it always
 * reflects the current state — deleted products still appear in history
 * (we stored productName denormalized), and new products appear immediately.
 */
export async function GET(req: NextRequest) {
  if (!(await isAuthenticated(req))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const now = new Date()
  const fourteenDaysAgo = new Date(now)
  fourteenDaysAgo.setDate(now.getDate() - 14)

  // Fetch all clicks (efficient enough for our scale)
  const allClicks = await db.productClick.findMany({
    select: { productName: true, type: true, size: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  const views = allClicks.filter(c => c.type === 'view')
  const whatsappClicks = allClicks.filter(c => c.type === 'whatsapp')

  // Totals
  const totals = {
    views: views.length,
    whatsappClicks: whatsappClicks.length,
    conversionRate: views.length > 0 ? Math.round((whatsappClicks.length / views.length) * 100) : 0,
  }

  // By product (group by productName)
  const productMap = new Map<string, { views: number; whatsappClicks: number }>()
  for (const c of allClicks) {
    const entry = productMap.get(c.productName) || { views: 0, whatsappClicks: 0 }
    if (c.type === 'view') entry.views++
    else if (c.type === 'whatsapp') entry.whatsappClicks++
    productMap.set(c.productName, entry)
  }
  // Get current product list to flag active vs deleted
  const currentProducts = await db.product.findMany({ select: { name: true } })
  const currentNames = new Set(currentProducts.map(p => p.name))
  const byProduct = Array.from(productMap.entries())
    .map(([name, data]) => ({
      productName: name,
      views: data.views,
      whatsappClicks: data.whatsappClicks,
      conversionRate: data.views > 0 ? Math.round((data.whatsappClicks / data.views) * 100) : 0,
      active: currentNames.has(name), // false if product was deleted
    }))
    .sort((a, b) => (b.views + b.whatsappClicks * 2) - (a.views + a.whatsappClicks * 2)) // weighted sort

  // By day (last 14 days)
  const dayMap = new Map<string, { views: number; whatsappClicks: number }>()
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    const key = d.toISOString().substring(0, 10) // YYYY-MM-DD
    dayMap.set(key, { views: 0, whatsappClicks: 0 })
  }
  for (const c of allClicks) {
    const key = c.createdAt.toISOString().substring(0, 10)
    const entry = dayMap.get(key)
    if (!entry) continue // outside 14-day window
    if (c.type === 'view') entry.views++
    else if (c.type === 'whatsapp') entry.whatsappClicks++
  }
  const byDay = Array.from(dayMap.entries()).map(([date, data]) => ({ date, ...data }))

  // By size (whatsapp clicks)
  const sizeMap = new Map<string, number>()
  for (const c of whatsappClicks) {
    if (!c.size) continue
    sizeMap.set(c.size, (sizeMap.get(c.size) || 0) + 1)
  }
  const bySize = Array.from(sizeMap.entries())
    .map(([size, count]) => ({ size, count }))
    .sort((a, b) => b.count - a.count)

  return NextResponse.json({
    totals,
    byProduct,
    byDay,
    bySize,
    generatedAt: now.toISOString(),
  })
}
