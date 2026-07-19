import { db } from '../src/lib/db'
import { hashPassword } from '../src/lib/auth'
import fs from 'fs'
import path from 'path'

/**
 * SEED SEGURO — só cria dados se não existirem. NUNCA sobrescreve.
 * Este script é seguro para rodar a qualquer momento — ele preserva
 * todas as alterações feitas pelo admin.
 */
async function seed() {
  console.log('Verificando dados (seed seguro — não sobrescreve nada)...')

  // --- Admin: só cria se não existir ---
  const adminCount = await db.admin.count()
  if (adminCount === 0) {
    await db.admin.create({
      data: { username: 'admin', password: hashPassword('admin123') },
    })
    console.log('Admin criado (admin / admin123)')
  } else {
    console.log(`Admin já existe (${adminCount}) — senha preservada`)
  }

  // --- Settings: só cria se a chave não existir (NUNCA sobrescreve) ---
  const existingSettings = await db.siteSetting.count()
  if (existingSettings === 0) {
    const settings = [
      { key: 'storeName', value: 'CHOSEN ONE' },
      { key: 'storeTagline', value: 'O escolhido não erra. Apenas decide.' },
      { key: 'heroTitle', value: 'SEJA O\nESCOLHIDO.' },
      { key: 'heroSubtitle', value: 'Streetwear para quem não pede licença. Cada peça é uma declaração. O resto é barulho.' },
      { key: 'heroBadge', value: 'COLEÇÃO 01 — DESTINO' },
      { key: 'whatsappNumber', value: '5511999999999' },
      { key: 'whatsappMessage', value: 'Olá! Tenho interesse na peça {product} (Tam: {size}) — valor R$ {price}. Quero finalizar a compra.' },
      { key: 'contactEmail', value: 'contato@chosenone.com.br' },
      { key: 'contactInstagram', value: '@chosenone' },
      { key: 'footerText', value: 'CHOSEN ONE — Nascemos para ser escolhidos, não para ser mais um.' },
      { key: 'logoImage', value: '/uploads/co-logo-red.png' },
      { key: 'marqueeText', value: 'CHOSEN ONE • O ESCOLHIDO NÃO ERRA • VOCÊ DECIDE QUANDO TERMINA • UM PASSO DE CADA VEZ • NÃO NASCEMOS PARA SER MAIS UM •' },
    ]
    for (const s of settings) {
      await db.siteSetting.create({ data: s })
    }
    console.log(`${settings.length} configurações criadas`)
  } else {
    console.log(`${existingSettings} configurações já existem — preservadas`)
  }

  // --- Products: só cria se a tabela estiver vazia (NUNCA deleta) ---
  const productCount = await db.product.count()
  if (productCount === 0) {
    const products = [
      { name: 'Logo Oval — Branco', description: 'Camiseta branca com a logo CHOSEN ONE em badge oval azul metálico com estrelas. A peça identidade da marca.', price: 189.9, image: '/uploads/co-tee-01-logo-oval-branco.png', images: '', sizes: 'P,M,G,GG,XG', category: 'Identidade', featured: true, inStock: true },
      { name: 'Escolhido Não Erra', description: 'Camiseta branca com "ESCOLHIDO NÃO ERRA" em preto sobre ilustração editorial. Declaração de atitude.', price: 199.9, image: '/uploads/co-tee-02-escolhido-nao-erra.png', images: '', sizes: 'P,M,G,GG,XG', category: 'Manifesto', featured: true, inStock: true },
      { name: 'You Decide When It Ends — Branco', description: 'Camiseta branca com corrente de rosário na frente e "YOU DECIDE WHEN IT ENDS" nas costas.', price: 209.9, image: '/uploads/co-tee-03-you-decide-branco.png', images: '/uploads/co-tee-06-you-decide-preto.png', sizes: 'P,M,G,GG', category: 'Destino', featured: true, inStock: true },
      { name: 'Horsepower Engine', description: 'Camiseta branca com ilustração de motor com supercharger na frente e silhueta de carro esportivo nas costas.', price: 219.9, image: '/uploads/co-tee-04-horsepower-engine.png', images: '', sizes: 'P,M,G,GG', category: 'Round', featured: false, inStock: true },
      { name: 'You Chose What You Want — Preto', description: 'Camiseta preta com "YOU CHOSEN WHAT YOU WANT" em gradiente laranja-amarelo e slot machine nas costas.', price: 199.9, image: '/uploads/co-tee-05-you-chose-preto.png', images: '/uploads/co-tee-07-you-chose-branco.png', sizes: 'P,M,G,GG,XG', category: 'Destino', featured: true, inStock: true },
      { name: 'You Decide When It Ends — Preto', description: 'Camiseta preta com corrente de rosário prateada na frente e "YOU DECIDE WHEN IT ENDS" em branco nas costas.', price: 209.9, image: '/uploads/co-tee-06-you-decide-preto.png', images: '/uploads/co-tee-03-you-decide-branco.png', sizes: 'P,M,G,GG,XG', category: 'Destino', featured: false, inStock: true },
      { name: 'You Chose What You Want — Branco', description: 'Camiseta branca com "YOU CHOSEN WHAT YOU WANT" em gradiente azul e slot machine nas costas.', price: 199.9, image: '/uploads/co-tee-07-you-chose-branco.png', images: '/uploads/co-tee-05-you-chose-preto.png', sizes: 'P,M,G,GG', category: 'Destino', featured: true, inStock: true },
      { name: 'One Round At A Time', description: 'Camiseta preta com boxeador x-ray na frente e "ONE STEP / ONE PUNCH / ONE ROUND AT A TIME" nas costas.', price: 219.9, image: '/uploads/co-tee-08-one-round-at-a-time.png', images: '', sizes: 'P,M,G,GG', category: 'Round', featured: false, inStock: true },
      { name: 'Never Again', description: 'Camiseta off-white com "Never The Again" em cursiva, silhueta com "NEVER AGAIN" e logo nas costas.', price: 229.9, image: '/uploads/co-tee-09-never-again.png', images: '', sizes: 'P,M,G,GG', category: 'Editorial', featured: false, inStock: true },
      { name: 'Dog Tags', description: 'Camiseta branca com placas de identificação militar (dog tags) em azul metálico penduradas em correntes.', price: 209.9, image: '/uploads/co-tee-10-dog-tags.png', images: '', sizes: 'P,M,G,GG', category: 'Identidade', featured: false, inStock: true },
      { name: 'Chosen One — Characters', description: 'Camiseta branca com "Chosen One" em cursiva e fileira de personagens coloridos. A peça mais ousada.', price: 219.9, image: '/uploads/co-tee-11-characters.png', images: '', sizes: 'P,M,G,GG', category: 'Editorial', featured: false, inStock: true },
      { name: 'Chosen One — Cars', description: 'Camiseta branca com "Chosen One" em cursiva e 9 carros coloridos em grade 3x3.', price: 219.9, image: '/uploads/co-tee-12-cars.png', images: '', sizes: 'P,M,G,GG', category: 'Round', featured: false, inStock: true },
      { name: 'Chosen One — Muse', description: 'Camiseta branca com "Chosen One" repetido em caligrafia e silhueta feminina. Estética urbana sofisticada.', price: 229.9, image: '/uploads/co-tee-13-muse.png', images: '', sizes: 'P,M,G,GG', category: 'Editorial', featured: true, inStock: true },
      { name: 'Chosen One — Portrait', description: 'Camiseta branca com "Chosen One" em cursiva vertical e retrato de homem com óculos vermelhos e arma.', price: 239.9, image: '/uploads/co-tee-14-portrait.png', images: '', sizes: 'P,M,G,GG', category: 'Editorial', featured: false, inStock: true },
      { name: 'Horse & Car', description: 'Camiseta branca com ilustração monocromática de carro clássico com estrela e cavalo em pose saltitante.', price: 209.9, image: '/uploads/co-tee-15-horse-and-car.png', images: '', sizes: 'P,M,G,GG', category: 'Round', featured: false, inStock: true },
    ]
    for (const p of products) {
      await db.product.create({ data: p })
    }
    console.log(`${products.length} produtos criados`)
  } else {
    console.log(`${productCount} produtos já existem — preservados`)
  }

  console.log('Verificação concluída — nenhum dado foi sobrescrito.')
}

seed()
  .catch((e) => {
    console.error('Erro:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
