import { Component, Zap, FileText, Code } from 'lucide-react'

interface ComponentData {
  displayName: string;
  type: string;
  description?: string;
  filePath: string;
  props?: any[];
}

interface ComponentsListProps {
  components: ComponentData[]
}

const getIcon = (type: string) => {
  switch (type) {
    case 'component': return <Component className="h-5 w-5" />
    case 'hook': return <Zap className="h-5 w-5" />
    case 'page': return <FileText className="h-5 w-5" />
    case 'api': return <Code className="h-5 w-5" />
    case 'mdx': return <FileText className="h-5 w-5" />
    default: return <Component className="h-5 w-5" />
  }
}

const getBadgeColor = (type: string) => {
  switch (type) {
    case 'component': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    case 'hook': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'page': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    case 'api': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
    case 'mdx': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
  }
}

export function ComponentsList({ components }: ComponentsListProps) {
  const groupedComponents = components.reduce((acc, comp) => {
    const type = comp.type || 'component'
    if (!acc[type]) acc[type] = []
    acc[type].push(comp)
    return acc
  }, {} as Record<string, ComponentData[]>)

  return (
    <div className="space-y-8">
      {Object.entries(groupedComponents).map(([type, items]) => {
        const typeLabel = type.charAt(0).toUpperCase() + type.slice(1) + 's'
        
        return (
          <section key={type}>
            <div className="flex items-center space-x-3 mb-4">
              {getIcon(type)}
              <h2 className="text-2xl font-semibold">{typeLabel}</h2>
              <span className="text-sm text-muted-foreground">({items.length})</span>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <a
                  key={item.displayName}
                  href={`/${type}s/${item.displayName.toLowerCase()}`}
                  className="group block rounded-lg border border-border bg-card p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold group-hover:text-primary">
                        {item.displayName}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {item.description || 'No description available'}
                      </p>
                      
                      {item.props && item.props.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs text-muted-foreground">
                            {item.props.length} props
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <span className={`ml-2 inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getBadgeColor(type)}`}>
                      {type}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}