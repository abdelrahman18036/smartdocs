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
    <div className="space-y-16">
      {/* Main Header with Clean Design */}
      <div className="text-center space-y-10">
        {/* Main Title */}
        <div className="space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            📚 Documentation Overview
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Automatically generated documentation for your React project with intelligent search, 
            detailed component analysis, and real-world usage examples
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          {/* Total Count */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-green-500 rounded-full animate-pulse"></div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {totalItems}
                </div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Total Items
                </div>
              </div>
            </div>
          </div>

          {/* Type Breakdown */}
          {Object.entries(componentTypes).map(([type, count]) => {
            const typeConfig = {
              component: { 
                icon: '⚛️', 
                label: 'Components',
                gradient: 'from-blue-500 to-cyan-500'
              },
              hook: { 
                icon: '🪝', 
                label: 'Hooks',
                gradient: 'from-green-500 to-emerald-500'
              },
              page: { 
                icon: '📄', 
                label: 'Pages',
                gradient: 'from-purple-500 to-pink-500'
              },
              api: { 
                icon: '🔌', 
                label: 'APIs',
                gradient: 'from-orange-500 to-red-500'
              }
            };
            
            const config = typeConfig[type as keyof typeof typeConfig] || {
              icon: '📝',
              label: type,
              gradient: 'from-slate-500 to-slate-600'
            };
            
            return (
              <div key={type} className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-md border border-slate-200/30 dark:border-slate-700/30">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${config.gradient} flex items-center justify-center text-white text-sm`}>
                    {config.icon}
                  </div>
                  <div>
                    <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {count as number}
                    </div>
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {config.label}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Search Section */}
        <div className="pt-8">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
              🔍 Search Documentation
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Find components, hooks, pages, and APIs instantly with intelligent search
            </p>
          </div>
          <div className="max-w-2xl mx-auto">
            <SearchBox components={components} />
          </div>
        </div>
      </div>

      {/* Documentation Grid */}
      <div className="space-y-8 pt-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            📋 Browse All Documentation
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Explore components, hooks, pages, and APIs with detailed examples, usage patterns, and comprehensive documentation
          </p>
        </div>
        
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