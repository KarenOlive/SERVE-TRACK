// app/layout.js

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Set the page title and the fun favicon! */}
        <title>The Secret Next.js Project 😹</title>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>{children}</body>
    </html>
  )
}
