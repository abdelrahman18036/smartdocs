import { GetStaticProps } from 'next'
import { ComponentsList } from '@/components/ComponentsList'
import { SearchBox } from '@/components/SearchBox'
import fs from 'fs'
import path from 'path'

interface HomeProps {
  components: any[]
}

export default function Home({ components }: HomeProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">Documentation</h1>
        <p className="text-lg text-muted-foreground">
          Auto-generated documentation for React components, hooks, and pages.
        </p>
      </div>
      
      <SearchBox components={components} />
      
      <ComponentsList components={components} />
    </div>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  try {
    const searchPath = path.join(process.cwd(), '..', '.smartdocs', 'content', 'search.json')
    const searchData = JSON.parse(fs.readFileSync(searchPath, 'utf-8'))
    
    return {
      props: {
        components: searchData.components || []
      }
    }
  } catch (error) {
    return {
      props: {
        components: []
      }
    }
  }
}