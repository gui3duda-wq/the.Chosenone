/**
 * Build a wa.me deep link with a pre-filled message for a product purchase.
 * The message includes product name, size, price AND a link to view the product image
 * (so the seller can see which piece the customer is interested in).
 */
export function buildWhatsAppLink(
  whatsappNumber: string,
  messageTemplate: string,
  product: { name: string; price: number },
  size?: string,
  imageUrl?: string
): string {
  const priceFormatted = product.price.toFixed(2).replace(/\./, ',')
  // Build base message from template
  let msg = messageTemplate
    .replace(/\{product\}/g, product.name)
    .replace(/\{size\}/g, size || '-')
    .replace(/\{price\}/g, priceFormatted)

  // Append image link so the seller can quickly identify the piece
  // (wa.me doesn't support image attachments, but a link works)
  if (imageUrl) {
    // Convert relative URL to absolute (so it works in WhatsApp)
    let fullUrl = imageUrl
    if (typeof window !== 'undefined' && imageUrl.startsWith('/')) {
      fullUrl = window.location.origin + imageUrl
    } else if (imageUrl.startsWith('data:')) {
      // base64 image — too long for a message, skip the link
      fullUrl = ''
    }
    if (fullUrl && !imageUrl.startsWith('data:')) {
      msg = msg + '\n\n📷 Ver a peça: ' + fullUrl
    }
  }

  const cleanNumber = whatsappNumber.replace(/\D/g, '')
  return 'https://wa.me/' + cleanNumber + '?text=' + encodeURIComponent(msg)
}
