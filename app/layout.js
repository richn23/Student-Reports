import './globals.css'

export const metadata = {
  title: 'Student Report Generator',
  description: 'AI-powered student report generator for teachers',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
