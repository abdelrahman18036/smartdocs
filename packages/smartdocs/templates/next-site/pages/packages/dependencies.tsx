import { GetStaticProps } from 'next'
import { Layout } from '../../components/Layout'
import { Package, ExternalLink, Info } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Dependency {
  name: string;
  version: string;
  description?: string;
  homepage?: string;
}

interface DependenciesPageProps {
  dependencies: Dependency[];
}

export default function DependenciesPage({ dependencies }: DependenciesPageProps) {
  const [localDeps, setLocalDeps] = useState<Dependency[]>(dependencies || [])

  useEffect(() => {
    // Try to load package.json from the project root
    fetch('/package.json')
      .then(res => res.json())
      .then(pkg => {
        if (pkg.dependencies) {
          const deps = Object.entries(pkg.dependencies).map(([name, version]) => ({
            name,
            version: version as string,
            description: `Dependency: ${name}`,
            homepage: `https://npmjs.com/package/${name}`
          }))
          setLocalDeps(deps)
        }
      })
      .catch(() => {
        // Fallback to static data
      })
  }, [])

  return (
    
      <div className="space-y-8">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
            <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Dependencies</h1>
            <p className="text-muted-foreground">Production dependencies used in this project</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {localDeps.map((dep) => (
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

        {localDeps.length === 0 && (
          <div className="text-center py-12">
            <Info className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No dependencies found</h3>
            <p className="mt-2 text-muted-foreground">
              Make sure your project has a package.json file with dependencies.
            </p>
          </div>
        )}
      </div>
   
  )
}

export const getStaticProps: GetStaticProps = async () => {
  // Fallback dependencies in case we can't read package.json
  const fallbackDependencies = [
    { name: 'react', version: '^18.0.0', description: 'A JavaScript library for building user interfaces' },
    { name: 'react-dom', version: '^18.0.0', description: 'React package for working with the DOM' }
  ]

  return {
    props: {
      dependencies: fallbackDependencies
    }
  }
}