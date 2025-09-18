import * as reactDocgenTs from "react-docgen-typescript";
import { parse as parseJsx } from "react-docgen";
import * as babelParser from "@babel/parser";
import { globby } from "globby";
import fs from "node:fs/promises";
import path from "node:path";

export type ComponentDoc = {
  displayName: string;
  filePath: string;
  description?: string;
  type: 'component' | 'hook' | 'page' | 'api' | 'mdx';
  props: Array<{
    name: string; type: string; required: boolean;
    defaultValue?: string; description?: string;
  }>;
  examples?: string[];
  realUsageExamples?: string[];
  // Hook-specific fields
  hookSignature?: string;
  parameters?: Array<{
    name: string; type: string; required: boolean;
    description?: string;
  }>;
  returnType?: {
    type: string;
    description?: string;
  };
  // Enhanced hook usage tracking
  hookUsages?: Array<{
    file: string;
    line: number;
    code: string;
    context: string;
    destructuring?: string[];
    parameters?: any[];
    defaults?: Record<string, any>;
  }>;
  isBuiltInHook?: boolean;
  hookCategory?: 'state' | 'effect' | 'performance' | 'custom' | 'context' | 'ref';
  jsdoc?: {
    description?: string;
    params?: Array<{ name: string; type: string; description: string; }>;
    returns?: { type: string; description: string; };
    examples?: string[];
  };
};

const isTs = (f: string) => /\.(ts|tsx)$/.test(f);
const isJs = (f: string) => /\.(js|jsx)$/.test(f);
const isMdx = (f: string) => /\.(md|mdx)$/.test(f);
const isHook = (name: string, file: string) => 
  name.startsWith('use') || file.includes('/hooks/') || file.includes('\\hooks\\');
const isPage = (file: string) => 
  file.includes('/pages/') || file.includes('\\pages\\') || 
  file.includes('/app/') || file.includes('\\app\\');
const isApi = (file: string) => 
  file.includes('/api/') || file.includes('\\api\\');

// Built-in React hooks categorized by their purpose
const BUILT_IN_HOOKS = {
  state: ['useState', 'useReducer'],
  effect: ['useEffect', 'useLayoutEffect'],
  performance: ['useMemo', 'useCallback'],
  context: ['useContext'],
  ref: ['useRef', 'useImperativeHandle'],
  other: [
    'useId', 'useDebugValue', 'useDeferredValue', 'useTransition',
    'useSyncExternalStore', 'useInsertionEffect'
  ]
};

const ALL_BUILT_IN_HOOKS = Object.values(BUILT_IN_HOOKS).flat();

function getHookCategory(hookName: string): ComponentDoc['hookCategory'] {
  for (const [category, hooks] of Object.entries(BUILT_IN_HOOKS)) {
    if (hooks.includes(hookName)) {
      return category as ComponentDoc['hookCategory'];
    }
  }
  return 'custom';
}

export async function scanComponents(patterns: string[]): Promise<ComponentDoc[]> {
  const files = await globby(patterns, { gitignore: true, absolute: true });
  
  // Find all story files for examples
  const storyFiles = await globby(['**/*.stories.{js,jsx,ts,tsx}'], { gitignore: true, absolute: true });
  const storyExamples = await extractStorybookExamples(storyFiles);

  // First pass: Find all hook names across all files (including built-in React hooks)
  const allHookNames = await findAllHookNames(files);
  
  // Scan for hook usage across all files
  const hookUsageMap = await scanAllHookUsages(files);

  const docs: ComponentDoc[] = [];
  for (const file of files) {
    try {
      const relativePath = path.relative(process.cwd(), file);
      
      if (isMdx(file)) {
        // Handle MDX files
        const content = await fs.readFile(file, "utf-8");
        const name = inferNameFromPath(file);
        docs.push({
          displayName: name,
          filePath: relativePath,
          description: extractMdxDescription(content),
          type: 'mdx',
          props: []
        });
      } else if (isTs(file)) {
        // Enhanced TypeScript parsing with multiple parser configurations
        let parsed: any[] = [];
        
        try {
          // First try: Default parser
          parsed = reactDocgenTs.parse(file, {
            savePropValueAsString: true,
            shouldExtractLiteralValuesFromEnum: true,
            shouldRemoveUndefinedFromOptional: true,
            propFilter: (prop: any) => {
              // Filter out props from node_modules
              if (prop.parent) {
                return !prop.parent.fileName.includes('node_modules');
              }
              return true;
            }
          });
        } catch (error1) {
          try {
            // Second try: With TypeScript compiler options
            const tsConfigPath = path.resolve(process.cwd(), "tsconfig.json");
            const parser = reactDocgenTs.withCustomConfig(tsConfigPath, {
              savePropValueAsString: true,
              shouldExtractLiteralValuesFromEnum: true,
              shouldRemoveUndefinedFromOptional: true,
              propFilter: (prop: any) => {
                if (prop.parent) {
                  return !prop.parent.fileName.includes('node_modules');
                }
                return true;
              }
            });
            parsed = parser.parse(file);
          } catch (error2) {
            try {
              // Third try: Simple parse without options
              parsed = reactDocgenTs.parse(file);
            } catch (error3) {
              console.warn(`Failed to parse TypeScript file ${file}:`, error3);
              continue;
            }
          }
        }

        for (const p of parsed) {
          const name = p.displayName;
          const docType = isApi(file) ? 'api' : 
                         isPage(file) ? 'page' : 
                         isHook(name, file) ? 'hook' : 'component';
          
          // Enhanced props extraction with safe defaultValue serialization
          const props = Object.entries(p.props ?? {}).map(([propName, pr]: [string, any]) => {
            let defaultValue: string | undefined;
            
            if (pr.defaultValue) {
              if (typeof pr.defaultValue === 'string') {
                defaultValue = pr.defaultValue;
              } else if (pr.defaultValue.value) {
                defaultValue = String(pr.defaultValue.value);
              } else {
                try {
                  defaultValue = JSON.stringify(pr.defaultValue);
                } catch {
                  defaultValue = String(pr.defaultValue);
                }
              }
            }
            
            return {
              name: propName,
              type: pr.type?.name || pr.type?.raw || pr.type || "unknown",
              required: !!pr.required,
              defaultValue,
              description: pr.description || ""
            };
          });

          // Extract real usage examples for components or hooks
          const realUsageExamples = docType === 'component' ? 
            await extractRealUsageExamples(name) : 
            docType === 'hook' ? await extractHookUsageExamples(name) : [];

          // Extract hook-specific information
          let hookSignature: string | undefined;
          let parameters: Array<{ name: string; type: string; required: boolean; description?: string; }> | undefined;
          let returnType: { type: string; description?: string; } | undefined;

          if (docType === 'hook') {
            const hookInfo = await extractHookSignature(file, name);
            hookSignature = hookInfo.signature;
            parameters = hookInfo.parameters;
            returnType = hookInfo.returnType;
          }

          docs.push({
            displayName: name,
            filePath: relativePath,
            description: p.description,
            type: docType,
            props,
            jsdoc: extractJsDoc(p.description),
            examples: storyExamples[name] || [],
            realUsageExamples,
            hookSignature,
            parameters,
            returnType
          });
        }
      } else if (isJs(file)) {
        const code = await fs.readFile(file, "utf-8");
        const components = parseJsx(code);

        for (const c of components) {
          const name = c.displayName || inferNameFromPath(file);
          const docType = isApi(file) ? 'api' : 
                         isPage(file) ? 'page' : 
                         isHook(name, file) ? 'hook' : 'component';
          
          // Extract real usage examples for components or hooks
          const realUsageExamples = docType === 'component' ? 
            await extractRealUsageExamples(name) : 
            docType === 'hook' ? await extractHookUsageExamples(name) : [];

          // Extract hook-specific information for JS files
          let hookSignature: string | undefined;
          let parameters: Array<{ name: string; type: string; required: boolean; description?: string; }> | undefined;
          let returnType: { type: string; description?: string; } | undefined;

          if (docType === 'hook') {
            const hookInfo = await extractHookSignature(file, name);
            hookSignature = hookInfo.signature;
            parameters = hookInfo.parameters;
            returnType = hookInfo.returnType;
          }
          
          const propEntries = Object.entries(c.props ?? {});
          docs.push({
            displayName: name,
            filePath: relativePath,
            description: c.description || "",
            type: docType,
            props: propEntries.map(([name, pr]: any) => {
              let defaultValue: string | undefined;
              
              if (pr.defaultValue) {
                if (typeof pr.defaultValue === 'string') {
                  defaultValue = pr.defaultValue;
                } else if (pr.defaultValue.value) {
                  defaultValue = String(pr.defaultValue.value);
                } else {
                  try {
                    defaultValue = JSON.stringify(pr.defaultValue);
                  } catch {
                    defaultValue = String(pr.defaultValue);
                  }
                }
              }
              
              return {
                name,
                type: pr.tsType?.name || pr.flowType?.name || pr.type?.name || "",
                required: !!pr.required,
                defaultValue,
                description: pr.description || ""
              };
            }),
            jsdoc: extractJsDoc(c.description),
            examples: storyExamples[name] || [],
            realUsageExamples,
            hookSignature,
            parameters,
            returnType
          });
        }
      }
    } catch (error) {
      // ignore non-components/parse errors and continue
      console.warn(`Failed to process file ${file}:`, error);
    }
  }

  // Second pass: Scan specifically for hooks by name across all source files
  for (const hookName of allHookNames) {
    const hookDoc = await scanSpecificHook(hookName, files, hookUsageMap[hookName] || []);
    if (hookDoc) {
      // Check if we already found this hook in the first pass
      const existingHook = docs.find(doc => doc.displayName === hookName && doc.type === 'hook');
      if (!existingHook) {
        docs.push(hookDoc);
      } else {
        // Enhance existing hook with usage information
        existingHook.hookUsages = hookDoc.hookUsages;
        existingHook.isBuiltInHook = hookDoc.isBuiltInHook;
        existingHook.hookCategory = hookDoc.hookCategory;
      }
    }
  }

  return docs;
}

async function extractStorybookExamples(storyFiles: string[]): Promise<Record<string, string[]>> {
  const examples: Record<string, string[]> = {};
  
  for (const file of storyFiles) {
    try {
      const content = await fs.readFile(file, "utf-8");
      const componentName = inferComponentNameFromStory(file, content);
      
      if (componentName) {
        const storyExamples = extractStoriesFromContent(content);
        if (storyExamples.length > 0) {
          examples[componentName] = storyExamples;
        }
      }
    } catch {
      // ignore parse errors
    }
  }
  
  return examples;
}

function inferComponentNameFromStory(file: string, content: string): string | null {
  // Try to extract from export default title
  const titleMatch = content.match(/title:\s*['"`]([^'"`]+)['"`]/);
  if (titleMatch) {
    return titleMatch[1].split('/').pop() || null;
  }
  
  // Try to extract from component export
  const componentMatch = content.match(/component:\s*(\w+)/);
  if (componentMatch) {
    return componentMatch[1];
  }
  
  // Fallback to filename
  const name = path.basename(file).replace(/\.(stories|story)\.(js|jsx|ts|tsx)$/i, '');
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function extractStoriesFromContent(content: string): string[] {
  const stories: string[] = [];
  
  // Find named exports that are stories
  const storyMatches = content.match(/export\s+const\s+(\w+)\s*[:=]/g);
  if (storyMatches) {
    for (const match of storyMatches) {
      const storyName = match.match(/export\s+const\s+(\w+)/)?.[1];
      if (storyName && storyName !== 'default') {
        // Extract the story implementation
        const storyRegex = new RegExp(`export\\s+const\\s+${storyName}\\s*[:=]\\s*([\\s\\S]*?)(?=export|$)`, 'm');
        const storyMatch = content.match(storyRegex);
        if (storyMatch) {
          stories.push(storyMatch[1].trim());
        }
      }
    }
  }
  
  return stories;
}

function inferNameFromPath(p: string) {
  const base = path.basename(p).replace(/\.(jsx?|tsx?|mdx?)$/i, "");
  return base.charAt(0).toUpperCase() + base.slice(1);
}

function extractMdxDescription(content: string): string {
  // Extract description from frontmatter or first paragraph
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (frontmatterMatch) {
    const yamlContent = frontmatterMatch[1];
    const descMatch = yamlContent.match(/description:\s*["']?(.*?)["']?$/m);
    if (descMatch) return descMatch[1];
  }
  
  // Fallback to first paragraph
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.trim() && !line.startsWith('#') && !line.startsWith('---')) {
      return line.trim();
    }
  }
  return '';
}

function extractJsDoc(description?: string): ComponentDoc['jsdoc'] {
  if (!description) return undefined;
  
  const jsdoc: ComponentDoc['jsdoc'] = {
    description: description
  };
  
  // Extract @param, @returns, @example tags
  const paramMatches = description.match(/@param\s+\{([^}]+)\}\s+(\w+)\s+(.*?)(?=@|\n|$)/g);
  if (paramMatches) {
    jsdoc.params = paramMatches.map(match => {
      const paramMatch = match.match(/@param\s+\{([^}]+)\}\s+(\w+)\s+(.*)/);
      return {
        name: paramMatch?.[2] || '',
        type: paramMatch?.[1] || '',
        description: paramMatch?.[3] || ''
      };
    });
  }
  
  const returnMatch = description.match(/@returns?\s+\{([^}]+)\}\s+(.*?)(?=@|\n|$)/);
  if (returnMatch) {
    jsdoc.returns = {
      type: returnMatch[1],
      description: returnMatch[2]
    };
  }
  
  const exampleMatches = description.match(/@example\s+([\s\S]*?)(?=@|\n\n|$)/g);
  if (exampleMatches) {
    jsdoc.examples = exampleMatches.map(match => 
      match.replace(/@example\s+/, '').trim()
    );
  }
  
  return jsdoc;
}

async function extractRealUsageExamples(componentName: string): Promise<string[]> {
  try {
    // Search for files that might contain the component usage
    const sourceFiles = await globby([
      'src/**/*.{js,jsx,ts,tsx}',
      'pages/**/*.{js,jsx,ts,tsx}',
      'app/**/*.{js,jsx,ts,tsx}',
      'components/**/*.{js,jsx,ts,tsx}',
      '!**/*.stories.{js,jsx,ts,tsx}',
      '!**/*.test.{js,jsx,ts,tsx}',
      '!**/node_modules/**'
    ], { gitignore: true, absolute: true });

    const examples: string[] = [];

    for (const file of sourceFiles) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        
        // Skip if file doesn't contain the component
        if (!content.includes(componentName)) continue;

        // Parse the file to extract JSX usage
        const ast = babelParser.parse(content, {
          sourceType: 'module',
          plugins: ['jsx', 'typescript'],
        });

        // Find JSX elements using the component
        const usageExamples: string[] = [];
        
        function findJSXUsage(node: any, source: string) {
          if (node.type === 'JSXElement' || node.type === 'JSXFragment') {
            if (node.openingElement?.name?.name === componentName) {
              // Extract the JSX element with proper formatting
              const start = node.start;
              const end = node.end;
              if (start !== undefined && end !== undefined) {
                const jsxCode = source.slice(start, end);
                // Clean up and format the code
                const cleanCode = jsxCode
                  .split('\n')
                  .map(line => line.trim())
                  .filter(line => line.length > 0)
                  .join('\n');
                usageExamples.push(cleanCode);
              }
            }
          }
          
          // Recursively check children
          if (node.children) {
            for (const child of node.children) {
              findJSXUsage(child, source);
            }
          }
          
          // Check other properties that might contain JSX
          for (const key in node) {
            if (node[key] && typeof node[key] === 'object') {
              if (Array.isArray(node[key])) {
                for (const item of node[key]) {
                  if (item && typeof item === 'object') {
                    findJSXUsage(item, source);
                  }
                }
              } else {
                findJSXUsage(node[key], source);
              }
            }
          }
        }

        findJSXUsage(ast, content);
        examples.push(...usageExamples);

      } catch (error) {
        // Skip files that can't be parsed
        continue;
      }
    }

    // Remove duplicates and limit to 3 examples
    const uniqueExamples = [...new Set(examples)];
    return uniqueExamples.slice(0, 3);

  } catch (error) {
    console.warn(`Failed to extract real usage examples for ${componentName}:`, error instanceof Error ? error.message : error);
    return [];
  }
}

async function extractHookUsageExamples(hookName: string): Promise<string[]> {
  try {
    // Search for files that might contain the hook usage
    const sourceFiles = await globby([
      'src/**/*.{js,jsx,ts,tsx}',
      'pages/**/*.{js,jsx,ts,tsx}',
      'app/**/*.{js,jsx,ts,tsx}',
      'components/**/*.{js,jsx,ts,tsx}',
      '!**/*.stories.{js,jsx,ts,tsx}',
      '!**/*.test.{js,jsx,ts,tsx}',
      '!**/node_modules/**'
    ], { gitignore: true, absolute: true });

    const examples: string[] = [];

    for (const file of sourceFiles) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        
        // Skip if file doesn't contain the hook
        if (!content.includes(hookName)) continue;

        // Parse the file to extract hook usage
        const ast = babelParser.parse(content, {
          sourceType: 'module',
          plugins: ['jsx', 'typescript'],
        });

        // Find hook usage patterns
        const usageExamples: string[] = [];
        
        function findHookUsage(node: any, source: string) {
          // Look for variable declarations with hook calls
          if (node.type === 'VariableDeclaration') {
            for (const declaration of node.declarations) {
              if (declaration.init?.type === 'CallExpression' && 
                  declaration.init.callee?.name === hookName) {
                // Extract the full hook usage line
                const start = node.start;
                const end = node.end;
                if (start !== undefined && end !== undefined) {
                  const hookCode = source.slice(start, end);
                  // Clean up the code
                  const cleanCode = hookCode.trim();
                  usageExamples.push(cleanCode);
                }
              }
            }
          }
          
          // Recursively check all properties
          for (const key in node) {
            if (node[key] && typeof node[key] === 'object') {
              if (Array.isArray(node[key])) {
                for (const item of node[key]) {
                  if (item && typeof item === 'object') {
                    findHookUsage(item, source);
                  }
                }
              } else {
                findHookUsage(node[key], source);
              }
            }
          }
        }

        findHookUsage(ast, content);
        examples.push(...usageExamples);

      } catch (error) {
        // Skip files that can't be parsed
        continue;
      }
    }

    // Remove duplicates and limit to 3 examples
    const uniqueExamples = [...new Set(examples)];
    return uniqueExamples.slice(0, 3);

  } catch (error) {
    console.warn(`Failed to extract hook usage examples for ${hookName}:`, error instanceof Error ? error.message : error);
    return [];
  }
}

async function extractHookSignature(filePath: string, hookName: string): Promise<{
  signature: string;
  parameters: Array<{ name: string; type: string; required: boolean; description?: string; }>;
  returnType: { type: string; description?: string; };
}> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Parse the TypeScript file
    const ast = babelParser.parse(content, {
      sourceType: 'module',
      plugins: ['typescript'],
    });

    let hookInfo = {
      signature: '',
      parameters: [] as Array<{ name: string; type: string; required: boolean; description?: string; }>,
      returnType: { type: 'any', description: undefined }
    };

    function findHookFunction(node: any, depth = 0) {
      if (!node || typeof node !== 'object' || depth > 15) return;  // Add depth limit
      
      // Look for function declarations or exports
      if ((node.type === 'FunctionDeclaration' || node.type === 'ExportNamedDeclaration') && 
          node.declaration?.id?.name === hookName) {
        const func = node.declaration || node;
        
        // Extract function signature
        const start = func.start;
        const end = func.end;
        if (start !== undefined && end !== undefined) {
          const funcCode = content.slice(start, end);
          // Extract just the function signature (first line)
          const signatureMatch = funcCode.match(/export\s+function\s+[^{]+/);
          if (signatureMatch) {
            hookInfo.signature = signatureMatch[0].trim();
          }
        }

        // Extract parameters
        if (func.params) {
          hookInfo.parameters = func.params.map((param: any) => ({
            name: param.name || param.left?.name || 'param',
            type: getTypeFromAnnotation(param.typeAnnotation) || 'any',
            required: !param.optional,
            description: undefined
          }));
        }

        // Extract return type
        if (func.returnType) {
          hookInfo.returnType = {
            type: getTypeFromAnnotation(func.returnType) || 'any',
            description: undefined
          };
        }
        return; // Stop searching once found
      }

      // Check export declarations
      if (node.type === 'ExportNamedDeclaration' && node.declaration?.type === 'FunctionDeclaration') {
        findHookFunction(node, depth + 1);
      }

      // Recursively search
      for (const key in node) {
        if (node[key] && typeof node[key] === 'object') {
          if (Array.isArray(node[key])) {
            for (const item of node[key]) {
              if (item && typeof item === 'object') {
                findHookFunction(item, depth + 1);
              }
            }
          } else {
            findHookFunction(node[key], depth + 1);
          }
        }
      }
    }

    function getTypeFromAnnotation(typeAnnotation: any): string {
      if (!typeAnnotation) return 'any';
      
      const annotation = typeAnnotation.typeAnnotation || typeAnnotation;
      
      if (annotation.type === 'TSStringKeyword') return 'string';
      if (annotation.type === 'TSNumberKeyword') return 'number';
      if (annotation.type === 'TSBooleanKeyword') return 'boolean';
      if (annotation.type === 'TSAnyKeyword') return 'any';
      if (annotation.type === 'TSArrayType') {
        return `${getTypeFromAnnotation(annotation.elementType)}[]`;
      }
      if (annotation.type === 'TSTupleType') {
        const elements = annotation.elementTypes.map((el: any) => getTypeFromAnnotation(el)).join(', ');
        return `[${elements}]`;
      }
      if (annotation.type === 'TSTypeReference') {
        return annotation.typeName.name || 'unknown';
      }
      
      return 'unknown';
    }

    findHookFunction(ast);
    return hookInfo;

  } catch (error) {
    console.warn(`Failed to extract hook signature for ${hookName}:`, error instanceof Error ? error.message : error);
    return {
      signature: '',
      parameters: [],
      returnType: { type: 'any' }
    };
  }
}

// Function to find all hook names across all files (including built-in React hooks)
async function findAllHookNames(files: string[]): Promise<Set<string>> {
  const hookNames = new Set<string>();
  
  // Add all built-in React hooks first
  ALL_BUILT_IN_HOOKS.forEach(hook => hookNames.add(hook));
  
  for (const file of files) {
    if (!isTs(file) && !isJs(file)) continue;
    
    try {
      const content = await fs.readFile(file, 'utf-8');
      
      // Look for ANY hook usage (built-in or custom): use[A-Z][a-zA-Z]*
      const hookUsageRegex = /\b(use[A-Z][a-zA-Z]*)\s*\(/g;
      let match;
      while ((match = hookUsageRegex.exec(content)) !== null) {
        hookNames.add(match[1]);
      }
      
      // Look for hook exports: export function useHook, export const useHook
      const hookExportRegex = /export\s+(?:function|const)\s+(use[A-Z][a-zA-Z]*)/g;
      while ((match = hookExportRegex.exec(content)) !== null) {
        hookNames.add(match[1]);
      }
      
      // Look for hook declarations inside files: function useHook, const useHook
      const hookDeclareRegex = /(?:function|const)\s+(use[A-Z][a-zA-Z]*)/g;
      while ((match = hookDeclareRegex.exec(content)) !== null) {
        hookNames.add(match[1]);
      }
      
    } catch (error) {
      // Skip files that can't be read
      continue;
    }
  }
  
  return hookNames;
}

// Function to scan for a specific hook by name across all files
async function scanSpecificHook(
  hookName: string, 
  files: string[], 
  hookUsages: Array<{
    file: string;
    line: number;
    code: string;
    context: string;
    destructuring?: string[];
    parameters?: any[];
    defaults?: Record<string, any>;
  }> = []
): Promise<ComponentDoc | null> {
  
  const isBuiltIn = ALL_BUILT_IN_HOOKS.includes(hookName);
  const hookCategory = getHookCategory(hookName);
  
  // For built-in hooks, create documentation from usage patterns
  if (isBuiltIn && hookUsages.length > 0) {
    return {
      displayName: hookName,
      filePath: 'React Built-in',
      description: getBuiltInHookDescription(hookName),
      type: 'hook',
      props: [],
      hookUsages,
      isBuiltInHook: true,
      hookCategory,
      jsdoc: getBuiltInHookJSDoc(hookName)
    };
  }
  
  // For custom hooks, find definition and combine with usage
  for (const file of files) {
    if (!isTs(file) && !isJs(file)) continue;
    
    try {
      const content = await fs.readFile(file, 'utf-8');
      
      // Check if this file contains the hook definition
      const hookDefRegex = new RegExp(`(?:export\\s+)?(?:function|const)\\s+${hookName}\\b`, 'g');
      if (hookDefRegex.test(content)) {
        
        const relativePath = path.relative(process.cwd(), file);
        
        // Extract hook information
        const hookInfo = await extractHookSignature(file, hookName);
        const realUsageExamples = await extractHookUsageExamples(hookName);
        
        // Extract JSDoc if available
        const jsDocRegex = new RegExp(`/\\*\\*[\\s\\S]*?\\*/\\s*(?:export\\s+)?(?:function|const)\\s+${hookName}`, 'g');
        const jsDocMatch = jsDocRegex.exec(content);
        let description = `Custom React hook: ${hookName}`;
        let jsdocInfo = undefined;
        
        if (jsDocMatch) {
          const jsDocText = jsDocMatch[0];
          description = extractJsDocDescription(jsDocText) || description;
          jsdocInfo = extractJsDoc(jsDocText);
        }
        
        return {
          displayName: hookName,
          filePath: relativePath,
          description,
          type: 'hook',
          props: [],
          hookSignature: hookInfo.signature,
          parameters: hookInfo.parameters,
          returnType: hookInfo.returnType,
          realUsageExamples,
          hookUsages,
          isBuiltInHook: false,
          hookCategory: 'custom',
          jsdoc: jsdocInfo
        };
      }
      
    } catch (error) {
      continue;
    }
  }
  
  // If no definition found but has usages, create documentation from usage patterns
  if (hookUsages.length > 0) {
    return {
      displayName: hookName,
      filePath: 'Unknown',
      description: `Hook: ${hookName} (used in codebase but definition not found)`,
      type: 'hook',
      props: [],
      hookUsages,
      isBuiltInHook: isBuiltIn,
      hookCategory: isBuiltIn ? hookCategory : 'custom'
    };
  }
  
  return null;
}

// Comprehensive function to scan ALL hook usages across all files
async function scanAllHookUsages(files: string[]): Promise<Record<string, Array<{
  file: string;
  line: number;
  code: string;
  context: string;
  destructuring?: string[];
  parameters?: any[];
  defaults?: Record<string, any>;
}>>> {
  const hookUsageMap: Record<string, any[]> = {};
  
  for (const file of files) {
    if (!isTs(file) && !isJs(file)) continue;
    
    try {
      const content = await fs.readFile(file, 'utf-8');
      const lines = content.split('\n');
      const relativePath = path.relative(process.cwd(), file);
      
      // Parse the file to find hook usage
      const ast = babelParser.parse(content, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
        errorRecovery: true
      });

      function findHookUsages(node: any, parentContext = '') {
        if (!node || typeof node !== 'object') return;
        
        // Look for variable declarations with hook calls
        if (node.type === 'VariableDeclaration') {
          for (const declaration of node.declarations || []) {
            if (declaration.init?.type === 'CallExpression') {
              const callee = declaration.init.callee;
              const hookName = callee?.name;
              
              if (hookName && hookName.startsWith('use')) {
                if (!hookUsageMap[hookName]) hookUsageMap[hookName] = [];
                
                const lineNumber = declaration.loc?.start?.line || 0;
                const lineContent = lines[lineNumber - 1] || '';
                
                // Extract destructuring pattern
                let destructuring: string[] | undefined;
                if (declaration.id?.type === 'ArrayPattern') {
                  destructuring = declaration.id.elements?.map((el: any) => el?.name).filter(Boolean) || [];
                } else if (declaration.id?.type === 'ObjectPattern') {
                  destructuring = declaration.id.properties?.map((prop: any) => 
                    prop.key?.name || prop.value?.name
                  ).filter(Boolean) || [];
                }
                
                // Extract parameters
                const parameters = declaration.init.arguments?.map((arg: any) => {
                  if (arg.type === 'Literal') return arg.value;
                  if (arg.type === 'Identifier') return arg.name;
                  if (arg.type === 'ObjectExpression') {
                    const obj: any = {};
                    arg.properties?.forEach((prop: any) => {
                      if (prop.key && prop.value) {
                        obj[prop.key.name || prop.key.value] = 
                          prop.value.value || prop.value.name || '[complex]';
                      }
                    });
                    return obj;
                  }
                  return '[complex]';
                }) || [];
                
                hookUsageMap[hookName].push({
                  file: relativePath,
                  line: lineNumber,
                  code: lineContent.trim(),
                  context: extractFunctionContext(content, lineNumber),
                  destructuring,
                  parameters,
                  defaults: extractDefaults(parameters)
                });
              }
            }
          }
        }
        
        // Recursively search all properties
        for (const key in node) {
          if (node[key] && typeof node[key] === 'object') {
            if (Array.isArray(node[key])) {
              for (const item of node[key]) {
                if (item && typeof item === 'object') {
                  findHookUsages(item, parentContext);
                }
              }
            } else {
              findHookUsages(node[key], parentContext);
            }
          }
        }
      }

      findHookUsages(ast);
      
    } catch (error) {
      // Skip files that can't be parsed
      continue;
    }
  }
  
  return hookUsageMap;
}

// Extract the function context where a hook is used
function extractFunctionContext(content: string, lineNumber: number): string {
  const lines = content.split('\n');
  const targetLine = lineNumber - 1;
  
  // Look backwards to find the function declaration
  for (let i = targetLine; i >= Math.max(0, targetLine - 20); i--) {
    const line = lines[i];
    const funcMatch = line.match(/(?:function|const)\s+(\w+)|export\s+(?:default\s+)?(?:function\s+(\w+)|const\s+(\w+))/);
    if (funcMatch) {
      return funcMatch[1] || funcMatch[2] || funcMatch[3] || 'anonymous';
    }
  }
  
  return 'global';
}

// Extract default values from parameters
function extractDefaults(parameters: any[]): Record<string, any> {
  const defaults: Record<string, any> = {};
  
  parameters.forEach((param, index) => {
    if (param && typeof param === 'object' && !(param instanceof Array)) {
      Object.assign(defaults, param);
    } else if (param !== undefined && param !== '[complex]') {
      defaults[`param${index}`] = param;
    }
  });
  
  return defaults;
}

// Get built-in hook descriptions
function getBuiltInHookDescription(hookName: string): string {
  const descriptions: Record<string, string> = {
    useState: 'Returns a stateful value and a function to update it',
    useEffect: 'Performs side effects in function components',
    useContext: 'Accepts a context object and returns the current context value',
    useReducer: 'Alternative to useState for complex state logic',
    useCallback: 'Returns a memoized callback function',
    useMemo: 'Returns a memoized value',
    useRef: 'Returns a mutable ref object whose .current property is initialized to the passed argument',
    useLayoutEffect: 'Identical to useEffect, but fires synchronously after all DOM mutations',
    useImperativeHandle: 'Customizes the instance value exposed to parent components when using ref',
    useDebugValue: 'Used to display a label for custom hooks in React DevTools',
    useId: 'Generates unique IDs that are stable across the server and client',
    useTransition: 'Returns a stateful value for the pending state of the transition',
    useDeferredValue: 'Returns a deferred version of the value that may "lag behind" it',
    useSyncExternalStore: 'Subscribes to an external store',
    useInsertionEffect: 'Fires synchronously before all DOM mutations'
  };
  
  return descriptions[hookName] || `React built-in hook: ${hookName}`;
}

// Get built-in hook JSDoc information
function getBuiltInHookJSDoc(hookName: string): ComponentDoc['jsdoc'] {
  const jsDocInfo: Record<string, ComponentDoc['jsdoc']> = {
    useState: {
      description: 'Returns a stateful value and a function to update it',
      params: [{ name: 'initialState', type: 'T | (() => T)', description: 'The initial state value or lazy initial state function' }],
      returns: { type: '[T, Dispatch<SetStateAction<T>>]', description: 'A tuple with the current state value and a setter function' }
    },
    useEffect: {
      description: 'Performs side effects in function components',
      params: [
        { name: 'effect', type: 'EffectCallback', description: 'The effect function to run' },
        { name: 'deps', type: 'DependencyList?', description: 'Optional array of dependencies' }
      ],
      returns: { type: 'void', description: 'This hook does not return a value' }
    },
    useCallback: {
      description: 'Returns a memoized callback function',
      params: [
        { name: 'callback', type: 'T', description: 'The callback function to memoize' },
        { name: 'deps', type: 'DependencyList', description: 'Array of dependencies' }
      ],
      returns: { type: 'T', description: 'The memoized callback function' }
    },
    useMemo: {
      description: 'Returns a memoized value',
      params: [
        { name: 'factory', type: '() => T', description: 'Function that returns a value to memoize' },
        { name: 'deps', type: 'DependencyList', description: 'Array of dependencies' }
      ],
      returns: { type: 'T', description: 'The memoized value' }
    }
  };
  
  return jsDocInfo[hookName];
}

// Extract JSDoc description from comment text
function extractJsDocDescription(jsDocText: string): string | undefined {
  const lines = jsDocText.split('\n');
  const descriptionLines: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('/**') || trimmed.startsWith('*/') || trimmed.startsWith('*')) {
      const content = trimmed.replace(/^\/?\*+\/?/, '').trim();
      if (content && !content.startsWith('@')) {
        descriptionLines.push(content);
      }
    }
  }
  
  return descriptionLines.length > 0 ? descriptionLines.join(' ') : undefined;
}