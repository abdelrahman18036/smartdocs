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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto pt-4">
          {/* Total Count */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-200/50 dark:border-slate-700/50 h-[100px] flex flex-col justify-center items-center">
            <div className="text-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-slate-500 to-slate-600 flex items-center justify-center text-white mx-auto mb-2">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {totalItems}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Total Items
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
              <div key={type} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-200/50 dark:border-slate-700/50 h-[100px] flex flex-col justify-center items-center">
                <div className="text-center">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${config.gradient} flex items-center justify-center text-white mx-auto mb-2`}>
                    {config.icon}
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {count as number}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    {config.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Search Section */}
        <div className="pt-6">
          <div className="mb-4 text-center">
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">
              🔍 Search Documentation
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Find components, hooks, and pages instantly
            </p>
          </div>
          <div className="w-full">
            <SearchBox components={components} />
          </div>
        </div>
      </div>

      {/* Documentation Grid */}
      <div className="space-y-6">
      
        <ComponentsList components={components} />
      </div>
    </div>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  try {
    const searchPath = path.join(process.cwd(), 'content', 'search.json')
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