import { ReactNode, useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Close mobile menu when clicking outside or on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false)
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      const sidebar = document.getElementById('mobile-sidebar')
      const menuButton = document.querySelector('[title="Toggle menu"]')
      
      if (sidebar && !sidebar.contains(e.target as Node) && 
          menuButton && !menuButton.contains(e.target as Node) &&
          isMobileMenuOpen) {
        setIsMobileMenuOpen(false)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden' // Prevent background scrolling
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50/50 via-white to-blue-50/30 dark:from-slate-900/50 dark:via-slate-900 dark:to-blue-950/10 flex flex-col">
      <Header onMobileMenuToggle={toggleMobileMenu} />
      
      <div className="flex flex-1 relative">
        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity duration-300"
            onClick={closeMobileMenu}
          />
        )}
        
        {/* Sidebar */}
        <Sidebar 
          isMobileMenuOpen={isMobileMenuOpen} 
          onMobileMenuClose={closeMobileMenu} 
        />
        
        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 container mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-12 lg:py-12 max-w-7xl">
            {children}
          </div>
          
          {/* Footer */}
          <footer className="border-t bg-gradient-to-r from-muted/30 via-background to-muted/30 mt-auto">
            <div className="container mx-auto px-4 py-6 lg:px-8">
              <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>Built with</span>
                  <span className="text-red-500">♥</span>
                  <span>by</span>
                  <a 
                    href="https://abdorange.me" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    AbdOrange
                  </a>
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <a 
                    href="https://github.com/abdelrahman18036/smartdocs" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors font-medium"
                  >
                    GitHub
                  </a>
                  <span className="text-muted-foreground/50">•</span>
                  <span className="font-mono text-xs bg-muted px-2 py-1 rounded">SmartDocs v0.1.4</span>
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}