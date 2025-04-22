import './globals.css'

export const metadata = {
  title: 'AI Screenshot Dashboard',
  description: 'Screenshots analyzed by AI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-100 min-h-screen">{children}</body>
    </html>
  )
}

