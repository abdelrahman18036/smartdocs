import { Component, Zap, FileText, Code, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import Pagination, { usePagination } from './Pagination'

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
    case 'component': return 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400'
    case 'hook': return 'bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400'
    case 'page': return 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400'
    case 'api': return 'bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400'
    case 'mdx': return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600'
    default: return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600'
  }
}

const getGradient = (type: string) => {
  switch (type) {
    case 'component': return 'from-blue-500/5 to-blue-600/5'
    case 'hook': return 'from-green-500/5 to-green-600/5'
    case 'page': return 'from-purple-500/5 to-purple-600/5'
    case 'api': return 'from-orange-500/5 to-orange-600/5'
    case 'mdx': return 'from-gray-500/5 to-gray-600/5'
    default: return 'from-gray-500/5 to-gray-600/5'
  }
}

// Component for a single section with pagination
function ComponentSection({ type, items }: { type: string; items: ComponentData[] }) {
  const {
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    currentItems,
    totalItems
  } = usePagination(items, type === 'hook' ? 6 : 12); // Show fewer hooks per page since they can have many usage examples

  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1) + 's'
  
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r ${getGradient(type)} border`}>
            {getIcon(type)}
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{typeLabel}</h2>
            <p className="text-sm text-muted-foreground">
              {totalItems} {totalItems === 1 ? type : type + 's'} available
            </p>
          </div>
        </div>
        
        {/* Quick stats for this type */}
        <div className="text-right">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Page {currentPage} of {totalPages}
          </p>
        </div>
      </div>
      
      {/* Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {currentItems.map((item) => (
          <a
            key={item.displayName}
            href={`/${type}s/${item.displayName.toLowerCase()}`}
            className="group block"
          >
            <div className={`relative rounded-xl border bg-gradient-to-br ${getGradient(type)} p-6 transition-all duration-300 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-1 hover:border-border/80`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors duration-200 truncate">
                      {item.displayName}
                    </h3>
                    <span className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium ${getBadgeColor(type)}`}>
                      {type}
                    </span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {item.description || 'No description available'}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    {item.props && item.props.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {item.props.length} prop{item.props.length !== 1 ? 's' : ''}
                      </div>
                    )}
                    
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" />
                  </div>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
      
      {/* Pagination for this section */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          totalItems={totalItems}
          className="mt-8"
        />
      )}
    </section>
  )
}

export function ComponentsList({ components }: ComponentsListProps) {
  const groupedComponents = components.reduce((acc, comp) => {
    const type = comp.type || 'component'
    if (!acc[type]) acc[type] = []
    acc[type].push(comp)
    return acc
  }, {} as Record<string, ComponentData[]>)

  if (components.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto max-w-md">
          <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <Component className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No components found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Start by adding some React components, hooks, or pages to your project.
          </p>
        </div>
      </div>
    )
  }

  // Sort sections by priority (hooks first since they're often most numerous)
  const sortedSections = Object.entries(groupedComponents).sort(([a], [b]) => {
    const order = ['hook', 'component', 'page', 'api', 'mdx'];
    return order.indexOf(a) - order.indexOf(b);
  });

  return (
    <div className="space-y-16">
      {/* Summary Stats */}
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold mb-4">Documentation Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(groupedComponents).map(([type, items]) => (
            <div key={type} className="text-center">
              <div className={`mx-auto w-12 h-12 rounded-lg bg-gradient-to-r ${getGradient(type)} border flex items-center justify-center mb-2`}>
                {getIcon(type)}
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{items.length}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400 capitalize">{type}s</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sections with Pagination */}
      {sortedSections.map(([type, items]) => (
        <ComponentSection key={type} type={type} items={items} />
      ))}
    </div>
  )
}