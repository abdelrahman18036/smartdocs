import { useState, useEffect } from 'react'
import { ChevronRight, ChevronDown, Component, Zap, FileText, Code, Home, Package, Globe, Map, Navigation } from 'lucide-react'
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
  type: 'page' | 'special';
}

interface SidebarProps {
  isMobileMenuOpen?: boolean
  onMobileMenuClose?: () => void
}

const getIcon = (type: string) => {
  switch (type) {
    case 'component': return <Component className="h-4 w-4" />
    case 'hook': return <Zap className="h-4 w-4" />
    case 'page': return <FileText className="h-4 w-4" />
    case 'mdx': return <FileText className="h-4 w-4" />
    case 'packages': return <Package className="h-4 w-4" />
    case 'pages': return <Globe className="h-4 w-4" />
    default: return <Component className="h-4 w-4" />
  }
}

export function Sidebar({ isMobileMenuOpen = false, onMobileMenuClose }: SidebarProps) {
  const router = useRouter()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['pages', 'components', 'hooks']))
  const [components, setComponents] = useState<ComponentData[]>([])
  const [pages, setPages] = useState<PageData[]>([])
  const [packageCount, setPackageCount] = useState<number>(25) // Start with reasonable default
  const [pageCount, setPageCount] = useState<number>(0)

  useEffect(() => {
    // Load components data client-side
    fetch('/api/components')
      .then(res => res.json())
      .then(data => {
        const components = data.components || []
        setComponents(components)
        
        // Count pages
        const pageComponents = components.filter((c: ComponentData) => c.type === 'page')
        setPageCount(pageComponents.length)
      })
      .catch(() => {
        setComponents([])
        setPageCount(0)
      })
    
    // Load package count - try multiple approaches
    const loadPackageCount = async () => {
      try {
        // First try to fetch from API (if available)
        try {
          const apiRes = await fetch('/api/packages');
          if (apiRes.ok) {
            const data = await apiRes.json();
            const total = (data.dependencies?.length || 0) + (data.devDependencies?.length || 0);
            setPackageCount(total);
            return;
          }
        } catch (e) {
          // API not available, continue to next method
        }
        
        // Fallback to package.json
        const pkgRes = await fetch('/package.json');
        if (pkgRes.ok) {
          const pkg = await pkgRes.json();
          const depCount = Object.keys(pkg.dependencies || {}).length;
          const devDepCount = Object.keys(pkg.devDependencies || {}).length;
          setPackageCount(depCount + devDepCount);
        } else {
          // Default for documentation sites
          setPackageCount(25); // Reasonable default for demo
        }
      } catch (error) {
        console.warn('Could not load package count:', error);
        setPackageCount(25); // Reasonable default for demo
      }
    };
    
    loadPackageCount();
    
    // Dynamically detect pages from the router or file system
    const detectedPages: PageData[] = [
      { name: 'Overview', path: '/', description: 'Project overview and introduction', type: 'page' }
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

  // Handle navigation click on mobile
  const handleNavClick = () => {
    if (onMobileMenuClose) {
      onMobileMenuClose()
    }
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block sticky top-16 h-[calc(100vh-4rem)] w-64 border-r bg-slate-50/50 dark:bg-slate-900/50 overflow-y-auto backdrop-blur-sm shrink-0">
      <div className="p-4">
          <nav className="space-y-3">
          <div>
            <Link 
              href="/"
                className={`flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 group relative ${
                  router.pathname === '/' 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25' 
                    : 'hover:bg-white dark:hover:bg-slate-800 hover:shadow-md text-slate-700 dark:text-slate-300'
                }`}
              >
                {router.pathname === '/' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl opacity-100"></div>
                )}
                <Home className={`mr-3 h-4 w-4 relative z-10 ${
                  router.pathname === '/' ? 'text-white' : 'text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                }`} />
                <span className="relative z-10">Overview</span>
                {router.pathname === '/' && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
                )}
              </Link>
            </div>

            {/* Sitemap Link - Always Visible */}
            <div>
              <Link 
                href="/sitemap"
                className={`flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 group relative ${
                  router.pathname === '/sitemap' || router.asPath.startsWith('/sitemap')
                    ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25' 
                    : 'hover:bg-white dark:hover:bg-slate-800 hover:shadow-md text-slate-700 dark:text-slate-300'
                }`}
              >
                {(router.pathname === '/sitemap' || router.asPath.startsWith('/sitemap')) && (
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl opacity-100"></div>
                )}
                <Map className={`mr-3 h-4 w-4 relative z-10 ${
                  router.pathname === '/sitemap' || router.asPath.startsWith('/sitemap') ? 'text-white' : 'text-indigo-500 group-hover:text-indigo-600'
                }`} />
                <span className="relative z-10">Sitemap</span>
                {(router.pathname === '/sitemap' || router.asPath.startsWith('/sitemap')) && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
                )}
              </Link>
            </div>

            {/* Navigations Link - Always Visible */}
            <div>
              <Link 
                href="/navigations"
                className={`flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 group relative ${
                  router.pathname === '/navigations' || router.asPath.startsWith('/navigations')
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/25' 
                    : 'hover:bg-white dark:hover:bg-slate-800 hover:shadow-md text-slate-700 dark:text-slate-300'
                }`}
              >
                {(router.pathname === '/navigations' || router.asPath.startsWith('/navigations')) && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl opacity-100"></div>
                )}
                <Navigation className={`mr-3 h-4 w-4 relative z-10 ${
                  router.pathname === '/navigations' || router.asPath.startsWith('/navigations') ? 'text-white' : 'text-purple-500 group-hover:text-purple-600'
                }`} />
                <span className="relative z-10">Navigations</span>
                {(router.pathname === '/navigations' || router.asPath.startsWith('/navigations')) && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
                )}
            </Link>
          </div>

          {Object.entries(groupedComponents).map(([type, items]) => {
            const isExpanded = expandedSections.has(type)
            const typeLabel = type.charAt(0).toUpperCase() + type.slice(1) + 's'
            const hasActiveChild = items.some(item => {
              const expectedPath = `/${type}s/${item.displayName.toLowerCase()}`
              const currentPath = router.asPath.split('?')[0].split('#')[0] // Remove query params and hash
              const currentPathname = router.pathname
              
              // Check exact match, startsWith for dynamic routes, and slug patterns
              return currentPath === expectedPath || 
                     currentPathname === expectedPath ||
                     currentPath.startsWith(`/${type}s/`) ||
                     currentPathname.startsWith(`/${type}s/`) ||
                     (router.query.slug && currentPathname.includes(`/${type}s/[slug]`))
            })
            
            const getSectionColor = (type: string) => {
              switch (type) {
                case 'hook': return hasActiveChild || isExpanded ? 'from-green-500 to-green-600' : 'from-green-400 to-green-500'
                case 'component': return hasActiveChild || isExpanded ? 'from-blue-500 to-blue-600' : 'from-blue-400 to-blue-500'
                case 'page': return hasActiveChild || isExpanded ? 'from-purple-500 to-purple-600' : 'from-purple-400 to-purple-500'
                default: return hasActiveChild || isExpanded ? 'from-slate-500 to-slate-600' : 'from-slate-400 to-slate-500'
              }
            }
            
            return (
              <div key={type} className="space-y-2">
                <button
                  onClick={() => toggleSection(type)}
                  className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 group relative ${
                    hasActiveChild 
                      ? 'bg-white dark:bg-slate-800 shadow-lg text-slate-900 dark:text-slate-100' 
                      : 'hover:bg-white dark:hover:bg-slate-800 hover:shadow-md text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {hasActiveChild && (
                    <div className={`absolute inset-0 bg-gradient-to-r ${getSectionColor(type)} opacity-10 rounded-xl`}></div>
                  )}
                  <div className="flex items-center relative z-10">
                    <div className={`p-1.5 rounded-lg bg-gradient-to-r ${getSectionColor(type)} ${hasActiveChild ? 'shadow-lg' : 'shadow-md'}`}>
                      <div className="text-white">
                    {getIcon(type)}
                      </div>
                    </div>
                    <span className="ml-3">{typeLabel}</span>
                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                      hasActiveChild 
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500'
                    }`}>
                      {type === 'page' && pageCount > 0 ? pageCount : items.length}
                    </span>
                  </div>
                  <ChevronRight 
                    className={`h-4 w-4 transition-all duration-200 relative z-10 ${
                      isExpanded ? 'rotate-90 text-slate-700 dark:text-slate-300' : 'text-slate-400'
                    }`} 
                  />
                  {hasActiveChild && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  )}
                </button>
                
                <div className={`overflow-hidden transition-all duration-300 ${
                  isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className={`ml-6 border-l-2 border-slate-200 dark:border-slate-700 pl-4 relative ${
                    items.length > 5 ? 'max-h-72 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 hover:scrollbar-thumb-slate-400 dark:hover:scrollbar-thumb-slate-500' : 'space-y-1'
                  }`}>
                    {hasActiveChild && (
                      <div className={`absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b ${getSectionColor(type)} rounded-full`}></div>
                    )}
                    <div className="space-y-1 py-1">
                    {items.map((item) => {
                      const href = `/${type}s/${item.displayName.toLowerCase()}`
                        const currentPath = router.asPath.split('?')[0].split('#')[0]
                        const currentPathname = router.pathname
                        const isActive = currentPath === href || 
                                        currentPathname === href ||
                                        (router.query.slug && router.query.slug === item.displayName.toLowerCase() && 
                                         currentPathname.includes(`/${type}s/[slug]`))
                      
                      return (
                        <Link
                          key={item.displayName}
                          href={href}
                          className={`block rounded-lg px-3 py-2.5 text-sm transition-all duration-200 relative group ${
                            isActive 
                              ? 'bg-white dark:bg-slate-800 shadow-md text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700' 
                              : 'hover:bg-white/50 dark:hover:bg-slate-800/50 hover:translate-x-1 text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                          }`}
                        >
                          {isActive && (
                            <>
                              <div className={`absolute inset-0 bg-gradient-to-r ${getSectionColor(type)} opacity-5 rounded-lg`}></div>
                              <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b ${getSectionColor(type)} rounded-full -ml-5`}></div>
                            </>
                          )}
                          <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${isActive ? 'text-slate-900 dark:text-slate-100' : ''}`}>
                                {item.displayName}
                              </span>
                              {isActive && (
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                              )}
                            </div>
                            {item.props && item.props.length > 0 && (
                              <span className={`px-1.5 py-0.5 text-xs rounded-full font-medium ${
                                isActive 
                                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                              }`}>
                                {item.props.length}
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <div className={`text-xs mt-1.5 line-clamp-2 relative z-10 ${
                              isActive ? 'text-slate-600 dark:text-slate-400' : 'text-slate-500 dark:text-slate-500'
                            }`}>
                              {item.description}
                            </div>
                          )}
                        </Link>
                      )
                    })}
                    {items.length > 5 && (
                      <div className="text-center py-2">
                        <div className="text-xs text-slate-400 dark:text-slate-600 font-medium">
                          {items.length - 5}+ more • Scroll to view
                        </div>
                        <div className="flex justify-center mt-1">
                          <div className="flex space-x-1">
                            <div className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full animate-pulse"></div>
                            <div className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                            <div className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Packages Section */}
          <div className="space-y-2">
            {(() => {
              const hasActivePackage = router.asPath === '/packages/dependencies' || router.asPath === '/packages/dev-dependencies' ||
                                      router.pathname === '/packages/dependencies' || router.pathname === '/packages/dev-dependencies'
              const isPackagesExpanded = expandedSections.has('packages')
              
              return (
                <>
                  <button
                    onClick={() => toggleSection('packages')}
                    className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 group relative ${
                      hasActivePackage 
                        ? 'bg-white dark:bg-slate-800 shadow-lg text-slate-900 dark:text-slate-100' 
                        : 'hover:bg-white dark:hover:bg-slate-800 hover:shadow-md text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {hasActivePackage && (
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-500 to-slate-600 opacity-10 rounded-xl"></div>
                    )}
                    <div className="flex items-center relative z-10">
                      <div className={`p-1.5 rounded-lg bg-gradient-to-r from-slate-500 to-slate-600 ${hasActivePackage ? 'shadow-lg' : 'shadow-md'}`}>
                        <div className="text-white">
                          {getIcon('packages')}
                        </div>
                      </div>
                      <span className="ml-3">Packages</span>
                      <span className={`ml-2 px-2 py-0.5 text-xs rounded-full font-medium ${
                        hasActivePackage 
                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500'
                      }`}>
                        {packageCount}
                      </span>
                    </div>
                    <ChevronRight 
                      className={`h-4 w-4 transition-all duration-200 relative z-10 ${
                        isPackagesExpanded ? 'rotate-90 text-slate-700 dark:text-slate-300' : 'text-slate-400'
                      }`} 
                    />
                    {hasActivePackage && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-500 rounded-full animate-pulse"></div>
                    )}
                  </button>
                  
                  <div className={`overflow-hidden transition-all duration-300 ${
                    isPackagesExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="ml-6 space-y-1 border-l-2 border-slate-200 dark:border-slate-700 pl-4 relative">
                      {hasActivePackage && (
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-slate-500 to-slate-600 rounded-full"></div>
                      )}
                      
                      <Link
                        href="/packages/dependencies"
                        className={`block rounded-lg px-3 py-2.5 text-sm transition-all duration-200 relative group ${
                          router.asPath === '/packages/dependencies' || router.pathname === '/packages/dependencies'
                            ? 'bg-white dark:bg-slate-800 shadow-md text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700' 
                            : 'hover:bg-white/50 dark:hover:bg-slate-800/50 hover:translate-x-1 text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        {(router.asPath === '/packages/dependencies' || router.pathname === '/packages/dependencies') && (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-r from-slate-500 to-slate-600 opacity-5 rounded-lg"></div>
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-slate-500 to-slate-600 rounded-full -ml-5"></div>
                          </>
                        )}
                        <div className="flex items-center justify-between relative z-10">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${(router.asPath === '/packages/dependencies' || router.pathname === '/packages/dependencies') ? 'text-slate-900 dark:text-slate-100' : ''}`}>
                              Dependencies
                            </span>
                            {(router.asPath === '/packages/dependencies' || router.pathname === '/packages/dependencies') && (
                              <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-pulse"></div>
                            )}
                          </div>
                        </div>
                        <div className={`text-xs mt-1.5 relative z-10 ${
                          (router.asPath === '/packages/dependencies' || router.pathname === '/packages/dependencies') ? 'text-slate-600 dark:text-slate-400' : 'text-slate-500 dark:text-slate-500'
                        }`}>
                          Production dependencies
                        </div>
                      </Link>
                      
                      <Link
                        href="/packages/dev-dependencies"
                        className={`block rounded-lg px-3 py-2.5 text-sm transition-all duration-200 relative group ${
                          router.asPath === '/packages/dev-dependencies' || router.pathname === '/packages/dev-dependencies'
                            ? 'bg-white dark:bg-slate-800 shadow-md text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700' 
                            : 'hover:bg-white/50 dark:hover:bg-slate-800/50 hover:translate-x-1 text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        {(router.asPath === '/packages/dev-dependencies' || router.pathname === '/packages/dev-dependencies') && (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-r from-slate-500 to-slate-600 opacity-5 rounded-lg"></div>
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-slate-500 to-slate-600 rounded-full -ml-5"></div>
                          </>
                        )}
                        <div className="flex items-center justify-between relative z-10">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${(router.asPath === '/packages/dev-dependencies' || router.pathname === '/packages/dev-dependencies') ? 'text-slate-900 dark:text-slate-100' : ''}`}>
                              Dev Dependencies
                            </span>
                            {(router.asPath === '/packages/dev-dependencies' || router.pathname === '/packages/dev-dependencies') && (
                              <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-pulse"></div>
                            )}
                          </div>
                        </div>
                        <div className={`text-xs mt-1.5 relative z-10 ${
                          (router.asPath === '/packages/dev-dependencies' || router.pathname === '/packages/dev-dependencies') ? 'text-slate-600 dark:text-slate-400' : 'text-slate-500 dark:text-slate-500'
                        }`}>
                          Development dependencies
                        </div>
                      </Link>
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
          </nav>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside 
        id="mobile-sidebar"
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-80 max-w-[85vw] border-r bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm z-40 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 h-full overflow-y-auto">
          <nav className="space-y-3">
            <div>
              <Link 
                href="/"
                onClick={handleNavClick}
                className={`flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 group relative ${
                  router.pathname === '/' 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25' 
                    : 'hover:bg-white dark:hover:bg-slate-800 hover:shadow-md text-slate-700 dark:text-slate-300'
                }`}
              >
                {router.pathname === '/' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl opacity-100"></div>
                )}
                <Home className={`mr-3 h-4 w-4 relative z-10 ${
                  router.pathname === '/' ? 'text-white' : 'text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                }`} />
                <span className="relative z-10">Overview</span>
                {router.pathname === '/' && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
                )}
              </Link>
            </div>

            {/* Sitemap Link - Always Visible */}
            <div>
              <Link 
                href="/sitemap"
                onClick={handleNavClick}
                className={`flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 group relative ${
                  router.pathname === '/sitemap' || router.asPath.startsWith('/sitemap')
                    ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25' 
                    : 'hover:bg-white dark:hover:bg-slate-800 hover:shadow-md text-slate-700 dark:text-slate-300'
                }`}
              >
                {(router.pathname === '/sitemap' || router.asPath.startsWith('/sitemap')) && (
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl opacity-100"></div>
                )}
                <Map className={`mr-3 h-4 w-4 relative z-10 ${
                  router.pathname === '/sitemap' || router.asPath.startsWith('/sitemap') ? 'text-white' : 'text-indigo-500 group-hover:text-indigo-600'
                }`} />
                <span className="relative z-10">Sitemap</span>
                {(router.pathname === '/sitemap' || router.asPath.startsWith('/sitemap')) && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
                )}
              </Link>
            </div>

            {/* Navigations Link - Always Visible */}
            <div>
              <Link 
                href="/navigations"
                onClick={handleNavClick}
                className={`flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 group relative ${
                  router.pathname === '/navigations' || router.asPath.startsWith('/navigations')
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/25' 
                    : 'hover:bg-white dark:hover:bg-slate-800 hover:shadow-md text-slate-700 dark:text-slate-300'
                }`}
              >
                {(router.pathname === '/navigations' || router.asPath.startsWith('/navigations')) && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl opacity-100"></div>
                )}
                <Navigation className={`mr-3 h-4 w-4 relative z-10 ${
                  router.pathname === '/navigations' || router.asPath.startsWith('/navigations') ? 'text-white' : 'text-purple-500 group-hover:text-purple-600'
                }`} />
                <span className="relative z-10">Navigations</span>
                {(router.pathname === '/navigations' || router.asPath.startsWith('/navigations')) && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
                )}
              </Link>
            </div>

            {/* Mobile Navigation - Same content as desktop but with click handlers */}
            {Object.entries(groupedComponents).map(([type, items]) => {
              const isExpanded = expandedSections.has(type)
              const typeLabel = type.charAt(0).toUpperCase() + type.slice(1) + 's'
              const hasActiveChild = items.some(item => {
                const expectedPath = `/${type}s/${item.displayName.toLowerCase()}`
                const currentPath = router.asPath.split('?')[0].split('#')[0]
                const currentPathname = router.pathname
                
                return currentPath === expectedPath || 
                       currentPathname === expectedPath ||
                       currentPath.startsWith(`/${type}s/`) ||
                       currentPathname.startsWith(`/${type}s/`) ||
                       (router.query.slug && currentPathname.includes(`/${type}s/[slug]`))
              })
              
              const getSectionColor = (type: string) => {
                switch (type) {
                  case 'hook': return hasActiveChild || isExpanded ? 'from-green-500 to-green-600' : 'from-green-400 to-green-500'
                  case 'component': return hasActiveChild || isExpanded ? 'from-blue-500 to-blue-600' : 'from-blue-400 to-blue-500'
                  case 'page': return hasActiveChild || isExpanded ? 'from-purple-500 to-purple-600' : 'from-purple-400 to-purple-500'
                  default: return hasActiveChild || isExpanded ? 'from-slate-500 to-slate-600' : 'from-slate-400 to-slate-500'
                }
              }
              
              return (
                <div key={type} className="space-y-2">
                  <button
                    onClick={() => toggleSection(type)}
                    className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 group relative ${
                      hasActiveChild 
                        ? 'bg-white dark:bg-slate-800 shadow-lg text-slate-900 dark:text-slate-100' 
                        : 'hover:bg-white dark:hover:bg-slate-800 hover:shadow-md text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {hasActiveChild && (
                      <div className={`absolute inset-0 bg-gradient-to-r ${getSectionColor(type)} opacity-10 rounded-xl`}></div>
                    )}
                    <div className="flex items-center relative z-10">
                      <div className={`p-1.5 rounded-lg bg-gradient-to-r ${getSectionColor(type)} ${hasActiveChild ? 'shadow-lg' : 'shadow-md'}`}>
                        <div className="text-white">
                          {getIcon(type)}
                        </div>
                      </div>
                      <span className="ml-3">{typeLabel}</span>
                      <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                        hasActiveChild 
                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500'
                      }`}>
                        {type === 'page' && pageCount > 0 ? pageCount : items.length}
                      </span>
                    </div>
                    <ChevronRight 
                      className={`h-4 w-4 transition-all duration-200 relative z-10 ${
                        isExpanded ? 'rotate-90 text-slate-700 dark:text-slate-300' : 'text-slate-400'
                      }`} 
                    />
                    {hasActiveChild && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    )}
                  </button>
                  
                  <div className={`overflow-hidden transition-all duration-300 ${
                    isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className={`ml-6 border-l-2 border-slate-200 dark:border-slate-700 pl-4 relative ${
                      items.length > 5 ? 'max-h-72 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 hover:scrollbar-thumb-slate-400 dark:hover:scrollbar-thumb-slate-500' : 'space-y-1'
                    }`}>
                      {hasActiveChild && (
                        <div className={`absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b ${getSectionColor(type)} rounded-full`}></div>
                      )}
                      <div className="space-y-1 py-1">
                        {items.map((item) => {
                          const href = `/${type}s/${item.displayName.toLowerCase()}`
                          const currentPath = router.asPath.split('?')[0].split('#')[0]
                          const currentPathname = router.pathname
                          const isActive = currentPath === href || 
                                          currentPathname === href ||
                                          (router.query.slug && router.query.slug === item.displayName.toLowerCase() && 
                                           currentPathname.includes(`/${type}s/[slug]`))
                        
                        return (
                          <Link
                            key={item.displayName}
                            href={href}
                            onClick={handleNavClick}
                            className={`block rounded-lg px-3 py-2.5 text-sm transition-all duration-200 relative group ${
                              isActive 
                                ? 'bg-white dark:bg-slate-800 shadow-md text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700' 
                                : 'hover:bg-white/50 dark:hover:bg-slate-800/50 hover:translate-x-1 text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                          >
                            {isActive && (
                              <>
                                <div className={`absolute inset-0 bg-gradient-to-r ${getSectionColor(type)} opacity-5 rounded-lg`}></div>
                                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b ${getSectionColor(type)} rounded-full -ml-5`}></div>
                              </>
                            )}
                            <div className="flex items-center justify-between relative z-10">
                              <div className="flex items-center gap-2">
                                <span className={`font-semibold ${isActive ? 'text-slate-900 dark:text-slate-100' : ''}`}>
                                  {item.displayName}
                                </span>
                                {isActive && (
                                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                                )}
                              </div>
                              {item.props && item.props.length > 0 && (
                                <span className={`px-1.5 py-0.5 text-xs rounded-full font-medium ${
                                  isActive 
                                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                }`}>
                                  {item.props.length}
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <div className={`text-xs mt-1.5 line-clamp-2 relative z-10 ${
                                isActive ? 'text-slate-600 dark:text-slate-400' : 'text-slate-500 dark:text-slate-500'
                              }`}>
                                {item.description}
                              </div>
                            )}
                          </Link>
                        )
                      })}
                      {items.length > 5 && (
                        <div className="text-center py-2">
                          <div className="text-xs text-slate-400 dark:text-slate-600 font-medium">
                            {items.length - 5}+ more • Scroll to view
                          </div>
                          <div className="flex justify-center mt-1">
                            <div className="flex space-x-1">
                              <div className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full animate-pulse"></div>
                              <div className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                              <div className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                            </div>
                          </div>
                        </div>
                      )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Packages Section - Mobile */}
            <div className="space-y-2">
              {(() => {
                const hasActivePackage = router.asPath === '/packages/dependencies' || router.asPath === '/packages/dev-dependencies' ||
                                        router.pathname === '/packages/dependencies' || router.pathname === '/packages/dev-dependencies'
                const isPackagesExpanded = expandedSections.has('packages')
                
                return (
                  <>
            <button
              onClick={() => toggleSection('packages')}
                      className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 group relative ${
                        hasActivePackage 
                          ? 'bg-white dark:bg-slate-800 shadow-lg text-slate-900 dark:text-slate-100' 
                          : 'hover:bg-white dark:hover:bg-slate-800 hover:shadow-md text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {hasActivePackage && (
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-500 to-slate-600 opacity-10 rounded-xl"></div>
                      )}
                      <div className="flex items-center relative z-10">
                        <div className={`p-1.5 rounded-lg bg-gradient-to-r from-slate-500 to-slate-600 ${hasActivePackage ? 'shadow-lg' : 'shadow-md'}`}>
                          <div className="text-white">
                {getIcon('packages')}
                          </div>
                        </div>
                <span className="ml-3">Packages</span>
                        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full font-medium ${
                          hasActivePackage 
                            ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500'
                        }`}>
                          {packageCount}
                        </span>
              </div>
              <ChevronRight 
                        className={`h-4 w-4 transition-all duration-200 relative z-10 ${
                          isPackagesExpanded ? 'rotate-90 text-slate-700 dark:text-slate-300' : 'text-slate-400'
                }`} 
              />
                      {hasActivePackage && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-500 rounded-full animate-pulse"></div>
                      )}
            </button>
            
            <div className={`overflow-hidden transition-all duration-300 ${
                      isPackagesExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      <div className="ml-6 space-y-1 border-l-2 border-slate-200 dark:border-slate-700 pl-4 relative">
                        {hasActivePackage && (
                          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-slate-500 to-slate-600 rounded-full"></div>
                        )}
                        
                <Link
                  href="/packages/dependencies"
                          onClick={handleNavClick}
                          className={`block rounded-lg px-3 py-2.5 text-sm transition-all duration-200 relative group ${
                            router.asPath === '/packages/dependencies' || router.pathname === '/packages/dependencies'
                              ? 'bg-white dark:bg-slate-800 shadow-md text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700' 
                              : 'hover:bg-white/50 dark:hover:bg-slate-800/50 hover:translate-x-1 text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                          }`}
                        >
                          {(router.asPath === '/packages/dependencies' || router.pathname === '/packages/dependencies') && (
                            <>
                              <div className="absolute inset-0 bg-gradient-to-r from-slate-500 to-slate-600 opacity-5 rounded-lg"></div>
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-slate-500 to-slate-600 rounded-full -ml-5"></div>
                            </>
                          )}
                          <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${(router.asPath === '/packages/dependencies' || router.pathname === '/packages/dependencies') ? 'text-slate-900 dark:text-slate-100' : ''}`}>
                                Dependencies
                              </span>
                              {(router.asPath === '/packages/dependencies' || router.pathname === '/packages/dependencies') && (
                                <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-pulse"></div>
                              )}
                            </div>
                  </div>
                          <div className={`text-xs mt-1.5 relative z-10 ${
                            (router.asPath === '/packages/dependencies' || router.pathname === '/packages/dependencies') ? 'text-slate-600 dark:text-slate-400' : 'text-slate-500 dark:text-slate-500'
                          }`}>
                    Production dependencies
                  </div>
                </Link>
                
                <Link
                  href="/packages/dev-dependencies"
                          onClick={handleNavClick}
                          className={`block rounded-lg px-3 py-2.5 text-sm transition-all duration-200 relative group ${
                            router.asPath === '/packages/dev-dependencies' || router.pathname === '/packages/dev-dependencies'
                              ? 'bg-white dark:bg-slate-800 shadow-md text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700' 
                              : 'hover:bg-white/50 dark:hover:bg-slate-800/50 hover:translate-x-1 text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                          }`}
                        >
                          {(router.asPath === '/packages/dev-dependencies' || router.pathname === '/packages/dev-dependencies') && (
                            <>
                              <div className="absolute inset-0 bg-gradient-to-r from-slate-500 to-slate-600 opacity-5 rounded-lg"></div>
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-slate-500 to-slate-600 rounded-full -ml-5"></div>
                            </>
                          )}
                          <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${(router.asPath === '/packages/dev-dependencies' || router.pathname === '/packages/dev-dependencies') ? 'text-slate-900 dark:text-slate-100' : ''}`}>
                                Dev Dependencies
                              </span>
                              {(router.asPath === '/packages/dev-dependencies' || router.pathname === '/packages/dev-dependencies') && (
                                <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-pulse"></div>
                              )}
                            </div>
                  </div>
                          <div className={`text-xs mt-1.5 relative z-10 ${
                            (router.asPath === '/packages/dev-dependencies' || router.pathname === '/packages/dev-dependencies') ? 'text-slate-600 dark:text-slate-400' : 'text-slate-500 dark:text-slate-500'
                          }`}>
                    Development dependencies
                  </div>
                </Link>
              </div>
            </div>
                  </>
                )
              })()}
          </div>
        </nav>
      </div>
    </aside>
    </>
  )
}