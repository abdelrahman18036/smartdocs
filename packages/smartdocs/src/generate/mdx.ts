import fs from "node:fs/promises";
import path from "node:path";
import type { ComponentDoc } from "../scan/react";

export async function writeComponentPages(outDir: string, comps: ComponentDoc[]) {
  // Group by type
  const groupedComponents = comps.reduce((acc, comp) => {
    if (!acc[comp.type]) acc[comp.type] = [];
    acc[comp.type].push(comp);
    return acc;
  }, {} as Record<string, ComponentDoc[]>);

  // Create directories and write files for each type
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
  return `---
title: ${c.displayName}
slug: /${type}s/${slug(c.displayName)}
---

# ${c.displayName}

${c.description ?? ""}

## Props

${c.props.length > 0 ? `<div className="overflow-x-auto">
  <table className="min-w-full">
    <thead>
      <tr>
        <th>Name</th>
        <th>Type</th>
        <th>Required</th>
        <th>Default</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
${c.props.map(p => `      <tr>
        <td><code>${p.name}</code></td>
        <td><code>${p.type}</code></td>
        <td>${p.required ? "Yes" : "No"}</td>
        <td>${p.defaultValue ? `<code>${p.defaultValue}</code>` : "-"}</td>
        <td>${p.description ?? ""}</td>
      </tr>`).join("\n")}
    </tbody>
  </table>
</div>` : 'No props available.'}

## Example Usage

\`\`\`tsx
import { ${c.displayName} } from './${type}s/${c.displayName}';

// Basic usage
<${c.displayName}${c.props.filter(p => p.required).length > 0 ? 
  ` ${c.props.filter(p => p.required).map(p => `${p.name}={${getExampleValue(p.type)}}`).join(' ')}` : 
  ''} />

// With all props
<${c.displayName}
${c.props.map(p => `  ${p.name}={${getExampleValue(p.type)}}`).join('\n')}
/>
\`\`\`

## Source
\`${c.filePath}\`
`;
}

function getExampleValue(type: string): string {
  if (type.includes('string')) return '"example"';
  if (type.includes('number')) return '42';
  if (type.includes('boolean')) return 'true';
  if (type.includes('function') || type.includes('=>')) return '{() => {}}';
  if (type.includes('ReactNode') || type.includes('React.ReactNode')) return '{children}';
  if (type.includes('[]') || type.includes('Array')) return '{[]}';
  if (type.includes('{}') || type.includes('object')) return '{{}}';
  return '""';
}

const slug = (s: string) => s.toLowerCase().replace(/[^\w]+/g, "-").replace(/(^-|-$)/g,"");
