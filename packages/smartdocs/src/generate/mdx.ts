import fs from "node:fs/promises";
import path from "node:path";
import type { ComponentDoc } from "../scan/react";

export async function writeComponentPages(outDir: string, comps: ComponentDoc[]) {
  const dir = path.join(outDir, "components");
  await fs.mkdir(dir, { recursive: true });
  for (const c of comps) {
    const mdx = `---
title: ${c.displayName}
slug: /components/${slug(c.displayName)}
---

# ${c.displayName}

${c.description ?? ""}

## Props

| Name | Type | Required | Default | Description |
|------|------|---------:|---------|-------------|
${c.props.map(p =>
  `| \`${p.name}\` | \`${p.type}\` | ${p.required ? "Yes":"No"} | ${p.defaultValue ?? ""} | ${p.description ?? ""} |`
).join("\n")}

## Source
\`${c.filePath}\`
`;
    await fs.writeFile(path.join(dir, `${slug(c.displayName)}.mdx`), mdx, "utf-8");
  }
}

const slug = (s: string) => s.toLowerCase().replace(/[^\w]+/g, "-").replace(/(^-|-$)/g,"");
