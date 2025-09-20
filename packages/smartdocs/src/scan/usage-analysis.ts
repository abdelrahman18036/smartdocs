import fs from "node:fs/promises";
import type { ComponentDoc } from "./react-fixed";

export async function analyzeComponentUsageInPages(components: ComponentDoc[], projectRoot: string): Promise<ComponentDoc[]> {
  const updatedComponents = [...components];
  
  // Find all page components
  const pageComponents = components.filter(comp => comp.type === 'page');
  
  for (const page of pageComponents) {
    try {
      if (!page.filePath) continue;
      
      // Read the page file content
      const pageContent = await fs.readFile(page.filePath, 'utf-8');
      
      // Analyze component usage in this page
      const usedComponents = extractUsedComponents(pageContent, components);
      
      // Add the usage analysis to the page component
      const pageIndex = updatedComponents.findIndex(comp => comp === page);
      if (pageIndex !== -1) {
        updatedComponents[pageIndex] = {
          ...page,
          usedComponents: usedComponents
        } as ComponentDoc;
      }
    } catch (error) {
      console.warn(`Failed to analyze component usage for page ${page.displayName}:`, error);
    }
  }
  
  return updatedComponents;
}

// Helper function to extract components used in a page
function extractUsedComponents(pageContent: string, allComponents: ComponentDoc[]) {
  if (!pageContent) {
    return []
  }
  
  const usedComponents: Array<{name: string, type: string, count: number, firstUsage: string}> = []
  const componentMap = new Map()
  
  // Create a map of all available components by display name
  allComponents.forEach(comp => {
    if (comp.displayName) {
      componentMap.set(comp.displayName, comp)
    }
  })
  
  // Enhanced patterns for better detection
  const importPattern = /import\s*(?:\*\s+as\s+\w+|(?:\{[^}]*\}|\w+)(?:\s*,\s*(?:\{[^}]*\}|\w+))*)\s*from\s*['"`][^'"`]*['"`]/gm
  const jsxPattern = /<([A-Z][a-zA-Z0-9]*(?:\.[A-Z][a-zA-Z0-9]*)*)/g
  const hookPattern = /(?:const|let|var)\s*(?:\[?[^=]*\]?\s*=\s*)?(use[A-Z][a-zA-Z0-9]*)\s*\(/g
  const directHookPattern = /\b(use[A-Z][a-zA-Z0-9]*)\s*\(/g
  
  // Find imported components and hooks (for reference, but don't count them)
  const imports = Array.from(pageContent.matchAll(importPattern))
  const importedNames = new Set<string>()
  
  imports.forEach(match => {
    const importText = match[0]
    // Extract named imports from { ComponentA, ComponentB }
    const namedImportMatch = importText.match(/\{([^}]+)\}/)
    if (namedImportMatch) {
      const names = namedImportMatch[1].split(',').map(s => s.trim())
      names.forEach(name => importedNames.add(name))
    }
    
    // Extract default import
    const defaultImportMatch = importText.match(/import\s+(\w+)\s+from/)
    if (defaultImportMatch) {
      importedNames.add(defaultImportMatch[1])
    }
  })

  // Find JSX component usage
  const jsxMatches = Array.from(pageContent.matchAll(jsxPattern))
  
  jsxMatches.forEach(match => {
    const componentName = match[1]
    if (componentName && componentMap.has(componentName)) {
      const matchIndex = match.index || 0
      const contextStart = Math.max(0, matchIndex - 10)
      const contextEnd = Math.min(pageContent.length, matchIndex + 50)
      const contextUsage = pageContent.slice(contextStart, contextEnd).trim()
      
      const existing = usedComponents.find(u => u.name === componentName)
      if (existing) {
        existing.count++
        if (contextUsage.length > existing.firstUsage.length) {
          existing.firstUsage = contextUsage
        }
      } else {
        const comp = componentMap.get(componentName)
        usedComponents.push({
          name: componentName,
          type: comp.type || 'component',
          count: 1,
          firstUsage: contextUsage
        })
      }
    }
  })

  // Find hook usage patterns
  const hookMatches = Array.from(pageContent.matchAll(hookPattern))
  
  hookMatches.forEach(match => {
    const hookName = match[1]
    if (hookName && componentMap.has(hookName)) {
      const matchIndex = match.index || 0
      const contextStart = Math.max(0, matchIndex - 10)
      const contextEnd = Math.min(pageContent.length, matchIndex + 40)
      const contextUsage = pageContent.slice(contextStart, contextEnd).trim()
      
      const existing = usedComponents.find(u => u.name === hookName)
      if (existing) {
        existing.count++
        if (contextUsage.length > existing.firstUsage.length) {
          existing.firstUsage = contextUsage
        }
      } else {
        const comp = componentMap.get(hookName)
        usedComponents.push({
          name: hookName,
          type: comp.type || 'hook',
          count: 1,
          firstUsage: contextUsage
        })
      }
    }
  })
  
  const directHookMatches = Array.from(pageContent.matchAll(directHookPattern))
  
  directHookMatches.forEach(match => {
    const hookName = match[1]
    if (hookName && componentMap.has(hookName)) {
      const matchIndex = match.index || 0
      const contextStart = Math.max(0, matchIndex - 10)
      const contextEnd = Math.min(pageContent.length, matchIndex + 30)
      const contextUsage = pageContent.slice(contextStart, contextEnd).trim()
      
      const existing = usedComponents.find(u => u.name === hookName)
      if (existing) {
        existing.count++
      } else {
        const comp = componentMap.get(hookName)
        usedComponents.push({
          name: hookName,
          type: comp.type || 'hook',
          count: 1,
          firstUsage: contextUsage
        })
      }
    }
  })
  
  // Filter out components with 0 usage (only imported but never used)
  const actuallyUsedComponents = usedComponents.filter(u => u.count > 0)
  
  return actuallyUsedComponents
}
