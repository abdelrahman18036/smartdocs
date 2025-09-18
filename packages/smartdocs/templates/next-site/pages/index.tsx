import { GetStaticProps } from 'next'
import { ComponentsList } from '@/components/ComponentsList'
import { SearchBox } from '@/components/SearchBox'
import fs from 'fs'
import path from 'path'

interface HomeProps {
  components: any[]
}

export default function Home({ components }: HomeProps) {
  const totalItems = components.length;
  const componentTypes = components.reduce((acc, comp) => {
    acc[comp.type] = (acc[comp.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-12">
      {/* Enhanced Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 dark:from-blue-900/10 dark:via-slate-900 dark:to-purple-900/10 -z-10"></div>
        <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-700/50 opacity-20 -z-10"></div>
        
        <div className="relative">
          <div className="text-center space-y-6 py-16">
            {/* Main Title */}
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-slate-900 via-blue-800 to-slate-900 dark:from-slate-100 dark:via-blue-300 dark:to-slate-100 bg-clip-text text-transparent">
                  📚 SmartDocs
                </span>
              </h1>
              <div className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 font-medium max-w-3xl mx-auto leading-relaxed">
                Auto-generated documentation for your React ecosystem
                <br />
                <span className="text-lg text-slate-500 dark:text-slate-500">
                  Components • Hooks • Pages • APIs
                </span>
              </div>
            </div>

            {/* Stats Pills */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <div className="bg-white dark:bg-slate-800 rounded-full px-6 py-3 shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {totalItems} Items Documented
                  </span>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-full px-6 py-3 shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Real-time Updates
                  </span>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-full px-6 py-3 shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Smart Search
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Summary */}
            {Object.keys(componentTypes).length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-3 pt-6">
                {Object.entries(componentTypes).map(([type, count]) => {
                  const typeColors = {
                    hook: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
                    component: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
                    page: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20',
                    api: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20',
                    mdx: 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/20'
                  };
                  const colorClass = typeColors[type as keyof typeof typeColors] || typeColors.mdx;
                  const itemCount = count as number;
                  
                  return (
                    <span key={type} className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${colorClass} border border-current/20`}>
                      {type === 'hook' && '🪝'}
                      {type === 'component' && '⚛️'}
                      {type === 'page' && '📄'}
                      {type === 'api' && '🔌'}
                      {type === 'mdx' && '📝'}
                      <span>{itemCount} {type}{itemCount !== 1 ? 's' : ''}</span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Search Section */}
      <div className="relative">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            🔍 Explore Your Documentation
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Search through components, hooks, pages, and API routes
          </p>
        </div>
        <div className="max-w-2xl mx-auto">
          <SearchBox components={components} />
        </div>
      </div>
      
      {/* Enhanced Components List */}
      <div className="space-y-8">
        <ComponentsList components={components} />
      </div>
    </div>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  try {
    const searchPath = path.join(process.cwd(), '..', 'content', 'search.json')
    const searchData = JSON.parse(fs.readFileSync(searchPath, 'utf-8'))
    
    return {
      props: {
        components: searchData.components || []
      }
    }
  } catch (error) {
    console.log('Error loading search data:', error)
    return {
      props: {
        components: []
      }
    }
  }
}