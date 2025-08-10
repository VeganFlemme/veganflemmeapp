import type { Metadata } from 'next'
import AuthProvider from '@/components/auth-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'VeganFlemme - Menus véganes flemme-friendly',
  description: 'Génération automatique de plans alimentaires végans optimisés nutritionnellement',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-background font-sans antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}