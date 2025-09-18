import { useState, useEffect } from 'react'
import { ChevronRight, ChevronDown, Component, Zap, FileText, Code, Home, Package, Globe } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'

interface ComponentData {
  displayName: string;
  type: string;
  description?: string;
  filePath: string;
  props?: any[];
}

interface PageData {
  name: string;
  path: string;
  description: string;
  type: 'page' | 'api' | 'special';
}

interface SidebarProps {}

const getIcon = (type: string) => {
  switch (type) {
    case 'component': return <Component className="h-4 w-4" />
    case 'hook': return <Zap className="h-4 w-4" />
    case 'page': return <FileText className="h-4 w-4" />
    case 'api': return <Code className="h-4 w-4" />
    case 'mdx': return <FileText className="h-4 w-4" />
    case 'packages': return <Package className="h-4 w-4" />
    case 'pages': return <Globe className="h-4 w-4" />
    default: return <Component className="h-4 w-4" />
  }
}

export function Sidebar({}: SidebarProps) {
  const router = useRouter()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['pages', 'components', 'hooks']))
  const [components, setComponents] = useState<ComponentData[]>([])
  const [pages, setPages] = useState<PageData[]>([])

  useEffect(() => {
    // Load components data client-side
    fetch('/api/components')
      .then(res => res.json())
      .then(data => setComponents(data.components || []))
      .catch(() => setComponents([]))
    
    // Dynamically detect pages from the router or file system
    const detectedPages: PageData[] = [
      { name: 'Overview', path: '/', description: 'Project overview and introduction', type: 'page' },
      { name: 'API Documentation', path: '/api/components', description: 'Components data API endpoint', type: 'api' }
    ]
    
    // Add pages based on available routes if they exist
    if (typeof window !== 'undefined') {
      // Try to detect if we have component/hook pages
      fetch('/api/components')
        .then(res => res.json())
        .then(data => {
          const dynamicPages = [...detectedPages]
          
          // Add first component page if exists
          const components = data.components?.filter((c: any) => c.type === 'component') || []
          if (components.length > 0) {
            dynamicPages.push({
              name: 'Components',
              path: `/components/${components[0].displayName.toLowerCase()}`,
              description: 'React components documentation',
              type: 'page'
            })
          }
          
          // Add first hook page if exists  
          const hooks = data.components?.filter((c: any) => c.type === 'hook') || []
          if (hooks.length > 0) {
            dynamicPages.push({
              name: 'Hooks',
              path: `/hooks/${hooks[0].displayName.toLowerCase()}`,
              description: 'Custom React hooks',
              type: 'page'
            })
          }
          
          setPages(dynamicPages)
        })
        .catch(() => setPages(detectedPages))
    } else {
      setPages(detectedPages)
    }
  }, [])

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const groupedComponents = components.reduce((acc, comp) => {
    const type = comp.type || 'component'
    if (!acc[type]) acc[type] = []
    acc[type].push(comp)
    return acc
  }, {} as Record<string, ComponentData[]>)

  return (
    <aside className="sticky top-16 h-[calc(100vh-4rem)] w-64 border-r bg-muted/30 overflow-y-auto">
      <div className="p-4">
        <nav className="space-y-2">
          <div>
            <Link 
              href="/"
              className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground ${
                router.pathname === '/' ? 'bg-accent text-accent-foreground' : ''
              }`}
            >
              <Home className="mr-3 h-4 w-4" />
              Overview
            </Link>
          </div>

          {/* Pages Section */}
          <div className="space-y-1">
            <button
              onClick={() => toggleSection('pages')}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all duration-200 group"
            >
              <div className="flex items-center">
                {getIcon('pages')}
                <span className="ml-3">Pages</span>
                <span className="ml-2 text-xs text-muted-foreground">({pages.length})</span>
              </div>
              <ChevronRight 
                className={`h-4 w-4 transition-transform duration-200 ${
                  expandedSections.has('pages') ? 'rotate-90' : ''
                }`} 
              />
            </button>
            
            <div className={`overflow-hidden transition-all duration-300 ${
              expandedSections.has('pages') ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <div className="ml-4 space-y-1 border-l border-border/50 pl-4">
                {pages.map((page) => {
                  const isActive = router.asPath === page.path
                  const typeIcon = page.type === 'api' ? <Code className="h-3 w-3" /> : <FileText className="h-3 w-3" />
                  
                  return (
                    <Link
                      key={page.path}
                      href={page.path}
                      className={`block rounded-lg px-3 py-2 text-sm transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:translate-x-1 ${
                        isActive ? 'bg-accent text-accent-foreground border-l-2 border-primary' : 'text-muted-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {typeIcon}
                          <span className="font-medium">{page.name}</span>
                        </div>
                        {page.type === 'api' && (
                          <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded">
                            API
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {page.description}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>

          {Object.entries(groupedComponents).map(([type, items]) => {
            const isExpanded = expandedSections.has(type)
            const typeLabel = type.charAt(0).toUpperCase() + type.slice(1) + 's'
            
            return (
              <div key={type} className="space-y-1">
                <button
                  onClick={() => toggleSection(type)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all duration-200 group"
                >
                  <div className="flex items-center">
                    {getIcon(type)}
                    <span className="ml-3">{typeLabel}</span>
                    <span className="ml-2 text-xs text-muted-foreground">({items.length})</span>
                  </div>
                  <ChevronRight 
                    className={`h-4 w-4 transition-transform duration-200 ${
                      isExpanded ? 'rotate-90' : ''
                    }`} 
                  />
                </button>
                
                <div className={`overflow-hidden transition-all duration-300 ${
                  isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="ml-4 space-y-1 border-l border-border/50 pl-4">
                    {items.map((item) => {
                      const href = `/${type}s/${item.displayName.toLowerCase()}`
                      const isActive = router.asPath === href
                      
                      return (
                        <Link
                          key={item.displayName}
                          href={href}
                          className={`block rounded-lg px-3 py-2 text-sm transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:translate-x-1 ${
                            isActive ? 'bg-accent text-accent-foreground border-l-2 border-primary' : 'text-muted-foreground'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{item.displayName}</span>
                            {item.props && item.props.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {item.props.length}
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {item.description}
                            </div>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Packages Section */}
          <div className="space-y-1">
            <button
              onClick={() => toggleSection('packages')}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all duration-200 group"
            >
              <div className="flex items-center">
                {getIcon('packages')}
                <span className="ml-3">Packages</span>
              </div>
              <ChevronRight 
                className={`h-4 w-4 transition-transform duration-200 ${
                  expandedSections.has('packages') ? 'rotate-90' : ''
                }`} 
              />
            </button>
            
            <div className={`overflow-hidden transition-all duration-300 ${
              expandedSections.has('packages') ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <div className="ml-4 space-y-1 border-l border-border/50 pl-4">
                <Link
                  href="/packages/dependencies"
                  className={`block rounded-lg px-3 py-2 text-sm transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:translate-x-1 ${
                    router.asPath === '/packages/dependencies' ? 'bg-accent text-accent-foreground border-l-2 border-primary' : 'text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Dependencies</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Production dependencies
                  </div>
                </Link>
                
                <Link
                  href="/packages/dev-dependencies"
                  className={`block rounded-lg px-3 py-2 text-sm transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:translate-x-1 ${
                    router.asPath === '/packages/dev-dependencies' ? 'bg-accent text-accent-foreground border-l-2 border-primary' : 'text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Dev Dependencies</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Development dependencies
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </aside>
  )
}