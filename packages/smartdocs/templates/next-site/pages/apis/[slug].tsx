import { GetStaticProps, GetStaticPaths } from 'next'
import fs from 'fs'
import path from 'path'
import Pagination, { usePagination } from '../../components/Pagination'

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
        
        {/* API Information */}
        <div className="flex gap-4 flex-wrap">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
            API Route
          </span>
          {component.jsdoc?.params && component.jsdoc.params.length > 0 && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              {component.jsdoc.params.length} parameter{component.jsdoc.params.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Parameters Table */}
      {component.jsdoc?.params && component.jsdoc.params.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Parameters</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-300 dark:border-slate-600 rounded-lg">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800">
                  <th className="border border-slate-300 dark:border-slate-600 px-4 py-2 text-left">Name</th>
                  <th className="border border-slate-300 dark:border-slate-600 px-4 py-2 text-left">Type</th>
                  <th className="border border-slate-300 dark:border-slate-600 px-4 py-2 text-left">Description</th>
                </tr>
              </thead>
              <tbody>
                {component.jsdoc.params.map((param: any, index: number) => (
                  <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="border border-slate-300 dark:border-slate-600 px-4 py-2 font-mono text-sm font-semibold text-orange-600 dark:text-orange-400">
                      {param.name}
                    </td>
                    <td className="border border-slate-300 dark:border-slate-600 px-4 py-2 font-mono text-sm text-slate-600 dark:text-slate-400">
                      {param.type}
                    </td>
                    <td className="border border-slate-300 dark:border-slate-600 px-4 py-2 text-slate-600 dark:text-slate-400">
                      {param.description || 'No description'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Return Type */}
      {component.jsdoc?.returns && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Returns</h2>
          <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <p className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">{component.jsdoc.returns.type}</p>
            {component.jsdoc.returns.description && (
              <p className="mt-2 text-slate-600 dark:text-slate-400">{component.jsdoc.returns.description}</p>
            )}
          </div>
        </div>
      )}

      {/* JSDoc Examples */}
      {component.jsdoc?.examples && component.jsdoc.examples.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">JSDoc Examples</h2>
          {component.jsdoc.examples.map((example: string, index: number) => (
            <div key={index} className="space-y-2">
              <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">Example {index + 1}</h3>
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm border">
                  <code className="language-js">{example}</code>
                </pre>
                <div className="absolute top-2 right-2">
                  <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded">
                    API
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Real Usage Examples - Enhanced Design */}
      {component.realUsageExamples && component.realUsageExamples.length > 0 && (() => {
        const {
          currentPage,
          setCurrentPage,
          itemsPerPage,
          setItemsPerPage,
          totalPages,
          currentItems,
          totalItems
        } = usePagination(component.realUsageExamples as string[], 3);

        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                API Usage in Your Codebase 
                <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 text-sm font-medium px-2 py-1 rounded">
                  {totalItems} usage(s) found
                </span>
              </h2>
              
              {totalPages > 1 && (
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
                </div>
              )}
            </div>
            
            {(currentItems as string[]).map((example, index) => {
              const actualIndex = (currentPage - 1) * itemsPerPage + index + 1;
              
              return (
                <div key={index} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-6 shadow-sm">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex flex-wrap items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                        Usage {actualIndex}
                      </h3>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-1 rounded">
                          API Route
                        </span>
                      </div>
                    </div>
                    
                    {/* Code Example */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Code:</h4>
                      <div className="relative">
                        <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm border">
                          <code className="language-javascript">{example}</code>
                        </pre>
                        <div className="absolute top-2 right-2">
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                            Real Code
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* API Pattern Info */}
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded border border-orange-200 dark:border-orange-800">
                      <div className="text-sm text-orange-800 dark:text-orange-200">
                        <strong>🔌 API Pattern:</strong> This example shows how the <code className="bg-orange-100 dark:bg-orange-800 px-1 py-0.5 rounded">{component.displayName}</code> API route is implemented in your application.
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          
            {/* Pagination for usage examples */}
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
          </div>
        );
      })()}

      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Source</h2>
        <p className="font-mono text-sm bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
          🔌 {component.filePath}
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