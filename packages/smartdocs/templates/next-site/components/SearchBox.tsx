import { useState } from 'react'
import { Search, Command } from 'lucide-react'
import Fuse from 'fuse.js'

interface SearchBoxProps {
  components: any[]
}

export function SearchBox({ components }: SearchBoxProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const fuse = new Fuse(components, {
    keys: ['displayName', 'description', 'type'],
    threshold: 0.3,
    includeScore: true
  })

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    
    if (searchQuery.trim() === '') {
      setResults([])
      setIsOpen(false)
      return
    }

    const searchResults = fuse.search(searchQuery)
    setResults(searchResults.slice(0, 8))
    setIsOpen(true)
  }

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'component': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
      case 'hook': return 'bg-green-500/10 text-green-600 dark:text-green-400'
      case 'page': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
      case 'api': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    }
  }

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search components, hooks, pages..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => query && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className="w-full rounded-xl border border-input bg-background/50 backdrop-blur-sm pl-10 pr-12 py-3 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 focus:ring-offset-2 transition-all duration-200"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
          <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <Command className="h-3 w-3" />
            K
          </kbd>
        </div>
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full z-50 mt-2 w-full rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-xl ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95">
          <div className="p-2">
            <div className="text-xs font-medium text-muted-foreground px-3 py-2">
              Search Results
            </div>
            {results.map((result, index) => {
              const item = result.item
              return (
                <a
                  key={index}
                  href={`/${item.type}s/${item.displayName.toLowerCase()}`}
                  className="flex items-center space-x-3 rounded-lg p-3 hover:bg-accent transition-colors duration-200 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <div className="font-medium group-hover:text-primary transition-colors">
                        {item.displayName}
                      </div>
                      <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ${getBadgeColor(item.type)}`}>
                        {item.type}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 line-clamp-1">
                      {item.description || 'No description'}
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}