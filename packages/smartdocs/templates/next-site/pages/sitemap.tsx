import { GetStaticProps } from 'next'
import { Layout } from '../components/Layout'
import { Map, Component, Zap, FileText, Code, Package, Home, ExternalLink, ChevronRight, Folder, FolderOpen, GitBranch } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ComponentData {
  displayName: string;
  type: string;
  description?: string;
  filePath: string;
}

interface SitemapProps {
  components: ComponentData[];
}

interface ProjectNode {
  name: string;
  type: 'folder' | 'component' | 'hook' | 'page' | 'api' | 'file';
  path?: string;
  description?: string;
  children?: ProjectNode[];
  filePath?: string;
  component?: ComponentData;
}

export default function SitemapPage({ components }: SitemapProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set([
    '/src',
    '/src/pages',
    '/src/components', 
    '/src/hooks',
    '/src/api'
  ]))

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  // Group components by type
  const groupedComponents = components.reduce((acc, comp) => {
    const type = comp.type || 'component'
    if (!acc[type]) acc[type] = []
    acc[type].push(comp)
    return acc
  }, {} as Record<string, ComponentData[]>)

  // Create project structure tree
  const createProjectStructure = (): ProjectNode => {
    const structure: ProjectNode = {
      name: 'Project Root',
      type: 'folder',
      children: [
        {
          name: 'src/',
          type: 'folder',
          children: [
            // Pages folder
            {
              name: 'pages/',
              type: 'folder',
              children: (groupedComponents.page || []).map(page => ({
                name: `${page.displayName}.tsx`,
                type: 'page' as const,
                path: `/pages/${page.displayName.toLowerCase()}`,
                description: page.description,
                component: page,
                filePath: page.filePath
              }))
            },
            // Components folder
            {
              name: 'components/' + (groupedComponents.component ? ` (${groupedComponents.component.length})` : ''),
              type: 'folder',
              children: (groupedComponents.component || []).map(comp => ({
                name: `${comp.displayName}.tsx`,
                type: 'component' as const,
                path: `/components/${comp.displayName.toLowerCase()}`,
                description: comp.description,
                component: comp,
                filePath: comp.filePath
              }))
            },
            // Hooks/Utils folder
            {
              name: 'hooks/' + (groupedComponents.hook ? ` (${groupedComponents.hook.length})` : ''),
              type: 'folder',
              children: (groupedComponents.hook || []).map(hook => ({
                name: `${hook.displayName}.ts`,
                type: 'hook' as const,
                path: `/hooks/${hook.displayName.toLowerCase()}`,
                description: hook.description,
                component: hook,
                filePath: hook.filePath
              }))
            },
            // API Routes (if any)
            ...(groupedComponents.api && groupedComponents.api.length > 0 ? [{
              name: 'api/' + ` (${groupedComponents.api.length})`,
              type: 'folder' as const,
              children: groupedComponents.api.map(api => ({
                name: `${api.displayName}.ts`,
                type: 'api' as const,
                path: `/apis/${api.displayName.toLowerCase()}`,
                description: api.description,
                component: api,
                filePath: api.filePath
              }))
            }] : [])
          ]
        },
        // Package files
        {
          name: 'package.json',
          type: 'file',
          description: 'Project dependencies and configuration'
        },
        {
          name: 'README.md',
          type: 'file', 
          description: 'Project documentation'
        }
      ]
    }
    return structure
  }

  const projectStructure = createProjectStructure()

  const getNodeIcon = (node: ProjectNode) => {
    switch (node.type) {
      case 'folder':
        const nodeId = node.name.replace(/\/$/, '').replace(/\s+/g, '-').toLowerCase()
        const isExpanded = expandedNodes.has(nodeId)
        return isExpanded ? <FolderOpen className="h-4 w-4 text-blue-500" /> : <Folder className="h-4 w-4 text-slate-500" />
      case 'component':
        return <Component className="h-4 w-4 text-blue-500" />
      case 'hook':
        return <Zap className="h-4 w-4 text-green-500" />
      case 'page':
        return <FileText className="h-4 w-4 text-purple-500" />
      case 'api':
        return <Code className="h-4 w-4 text-orange-500" />
      case 'file':
        return <FileText className="h-4 w-4 text-slate-400" />
      default:
        return <FileText className="h-4 w-4 text-slate-400" />
    }
  }

  const renderProjectNode = (node: ProjectNode, depth = 0, isLast = false, parentPath = '') => {
    const hasChildren = node.children && node.children.length > 0
    const nodeId = `${parentPath}/${node.name}`.replace(/\/$/, '').replace(/\s+/g, '-').toLowerCase()
    const isExpanded = expandedNodes.has(nodeId)
    const indentLevel = depth * 24

    return (
      <div key={nodeId} className="relative">
        {/* Tree lines */}
        {depth > 0 && (
          <>
            {/* Vertical line for parent connection */}
            <div 
              className="absolute bg-slate-300 dark:bg-slate-600 w-px" 
              style={{
                left: `${indentLevel - 12}px`,
                top: '-8px',
                height: isLast ? '16px' : '100%'
              }}
            />
            {/* Horizontal line */}
            <div 
              className="absolute bg-slate-300 dark:bg-slate-600 h-px" 
              style={{
                left: `${indentLevel - 12}px`,
                top: '16px',
                width: '12px'
              }}
            />
          </>
        )}

        <div 
          className="flex items-center group hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-lg p-1 sm:p-2 transition-colors relative min-w-0"
          style={{ paddingLeft: `${Math.max(indentLevel, 8)}px` }}
        >
          {/* Expand/collapse button for folders */}
          {hasChildren && (
            <button
              onClick={() => toggleNode(nodeId)}
              className="mr-1 sm:mr-2 p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors flex-shrink-0"
            >
              <ChevronRight 
                className={`h-3 w-3 text-slate-400 transition-transform ${
                  isExpanded ? 'rotate-90' : ''
                }`}
              />
            </button>
          )}
          {!hasChildren && <div className="w-3 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />}

          {/* Node icon */}
          <div className="mr-2 sm:mr-3 flex-shrink-0">
            {getNodeIcon(node)}
          </div>

          {/* Node content */}
          <div className="flex-1 min-w-0">
            {node.path ? (
              <Link
                href={node.path}
                className="flex items-center justify-between w-full min-w-0"
              >
                <div className="min-w-0 flex-1">
                  <span className={`font-medium truncate block ${
                    node.type === 'folder' 
                      ? 'text-slate-700 dark:text-slate-300' 
                      : 'text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                  }`}>
                    {node.name}
                  </span>
                  {node.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5 line-clamp-1">
                      {node.description}
                    </p>
                  )}
                </div>
                <ExternalLink className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0" />
              </Link>
            ) : (
              <div className="min-w-0">
                <span className={`font-medium truncate block ${
                  node.type === 'folder' 
                    ? 'text-slate-700 dark:text-slate-300' 
                    : 'text-slate-600 dark:text-slate-400'
                }`}>
                  {node.name}
                </span>
                {node.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5 line-clamp-1">
                    {node.description}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* File path indicator - hide on mobile for space */}
          {node.filePath && (
            <div className="hidden sm:block ml-2 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs text-slate-500 dark:text-slate-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              {node.filePath.split('/').slice(-2).join('/')}
            </div>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map((child, index) => 
              renderProjectNode(
                child, 
                depth + 1, 
                index === node.children!.length - 1,
                nodeId
              )
            )}
          </div>
        )}
      </div>
    )
  }

  const getTotalCounts = () => {
    return {
      components: groupedComponents.component?.length || 0,
      hooks: groupedComponents.hook?.length || 0,
      pages: groupedComponents.page?.length || 0,
      apis: groupedComponents.api?.length || 0,
      total: components.length
    }
  }

  const counts = getTotalCounts()

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-white to-blue-50/50 dark:from-slate-900/10 dark:via-slate-900 dark:to-blue-900/10 -z-10"></div>
        <div className="relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-r from-slate-500 to-slate-600 shadow-lg">
                <GitBranch className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-100 dark:via-slate-300 dark:to-slate-100 bg-clip-text text-transparent">
                  🗂️ Project Structure
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-400 mt-1 sm:mt-2">
                  Hierarchical view of your application architecture
                </p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg px-3 sm:px-4 py-2 shadow-lg border border-slate-200 dark:border-slate-700 self-start lg:self-auto">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {counts.total} files
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 mt-4 sm:mt-6">
            {[
              { type: 'component', count: counts.components, icon: Component, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' },
              { type: 'hook', count: counts.hooks, icon: Zap, color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' },
              { type: 'page', count: counts.pages, icon: FileText, color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20' },
              { type: 'api', count: counts.apis, icon: Code, color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20' }
            ].filter(item => item.count > 0).map(item => (
              <div key={item.type} className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium ${item.color} border border-current/20`}>
                <item.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="truncate">{item.count} {item.type}{item.count !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Project Tree Structure */}
      <div className="space-y-4 sm:space-y-6">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            🌳 File Tree
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Interactive view of your project's file structure and components
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 p-3 sm:p-6 shadow-sm">
          <div className="font-mono text-xs sm:text-sm">
            {projectStructure.children?.map((child, index) => 
              renderProjectNode(
                child, 
                0, 
                index === projectStructure.children!.length - 1,
                ''
              )
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900/20 rounded-xl sm:rounded-2xl p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 mb-3 sm:mb-4 text-center">
          📖 Legend
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <Component className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" />
            <div className="min-w-0">
              <div className="font-medium text-slate-900 dark:text-slate-100 text-sm sm:text-base">Components</div>
              <div className="text-xs text-slate-500">React components</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
            <div className="min-w-0">
              <div className="font-medium text-slate-900 dark:text-slate-100 text-sm sm:text-base">Hooks</div>
              <div className="text-xs text-slate-500">Custom React hooks</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 flex-shrink-0" />
            <div className="min-w-0">
              <div className="font-medium text-slate-900 dark:text-slate-100 text-sm sm:text-base">Pages</div>
              <div className="text-xs text-slate-500">Application routes</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <Code className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 flex-shrink-0" />
            <div className="min-w-0">
              <div className="font-medium text-slate-900 dark:text-slate-100 text-sm sm:text-base">APIs</div>
              <div className="text-xs text-slate-500">API endpoints</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  let components: ComponentData[] = []
  
  try {
    // Try to read the components data from the content directory
    const fs = await import('fs')
    const path = await import('path')
    const searchJsonPath = path.join(process.cwd(), 'content', 'search.json')
    
    const searchData = JSON.parse(fs.readFileSync(searchJsonPath, 'utf-8'))
    components = searchData.components || []
  } catch (error) {
    console.warn('Could not read components data for sitemap:', error)
    // Fallback to empty array
    components = []
  }

  return {
    props: {
      components
    }
  }
}
