"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/components/auth-provider'

interface AuthComponentProps {
  onSuccess?: () => void
}

export function AuthComponent({ onSuccess }: AuthComponentProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  
  const { signInWithMagicLink, signUp } = useAuth()

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setMessage('')

    try {
      const { error } = await signInWithMagicLink(email)
      
      if (error) {
        setMessage(`Erreur: ${error.message}`)
      } else {
        setMessage('🎉 Lien de connexion envoyé ! Vérifiez votre boîte mail.')
      }
    } catch (error) {
      setMessage('Erreur inattendue lors de l\'envoi du lien.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setMessage('')

    try {
      const { error } = await signUp(email, 'temp-password-magic-link')
      
      if (error) {
        setMessage(`Erreur: ${error.message}`)
      } else {
        setMessage('🎉 Compte créé ! Vérifiez votre boîte mail pour confirmer.')
        setMode('signin')
      }
    } catch (error) {
      setMessage('Erreur inattendue lors de la création du compte.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-4xl mb-2">🌱</div>
          <CardTitle className="text-2xl">VeganFlemme</CardTitle>
          <p className="text-muted-foreground">
            {mode === 'signin' 
              ? 'Connectez-vous pour sauvegarder vos plans'
              : 'Créez votre compte VeganFlemme'
            }
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={mode === 'signin' ? handleMagicLink : handleSignUp} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !email}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {mode === 'signin' ? 'Envoi...' : 'Création...'}
                </div>
              ) : (
                mode === 'signin' ? '✉️ Envoyer lien de connexion' : '🚀 Créer mon compte'
              )}
            </Button>
          </form>

          {message && (
            <div className={`p-3 rounded text-sm ${
              message.includes('Erreur') 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {message}
            </div>
          )}

          <div className="text-center pt-4 border-t">
            <Button 
              variant="ghost" 
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin')
                setMessage('')
              }}
              disabled={loading}
            >
              {mode === 'signin' 
                ? 'Pas encore de compte ? Créer un compte'
                : 'Déjà un compte ? Se connecter'
              }
            </Button>
          </div>

          <div className="text-center pt-2">
            <Button 
              variant="outline" 
              onClick={onSuccess}
              className="text-sm"
            >
              🧪 Continuer en mode démo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AuthComponent