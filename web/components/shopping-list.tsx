"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ShoppingItem {
  name: string
  quantity: string
  category: string
  unit: string
  originalQuantity?: string
  multiplier?: string
}

interface ShoppingListProps {
  plan: any[]
  className?: string
}

export function ShoppingList({ plan, className = "" }: ShoppingListProps) {
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  const generateShoppingList = async () => {
    if (!plan || plan.length === 0) {
      setError('Aucun plan disponible pour générer la liste de courses')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/shopping-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
      })

      const data = await response.json()

      if (!data.ok) {
        throw new Error(data.error || 'Erreur lors de la génération')
      }

      setShoppingList(data.shoppingList || [])
      setIsVisible(true)

    } catch (err: any) {
      setError(err.message)
      setShoppingList([])
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = async () => {
    if (shoppingList.length === 0) return

    try {
      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'shopping-list',
          data: { shoppingList }
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'export PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `liste-courses-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

    } catch (err: any) {
      alert('Erreur lors du téléchargement: ' + err.message)
    }
  }

  const groupedByCategory = shoppingList.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category]!.push(item)
    return acc
  }, {} as { [category: string]: ShoppingItem[] })

  const categories = Object.keys(groupedByCategory).sort()

  if (!isVisible) {
    return (
      <div className={className}>
        <Button 
          onClick={generateShoppingList}
          disabled={loading || !plan || plan.length === 0}
          variant="outline"
          className="w-full"
        >
          {loading ? '📝 Génération...' : '🛒 Liste de courses'}
        </Button>
        {error && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200 mt-2">
            {error}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">🛒</span>
            Liste de courses
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={downloadPDF}
              disabled={shoppingList.length === 0}
            >
              📄 PDF
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsVisible(false)}
            >
              ✕
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {shoppingList.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            Aucun ingrédient trouvé
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Total: <strong>{shoppingList.length} ingrédients</strong> • 
              {categories.length} catégories
            </div>
            
            {categories.map(category => (
              <div key={category} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {groupedByCategory[category]!.length} item{groupedByCategory[category]!.length > 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="grid gap-2">
                  {groupedByCategory[category]!.map((item, index) => (
                    <div 
                      key={`${category}-${index}`}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm"
                    >
                      <span className="font-medium">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{item.quantity}</span>
                        {item.multiplier && item.multiplier !== '1.0' && (
                          <Badge variant="secondary" className="text-xs">
                            ×{item.multiplier}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="text-xs text-muted-foreground pt-2 border-t">
              💡 Liste basée sur votre plan hebdomadaire. Les quantités sont ajustées selon le nombre de portions.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}