import { GetStaticProps, GetStaticPaths } from 'next'
import fs from 'fs'
import path from 'path'

interface ApiPageProps {
  component: any
}

export default function ApiPage({ component }: ApiPageProps) {
  if (!component) {
    return <div>API route not found</div>
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">{component.displayName}</h1>
        <p className="text-lg text-muted-foreground">
          {component.description || 'No description available'}
        </p>
      </div>

      {component.jsdoc?.params && component.jsdoc.params.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Parameters</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr >
                  <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Type</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                </tr>
              </thead>
              <tbody>
                {component.jsdoc.params.map((param: any, index: number) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-4 py-2 font-mono text-sm">
                      {param.name}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 font-mono text-sm">
                      {param.type}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {param.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {component.jsdoc?.returns && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Returns</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-mono text-sm">{component.jsdoc.returns.type}</p>
            <p className="mt-2">{component.jsdoc.returns.description}</p>
          </div>
        </div>
      )}

      {component.jsdoc?.examples && component.jsdoc.examples.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Examples</h2>
          {component.jsdoc.examples.map((example: string, index: number) => (
            <pre key={index} className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
              <code>{example}</code>
            </pre>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Source</h2>
        <p className="font-mono text-sm text-muted-foreground">
          {component.filePath}
        </p>
      </div>
    </div>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const searchPath = path.join(process.cwd(), '..', 'content', 'search.json')
    const searchData = JSON.parse(fs.readFileSync(searchPath, 'utf-8'))
    
    const paths = searchData.components
      .filter((comp: any) => comp.type === 'api')
      .map((comp: any) => ({
        params: { slug: comp.displayName.toLowerCase() }
      }))

    return {
      paths,
      fallback: false
    }
  } catch (error) {
    return {
      paths: [],
      fallback: false
    }
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  try {
    const searchPath = path.join(process.cwd(), '..', 'content', 'search.json')
    const searchData = JSON.parse(fs.readFileSync(searchPath, 'utf-8'))
    
    const component = searchData.components.find(
      (comp: any) => comp.displayName.toLowerCase() === params?.slug && comp.type === 'api'
    )

    if (!component) {
      return {
        notFound: true
      }
    }

    return {
      props: {
        component
      }
    }
  } catch (error) {
    return {
      notFound: true
    }
  }
}