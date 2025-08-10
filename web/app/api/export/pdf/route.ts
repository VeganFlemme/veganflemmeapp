export const runtime = 'nodejs';
import PDFDocument from 'pdfkit'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const { plan } = await req.json()
  const doc = new PDFDocument()
  const chunks: Buffer[] = []
  doc.on('data', (c) => chunks.push(c))
  doc.on('end', () => {})

  doc.fontSize(18).text('VeganFlemme — Semaine')
  ;(plan?.plan || []).forEach((day:any, i:number) => {
    doc.moveDown().fontSize(14).text(`Jour ${i+1}`)
    ;['breakfast','lunch','dinner','snack'].forEach((slot) => {
      const it = day?.[slot]
      if(!it) return
      doc.fontSize(12).text(`• ${slot}: ${it.title || it.recipeId} — ${it.servings || 1} portion(s)`)
    })
  })
  doc.end()
  return new Response(Buffer.concat(chunks), { headers: { 'Content-Type': 'application/pdf' }})
}
