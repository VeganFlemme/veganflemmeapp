export const metadata = { title: 'VeganFlemme', description: 'Menus véganes flemme-friendly' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="container p-4">{children}</body>
    </html>
  )
}
