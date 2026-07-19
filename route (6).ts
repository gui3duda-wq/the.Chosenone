import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/click — public — registers a click on a product.
 * Body: { productId, productName, type: "view" | "whatsapp", size? }
 *
 * - "view": customer opened the product modal
 * - "whatsapp": customer clicked "Comprar no WhatsApp"
 *
 * Clicks survive product deletion (we store productName denormalized)
 * so the analytics always reflect the full history.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { productId, productName, type, size } = body

    if (!type || !['view', 'whatsapp'].includes(type)) {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
    }
    if (!productName) {
      return NextResponse.json({ error: 'Nome do produto obrigatório' }, { status: 400 })
    }

    await db.productClick.create({
      data: {
        productId: productId || null,
        productName: String(productName),
        type,
        size: size || null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[click] Error:', e)
    return NextResponse.json({ error: 'Erro ao registrar clique' }, { status: 500 })
  }
}
