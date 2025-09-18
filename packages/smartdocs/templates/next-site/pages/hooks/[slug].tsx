import { GetStaticProps, GetStaticPaths } from 'next'
import fs from 'fs'
import path from 'path'
import Pagination, { usePagination } from '../../components/Pagination'

interface HookPageProps {
  component: any
}

export default function HookPage({ component }: HookPageProps) {
  if (!component) {
    return <div>Hook not found</div>
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">{component.displayName}</h1>
        <p className="text-lg text-muted-foreground">
          {component.description || 'No description available'}
        </p>
        
        {/* Hook Information */}
        <div className="flex gap-4 flex-wrap">
          {component.hookCategory && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              Category: {component.hookCategory}
            </span>
          )}
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            component.isBuiltInHook 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
          }`}>
            {component.isBuiltInHook ? 'React Built-in' : 'Custom Hook'}
          </span>
        </div>
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
          <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <p className="font-mono text-sm text-slate-800 dark:text-slate-200">{component.jsdoc.returns.type}</p>
            <p className="mt-2 text-slate-600 dark:text-slate-400">{component.jsdoc.returns.description}</p>
          </div>
        </div>
      )}
      
      {/* Hook Signature */}
      {component.hookSignature && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Hook Signature</h2>
          <div className="relative">
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm border">
              <code className="language-typescript">{component.hookSignature}</code>
            </pre>
          </div>
        </div>
      )}
      
      {/* Parameters */}
      {component.parameters && component.parameters.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Parameters</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-300 dark:border-slate-600 rounded-lg">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800">
                  <th className="border border-slate-300 dark:border-slate-600 px-4 py-2 text-left">Name</th>
                  <th className="border border-slate-300 dark:border-slate-600 px-4 py-2 text-left">Type</th>
                  <th className="border border-slate-300 dark:border-slate-600 px-4 py-2 text-left">Required</th>
                  <th className="border border-slate-300 dark:border-slate-600 px-4 py-2 text-left">Description</th>
                </tr>
              </thead>
              <tbody>
                {component.parameters.map((param: any, index: number) => (
                  <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="border border-slate-300 dark:border-slate-600 px-4 py-2 font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {param.name}
                    </td>
                    <td className="border border-slate-300 dark:border-slate-600 px-4 py-2 font-mono text-sm text-slate-600 dark:text-slate-400">
                      {param.type}
                    </td>
                    <td className="border border-slate-300 dark:border-slate-600 px-4 py-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        param.required 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {param.required ? 'Required' : 'Optional'}
                      </span>
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
      {component.returnType && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Return Type</h2>
          <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <p className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">{component.returnType.type}</p>
            {component.returnType.description && (
              <p className="mt-2 text-slate-600 dark:text-slate-400">{component.returnType.description}</p>
            )}
          </div>
        </div>
      )}

      {/* Hook Usage in Codebase - The Main Feature! */}
      {component.hookUsages && component.hookUsages.length > 0 && (() => {
        const {
          currentPage,
          setCurrentPage,
          itemsPerPage,
          setItemsPerPage,
          totalPages,
          currentItems,
          totalItems
        } = usePagination(component.hookUsages || [], 3); // Show 3 usage examples per page

        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                Real Usage in Your Codebase 
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
            
            {currentItems.map((usage: any, index: number) => {
              const actualIndex = (currentPage - 1) * itemsPerPage + index + 1;
              
              return (
                <div key={index} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-6 shadow-sm">
                  <div className="space-y-4">
                    {/* Header with file and location */}
                    <div className="flex flex-wrap items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                        Usage {actualIndex}
                      </h3>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400">
                      📁 {usage.file}
                    </span>
                    <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                      Line {usage.line}
                    </span>
                    {usage.context && usage.context !== 'global' && (
                      <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                        in {usage.context}()
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Code Example */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Code:</h4>
                  <div className="relative">
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm border">
                      <code className="language-typescript">{usage.code}</code>
                    </pre>
                  </div>
                </div>
                
                {/* Destructuring Info */}
                {usage.destructuring && usage.destructuring.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Variables Extracted:</h4>
                    <div className="flex flex-wrap gap-2">
                      {usage.destructuring.map((variable: string, idx: number) => (
                        <span key={idx} className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded text-sm font-mono">
                          {variable}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Parameters Used */}
                {usage.parameters && usage.parameters.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Parameters Used:</h4>
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700">
                      <div className="flex flex-wrap gap-2">
                        {usage.parameters.map((param: any, idx: number) => (
                          <span key={idx} className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded text-sm font-mono">
                            {typeof param === 'object' ? JSON.stringify(param) : String(param)}
                          </span>
                        ))}
                      </div>
          </div>
        </div>
      )}

                {/* Default Values */}
                {usage.defaults && Object.keys(usage.defaults).length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Default Values:</h4>
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700">
                      {Object.entries(usage.defaults).map(([key, value]: [string, any]) => (
                        <div key={key} className="flex items-center gap-2 text-sm">
                          <span className="font-mono text-slate-600 dark:text-slate-400">{key}:</span>
                          <span className="font-mono bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-1 rounded">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
      
      {/* JSDoc Examples (fallback) */}
      {component.jsdoc?.examples && component.jsdoc.examples.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">JSDoc Examples</h2>
          {component.jsdoc.examples.map((example: string, index: number) => (
            <div key={index} className="space-y-2">
              <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">Example {index + 1}</h3>
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code className="language-tsx">{example}</code>
                </pre>
                <div className="absolute top-2 right-2">
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                    Hook
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Source</h2>
        <p className="font-mono text-sm bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
          📄 {component.filePath}
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
      .filter((comp: any) => comp.type === 'hook')
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
      (comp: any) => comp.displayName.toLowerCase() === params?.slug && comp.type === 'hook'
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