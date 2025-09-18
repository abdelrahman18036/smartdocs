import { GetStaticProps } from 'next'
import { Layout } from '../../components/Layout'
import { Package, ExternalLink, Info, Code, Wrench } from 'lucide-react'
import { useEffect, useState } from 'react'

interface DevDependency {
  name: string;
  version: string;
  description?: string;
  homepage?: string;
  category?: 'build' | 'test' | 'dev' | 'other';
}

interface DevDependenciesPageProps {
  devDependencies: DevDependency[];
}

function getCategoryIcon(category: string) {
  switch (category) {
    case 'build':
      return <Wrench className="h-4 w-4" />
    case 'test':
      return <Code className="h-4 w-4" />
    case 'dev':
      return <Package className="h-4 w-4" />
    default:
      return <Package className="h-4 w-4" />
  }
}

function getCategoryColor(category: string) {
  switch (category) {
    case 'build':
      return 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400'
    case 'test':
      return 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
    case 'dev':
      return 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400'
  }
}

function categorizePackage(name: string): DevDependency['category'] {
  const buildTools = ['webpack', 'vite', 'rollup', 'babel', 'typescript', 'tsup', 'esbuild']
  const testTools = ['jest', 'vitest', 'cypress', 'playwright', '@testing-library']
  const devTools = ['eslint', 'prettier', 'nodemon', 'concurrently']

  if (buildTools.some(tool => name.includes(tool))) return 'build'
  if (testTools.some(tool => name.includes(tool))) return 'test'
  if (devTools.some(tool => name.includes(tool))) return 'dev'
  return 'other'
}

export default function DevDependenciesPage({ devDependencies }: DevDependenciesPageProps) {
  const [localDevDeps, setLocalDevDeps] = useState<DevDependency[]>(devDependencies || [])

  useEffect(() => {
    // Try to load package.json from the project root
    fetch('/package.json')
      .then(res => res.json())
      .then(pkg => {
        if (pkg.devDependencies) {
          const deps = Object.entries(pkg.devDependencies).map(([name, version]) => ({
            name,
            version: version as string,
            description: `Development dependency: ${name}`,
            homepage: `https://npmjs.com/package/${name}`,
            category: categorizePackage(name)
          }))
          setLocalDevDeps(deps)
        }
      })
      .catch(() => {
        // Fallback to static data
      })
  }, [])

  const groupedDeps = localDevDeps.reduce((acc, dep) => {
    const category = dep.category || 'other'
    if (!acc[category]) acc[category] = []
    acc[category].push(dep)
    return acc
  }, {} as Record<string, DevDependency[]>)

  return (
    
      <div className="space-y-8">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
            <Wrench className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Development Dependencies</h1>
            <p className="text-muted-foreground">Tools and packages used for development and building</p>
          </div>
        </div>

        {Object.entries(groupedDeps).map(([category, deps]) => (
          <div key={category} className="space-y-4">
            <h2 className="text-xl font-semibold capitalize flex items-center space-x-2">
              {getCategoryIcon(category)}
              <span>{category} Tools</span>
              <span className="text-sm text-muted-foreground">({deps.length})</span>
            </h2>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {deps.map((dep) => (
                <div
                  key={dep.name}
                  className="group relative overflow-hidden rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:scale-105"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-lg">{dep.name}</h3>
                        {dep.homepage && (
                          <a
                            href={dep.homepage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                          v{dep.version}
                        </span>
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getCategoryColor(dep.category || 'other')}`}>
                          {dep.category}
                        </span>
                      </div>
                      {dep.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {dep.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                </div>
              ))}
            </div>
          </div>
        ))}

        {localDevDeps.length === 0 && (
          <div className="text-center py-12">
            <Info className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No development dependencies found</h3>
            <p className="mt-2 text-muted-foreground">
              Make sure your project has a package.json file with devDependencies.
            </p>
          </div>
        )}
      </div>
    
  )
}

export const getStaticProps: GetStaticProps = async () => {
  // Fallback dev dependencies in case we can't read package.json
  const fallbackDevDependencies = [
    { name: 'typescript', version: '^5.0.0', description: 'TypeScript compiler and language server', category: 'build' as const },
    { name: 'eslint', version: '^8.0.0', description: 'Code linting tool for JavaScript and TypeScript', category: 'dev' as const }
  ]

  return {
    props: {
      devDependencies: fallbackDevDependencies
    }
  }
}