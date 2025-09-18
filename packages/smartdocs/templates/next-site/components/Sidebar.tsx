import { useState, useEffect } from 'react'
import { ChevronRight, ChevronDown, Component, Zap, FileText, Code } from 'lucide-react'
import Link from 'next/link'
import fs from 'fs'
import path from 'path'

interface ComponentData {
  displayName: string;
  type: string;
  description?: string;
  filePath: string;
  props?: any[];
}

interface SidebarProps {}

const getIcon = (type: string) => {
  switch (type) {
    case 'component': return <Component className="h-4 w-4" />
    case 'hook': return <Zap className="h-4 w-4" />
    case 'page': return <FileText className="h-4 w-4" />
    case 'api': return <Code className="h-4 w-4" />
    case 'mdx': return <FileText className="h-4 w-4" />
    default: return <Component className="h-4 w-4" />
  }
}

export function Sidebar({}: SidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['components']))
  const [components, setComponents] = useState<ComponentData[]>([])

  useEffect(() => {
    // Load components data client-side
    fetch('/api/components')
      .then(res => res.json())
      .then(data => setComponents(data.components || []))
      .catch(() => setComponents([]))
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

  return (
    <aside className="w-64 border-r border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="p-4">
        <nav className="space-y-2">
          <div>
            <Link 
              href="/"
              className="flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              <FileText className="mr-2 h-4 w-4" />
              Overview
            </Link>
          </div>

          {Object.entries(groupedComponents).map(([type, items]) => {
            const isExpanded = expandedSections.has(type)
            const typeLabel = type.charAt(0).toUpperCase() + type.slice(1) + 's'
            
            return (
              <div key={type}>
                <button
                  onClick={() => toggleSection(type)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                >
                  <div className="flex items-center">
                    {getIcon(type)}
                    <span className="ml-2">{typeLabel}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                
                {isExpanded && (
                  <div className="ml-4 mt-2 space-y-1">
                    {items.map((item) => (
                      <Link
                        key={item.displayName}
                        href={`/${type}s/${item.displayName.toLowerCase()}`}
                        className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      >
                        {item.displayName}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}