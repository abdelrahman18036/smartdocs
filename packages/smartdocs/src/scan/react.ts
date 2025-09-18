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
          // First try: Advanced parser with custom configuration for FC pattern
          const parser = reactDocgenTs.withDefaultConfig({
            savePropValueAsString: true,
            shouldExtractLiteralValuesFromEnum: true,
            shouldRemoveUndefinedFromOptional: true,
            skipChildrenPropWithoutDoc: false,
            componentNameResolver: (exp: any, source: any) => {
              // Try to find component names more aggressively
              if (exp.getName) {
                return exp.getName();
              }
              // Look for React.FC patterns
              if (source && source.fileName) {
                const baseName = path.basename(source.fileName, path.extname(source.fileName));
                return baseName.charAt(0).toUpperCase() + baseName.slice(1);
              }
              return undefined;
            },
            propFilter: (prop: any, component: any) => {
              // Filter out props from node_modules but keep all user props
              if (prop.parent) {
                return !prop.parent.fileName.includes('node_modules');
              }
              return true;
            }
          });
          parsed = parser.parse(file);
          
          // If no props found, force manual parsing for React.FC pattern
          if (parsed && parsed.length > 0 && parsed.every(p => !p.props || Object.keys(p.props).length === 0)) {
            const fileContent = await fs.readFile(file, 'utf-8');
            const manuallyParsed = await parseTypeScriptManually(file, fileContent, relativePath);
            if (manuallyParsed.length > 0) {
              // Replace with manually parsed results if they have props
              if (manuallyParsed.some(comp => comp.props && comp.props.length > 0)) {
                docs.push(...manuallyParsed);
                continue;
              }
            }
          }
        } catch (error1) {
          console.log(`First parser failed for ${file}, trying with custom config...`);
          try {
            // Second try: With TypeScript compiler options
            const tsConfigPath = path.resolve(process.cwd(), "tsconfig.json");
            const parser = reactDocgenTs.withCustomConfig(tsConfigPath, {
              savePropValueAsString: true,
              shouldExtractLiteralValuesFromEnum: true,
              shouldRemoveUndefinedFromOptional: true,
              skipChildrenPropWithoutDoc: false,
              propFilter: (prop: any) => {
                if (prop.parent) {
                  return !prop.parent.fileName.includes('node_modules');
                }
                return true;
              }
            });
            parsed = parser.parse(file);
          } catch (error2) {
            console.log(`Second parser failed for ${file}, trying simple parser...`);
            try {
              // Third try: Simple parse without options
              parsed = reactDocgenTs.parse(file);
            } catch (error3) {
              console.log(`All parsers failed for ${file}, trying manual parsing...`);
              // Try to parse manually for specific patterns
              try {
                const fileContent = await fs.readFile(file, 'utf-8');
                const manuallyParsed = await parseTypeScriptManually(file, fileContent, relativePath);
                if (manuallyParsed.length > 0) {
                  console.log(`Manual parsing succeeded for ${file}, found ${manuallyParsed.length} components`);
                  docs.push(...manuallyParsed);
                }
              } catch (manualError) {
                console.warn(`Manual parsing also failed for ${file}:`, manualError);
              }
              continue;
            }
          }
        }

        for (const p of parsed) {
          const name = p.displayName;
          const docType = isApi(file) ? 'api' : 
                         isPage(file) ? 'page' : 
                         isHook(name, file) ? 'hook' : 'component';
          
          // Enhanced props extraction
          const props = Object.entries(p.props ?? {}).map(([propName, pr]: [string, any]) => ({
            name: propName,
            type: pr.type?.name || pr.type?.raw || pr.type || "unknown",
            required: !!pr.required,
            defaultValue: pr.defaultValue?.value || pr.defaultValue,
            description: pr.description || ""
          }));

          docs.push({
            displayName: name,
            filePath: relativePath,
            description: p.description,
            type: docType,
            props,
            jsdoc: extractJsDoc(p.description),
            examples: storyExamples[name] || []
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
          
          const propEntries = Object.entries(c.props ?? {});
          docs.push({
            displayName: name,
            filePath: relativePath,
            description: c.description || "",
            type: docType,
            props: propEntries.map(([name, pr]: any) => ({
              name,
              type: pr.tsType?.name || pr.flowType?.name || pr.type?.name || "",
              required: !!pr.required,
              defaultValue: pr.defaultValue?.value,
              description: pr.description || ""
            })),
            jsdoc: extractJsDoc(c.description),
            examples: storyExamples[name] || []
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

async function parseTypeScriptManually(filePath: string, content: string, relativePath: string): Promise<ComponentDoc[]> {
  const docs: ComponentDoc[] = [];
  
  try {
    // Look for interface definitions with detailed JSDoc parsing
    const interfacePattern = /export\s+interface\s+(\w+Props)\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/gs;
    const componentPattern = /export\s+(?:default\s+)?(?:const|function)\s+(\w+)(?:\s*[:=]\s*(?:React\.)?FC<(\w+Props)>|\s*\([^)]*\)\s*:\s*JSX\.Element)/gs;
    
    const interfaces = new Map<string, Array<{ name: string; type: string; required: boolean; description?: string }>>();
    let match;
    
    // Extract interfaces with JSDoc
    while ((match = interfacePattern.exec(content)) !== null) {
      const [, interfaceName, propsContent] = match;
      const props = extractPropsFromInterface(propsContent);
      interfaces.set(interfaceName, props);
    }
    
    // Extract components and match with interfaces
    while ((match = componentPattern.exec(content)) !== null) {
      const [, componentName, propsInterface] = match;
      
      const props = propsInterface && interfaces.has(propsInterface) 
        ? interfaces.get(propsInterface)!
        : [];
      
      docs.push({
        displayName: componentName,
        description: extractComponentDescription(content, componentName),
        type: 'component',
        props: props,
        filePath: relativePath
      });
    }
  } catch (error) {
    console.warn(`Manual parsing failed for ${filePath}:`, error);
  }
  
  return docs;
}

function extractComponentDescription(content: string, componentName: string): string {
  // Look for JSDoc comment before the component export
  const componentPattern = new RegExp(`\\/\\*\\*([\\s\\S]*?)\\*\\/\\s*export\\s+(?:const|function)\\s+${componentName}`, 'i');
  const match = content.match(componentPattern);
  
  if (match && match[1]) {
    return match[1]
      .split('\n')
      .map(line => line.replace(/^\s*\*\s?/, '').trim())
      .filter(line => line && !line.startsWith('@'))
      .join('\n')
      .trim();
  }
  
  return '';
}

function extractPropsFromInterface(propsContent: string): Array<{ name: string; type: string; required: boolean; description?: string }> {
  const props: Array<{ name: string; type: string; required: boolean; description?: string }> = [];
  
  // Split by lines and process each property
  const lines = propsContent.split('\n');
  let currentProp: { name: string; type: string; required: boolean; description?: string } | null = null;
  let currentDescription = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('//')) continue;
    
    // Check for JSDoc comment
    if (trimmed.startsWith('/**') || trimmed.startsWith('*')) {
      const comment = trimmed.replace(/^\/?\*\*?\s?/, '').replace(/\*\/$/, '').trim();
      if (comment && !comment.startsWith('@')) {
        currentDescription += (currentDescription ? ' ' : '') + comment;
      }
      continue;
    }
    
    // Check for property definition
    const propMatch = trimmed.match(/^\s*(\w+)(\??):\s*([^;,\n]+)/);
    if (propMatch) {
      const [, propName, optional, propType] = propMatch;
      
      props.push({
        name: propName,
        type: propType.trim().replace(/;$/, ''),
        required: !optional,
        description: currentDescription || undefined
      });
      
      // Reset for next property
      currentDescription = '';
    }
  }
  
  return props;
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