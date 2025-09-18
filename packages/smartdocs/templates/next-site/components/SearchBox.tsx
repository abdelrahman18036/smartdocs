import { useState } from 'react'
import { Search } from 'lucide-react'
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

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search components, hooks, pages..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => query && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-lg border border-border bg-background shadow-lg">
          <div className="p-2">
            {results.map((result, index) => {
              const item = result.item
              return (
                <a
                  key={index}
                  href={`/${item.type}s/${item.displayName.toLowerCase()}`}
                  className="flex items-center space-x-3 rounded-lg p-3 hover:bg-accent"
                >
                  <div className="flex-1">
                    <div className="font-medium">{item.displayName}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.type} • {item.description || 'No description'}
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