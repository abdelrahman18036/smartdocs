import fs from "node:fs/promises";
import path from "node:path";
import type { ComponentDoc } from "../scan/react-fixed";

export async function writeComponentPages(outDir: string, comps: ComponentDoc[]) {
  const groupedComponents = comps.reduce((acc, comp) => {
    if (!acc[comp.type]) acc[comp.type] = [];
    acc[comp.type].push(comp);
    return acc;
  }, {} as Record<string, ComponentDoc[]>);

  for (const [type, items] of Object.entries(groupedComponents)) {
    const typeDir = path.join(outDir, `${type}s`);
    await fs.mkdir(typeDir, { recursive: true });
    
    for (const c of items) {
      const mdx = generateMdxContent(c, type);
      await fs.writeFile(path.join(typeDir, `${slug(c.displayName)}.mdx`), mdx, "utf-8");
    }
  }
}

function generateMdxContent(c: ComponentDoc, type: string): string {
  const isHook = c.type === 'hook';
  
  let content = `---
title: ${c.displayName}
slug: /${type}s/${slug(c.displayName)}
---

# ${c.displayName}

${c.description ?? ""}`;

  if (isHook) {
    // Hook category and type information
    content += '\n\n## Hook Information\n\n';
    content += `**Category:** ${c.hookCategory || 'custom'}\n\n`;
    content += `**Type:** ${c.isBuiltInHook ? 'React Built-in Hook' : 'Custom Hook'}\n`;
    
    if (c.hookSignature) {
      content += '\n\n## Hook Signature\n\n```typescript\n' + c.hookSignature + '\n```';
    }

    if (c.parameters && c.parameters.length > 0) {
      content += '\n\n## Parameters\n\n| Name | Type | Required | Description |\n|------|------|----------|-------------|\n';
      for (const p of c.parameters) {
        content += '| `' + p.name + '` | `' + p.type + '` | ' + (p.required ? "Yes" : "No") + ' | ' + (p.description ?? "") + ' |\n';
      }
    }

    if (c.returnType) {
      content += '\n\n## Return Type\n\n**Type:** `' + c.returnType.type + '`';
      if (c.returnType.description) {
        content += '\n\n**Description:** ' + c.returnType.description;
      }
    }

    // Display hook usage patterns across the codebase
    if (c.hookUsages && c.hookUsages.length > 0) {
      content += '\n\n## Hook Usage in Codebase\n\n';
      content += `Found **${c.hookUsages.length} usage(s)** across your codebase:\n\n`;
      
      c.hookUsages.forEach((usage, index) => {
        content += `### Usage ${index + 1}\n\n`;
        content += `**File:** \`${usage.file}\` (line ${usage.line})\n\n`;
        content += `**Context:** Used in \`${usage.context}\` function\n\n`;
        
        if (usage.code) {
          content += '```typescript\n' + usage.code + '\n```\n\n';
        }
        
        if (usage.destructuring && usage.destructuring.length > 0) {
          content += `**Destructured variables:** ${usage.destructuring.map(v => `\`${v}\``).join(', ')}\n\n`;
        }
        
        if (usage.parameters && usage.parameters.length > 0) {
          content += `**Parameters used:** ${usage.parameters.map(p => 
            typeof p === 'object' ? JSON.stringify(p) : `\`${p}\``
          ).join(', ')}\n\n`;
        }
        
        if (usage.defaults && Object.keys(usage.defaults).length > 0) {
          content += '**Default values:**\n\n';
          for (const [key, value] of Object.entries(usage.defaults)) {
            content += `- \`${key}\`: \`${typeof value === 'object' ? JSON.stringify(value) : value}\`\n`;
          }
          content += '\n';
        }
      });
    }
  }

  if (c.realUsageExamples && c.realUsageExamples.length > 0) {
    content += '\n\n## Real Usage Examples';
    for (let i = 0; i < c.realUsageExamples.length; i++) {
      content += '\n\n### Usage ' + (i + 1) + '\n\n```' + (isHook ? 'typescript' : 'tsx') + '\n' + c.realUsageExamples[i] + '\n```';
    }
  }

  if (!isHook) {
    content += '\n\n## Props\n\n';
    if (c.props.length > 0) {
      content += '| Name | Type | Required | Default | Description |\n|------|------|----------|---------|-------------|\n';
      for (const p of c.props) {
        content += '| `' + p.name + '` | `' + p.type + '` | ' + (p.required ? "Yes" : "No") + ' | ' + (p.defaultValue ? '`' + p.defaultValue + '`' : "-") + ' | ' + (p.description ?? "") + ' |\n';
      }
    } else {
      content += 'No props available.';
    }
  }

  content += '\n\n## Source\n`' + c.filePath + '`';
  return content;
}

const slug = (s: string) => s.toLowerCase().replace(/[^\w]+/g, "-").replace(/(^-|-$)/g,"");
