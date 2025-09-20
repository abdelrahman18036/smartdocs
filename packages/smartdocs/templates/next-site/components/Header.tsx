import { useTheme } from 'next-themes'
import { Moon, Sun, Github, ExternalLink, Menu } from 'lucide-react'
import { useEffect, useState } from 'react'

interface HeaderProps {
  onMobileMenuToggle?: () => void
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
      <div className="w-full relative flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Mobile Menu Button & Logo */}
        <div className="flex items-center space-x-3">
          {/* Mobile menu button */}
          <button
            onClick={onMobileMenuToggle}
            className="inline-flex items-center justify-center rounded-md h-9 w-9 hover:bg-accent hover:text-accent-foreground transition-colors duration-200 lg:hidden"
            title="Toggle menu"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </button>

          {/* Logo */}
          <a href="/" className="flex items-center space-x-3 transition-all duration-200 hover:opacity-80 hover:scale-105">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 shadow-md">
              <span className="text-sm font-bold text-white">S</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold leading-none bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">SmartDocs</span>
              <span className="text-xs text-muted-foreground leading-none hidden sm:block">Auto-generated docs</span>
            </div>
          </a>
        </div>
        
        {/* Navigation Icons */}
        <nav className="flex items-center space-x-2">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="inline-flex items-center justify-center rounded-md h-9 w-9 hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="sr-only">Toggle theme</span>
          </button>
          
          <a
            href="https://github.com/abdelrahman18036/smartdocs"
            className="inline-flex items-center justify-center rounded-md h-9 w-9 hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
            target="_blank"
            rel="noopener noreferrer"
            title="View on GitHub"
          >
            <Github className="h-4 w-4" />
            <span className="sr-only">GitHub</span>
          </a>

          <a
            href="https://abdorange.me"
            className="hidden sm:inline-flex items-center justify-center rounded-md h-9 w-9 hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
            target="_blank"
            rel="noopener noreferrer"
            title="Created by AbdOrange"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="sr-only">Creator</span>
          </a>
        </nav>
      </div>
    </header>
  )
}