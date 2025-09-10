import '../styles/globals.css'
import Head from 'next/head'
import { useState, useEffect } from 'react'

function MyApp({ Component, pageProps }) {
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Vehicle Camera Issue Tracker Dashboard" />
        <meta name="author" content="Vehicle Camera Dashboard" />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:title" content="Vehicle Camera Dashboard" />
        <meta property="og:description" content="Vehicle Camera Issue Tracker Dashboard" />
        <meta property="og:type" content="website" />
        
        {/* Preload important fonts */}
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          as="style"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
