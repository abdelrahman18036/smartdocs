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
    case 'mdx': return <FileText className="h-5 w-5" />
    default: return <Component className="h-5 w-5" />
  }
}

const getBadgeColor = (type: string) => {
  switch (type) {
    case 'component': return 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400'
    case 'hook': return 'bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400'
    case 'page': return 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400'
    case 'mdx': return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600'
    default: return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600'
  }
}

const getGradient = (type: string) => {
  switch (type) {
    case 'component': return 'from-blue-500/5 to-blue-600/5'
    case 'hook': return 'from-green-500/5 to-green-600/5'
    case 'page': return 'from-purple-500/5 to-purple-600/5'
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
    <section className="space-y-8">
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-r ${getGradient(type)} border-2 border-white dark:border-slate-700 shadow-lg`}>
              <div className="text-base sm:text-lg">
                {getIcon(type)}
              </div>
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{typeLabel}</h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-1">
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  {totalItems} {totalItems === 1 ? type : type + 's'} available
                </p>
                <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getBadgeColor(type)} shadow-sm w-fit`}>
                  {type === 'hook' && '🪝 '}
                  {type === 'component' && '⚛️ '}
                  {type === 'page' && '📄 '}
                  {type === 'mdx' && '📝 '}
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </div>
              </div>
            </div>
          </div>
          
          {/* Enhanced quick stats */}
          <div className="text-right">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h4a1 1 0 011 1v2h2a1 1 0 110 2H6a1 1 0 110-2h1zM5 6v12a2 2 0 002 2h6a2 2 0 002-2V6H5z" />
              </svg>
              <span className="font-medium">Page {currentPage} of {totalPages}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Cards Grid - Responsive */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {currentItems.map((item) => (
          <a
            key={item.displayName}
            href={`/${type}s/${item.displayName.toLowerCase()}`}
            className="group block"
          >
            <div className={`relative rounded-xl border bg-gradient-to-br ${getGradient(type)} p-6 transition-all duration-300 hover:shadow-xl hover:shadow-black/10 hover:-translate-y-2 hover:border-border/80 flex flex-col h-full min-h-[200px]`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r ${getGradient(type)} border shadow-sm`}>
                    {getIcon(type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors duration-200 truncate text-slate-900 dark:text-slate-100">
                      {item.displayName}
                    </h3>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getBadgeColor(type)} shadow-sm`}>
                      {type}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col justify-between">
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                  {item.description || 'No description available'}
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center gap-3">
                    {item.props && item.props.length > 0 && (
                      <div className="flex items-center gap-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-full text-slate-600 dark:text-slate-400">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        {item.props.length} prop{item.props.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center text-primary group-hover:scale-110 transition-all duration-200">
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
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
    const order = ['hook', 'component', 'page', 'mdx'];
    return order.indexOf(a) - order.indexOf(b);
  });

  return (
    <div className="space-y-16">

      {/* Sections with Pagination */}
      {sortedSections.map(([type, items]) => (
        <ComponentSection key={type} type={type} items={items} />
      ))}
    </div>
  )
}