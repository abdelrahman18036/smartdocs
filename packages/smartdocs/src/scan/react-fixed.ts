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

export async function scanComponents(patterns: string[]): Promise<ComponentDoc[]> {
  const files = await globby(patterns, { gitignore: true, absolute: true });
  
  // Find all story files for examples
  const storyFiles = await globby(['**/*.stories.{js,jsx,ts,tsx}'], { gitignore: true, absolute: true });
  const storyExamples = await extractStorybookExamples(storyFiles);

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

          // Extract real usage examples for components
          const realUsageExamples = docType === 'component' ? await extractRealUsageExamples(name) : [];

          docs.push({
            displayName: name,
            filePath: relativePath,
            description: p.description,
            type: docType,
            props,
            jsdoc: extractJsDoc(p.description),
            examples: storyExamples[name] || [],
            realUsageExamples
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
          
          // Extract real usage examples for components
          const realUsageExamples = docType === 'component' ? await extractRealUsageExamples(name) : [];
          
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
            realUsageExamples
          });
        }
      }
    } catch (error) {
      // ignore non-components/parse errors and continue
      console.warn(`Failed to process file ${file}:`, error);
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