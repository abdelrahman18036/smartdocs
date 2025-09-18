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
        const parsed = reactDocgenTs.parse(file);
        for (const p of parsed) {
          const name = p.displayName;
          const docType = isApi(file) ? 'api' : 
                         isPage(file) ? 'page' : 
                         isHook(name, file) ? 'hook' : 'component';
          
          docs.push({
            displayName: name,
            filePath: relativePath,
            description: p.description,
            type: docType,
            props: Object.values(p.props ?? {}).map((pr: any) => ({
              name: pr.name,
              type: pr.type?.name ?? "",
              required: !!pr.required,
              defaultValue: pr.defaultValue?.value,
              description: pr.description ?? ""
            })),
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
    } catch {
      // ignore non-components/parse errors and continue
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
