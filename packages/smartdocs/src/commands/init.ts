import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function init() {
  const cwd = process.cwd();
  
  // 1. Create smartdocs.config.ts
  const cfg = `import { defineConfig } from "smartdocs/config";

export default defineConfig({
  projectName: "My App",
  entryPaths: ["**/*.{ts,tsx,js,jsx}"],
  include: ["./**"],
  exclude: ["**/__tests__/**","**/*.stories.*","node_modules/**","dist/**","build/**",".next/**",".nuxt/**","coverage/**","**/*.config.*","**/*.conf.*",".git/**",".vscode/**",".idea/**","public/**","static/**","assets/**"],
  outDir: "smartdocs",
  parse: { tsx: true, jsx: true }
});
`;
  await fs.writeFile(path.join(cwd, "smartdocs.config.ts"), cfg, "utf-8");
  
  // 2. Copy the Next.js template to smartdocs/site
  // Resolve template path relative to the CLI script location
  const scriptDir = path.dirname(__filename);
  // From dist/chunk-*.js, go up to package root, then to templates
  const packageRoot = path.resolve(scriptDir, "..");
  const templateSrcDir = path.join(packageRoot, "templates", "next-site");
  const siteDestDir = path.join(cwd, "smartdocs", "site");
  
  await copyDirectory(templateSrcDir, siteDestDir);
  
  console.log("✓ Created smartdocs.config.ts");
  console.log("✓ Scaffolded docs site in smartdocs/site");
  console.log("\nNext steps:");
  console.log("  1. Run 'smartdocs build' to generate documentation");
  console.log("  2. Run 'smartdocs dev' to start development server");
}

async function copyDirectory(src: string, dest: string): Promise<void> {
  try {
    await fs.mkdir(dest, { recursive: true });
    
    // Check if source directory exists
    await fs.access(src);
    
    const entries = await fs.readdir(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        await copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  } catch (error) {
    // Better error reporting
    console.log(`Note: Template not found at ${src}, creating config only`);
    console.log(`Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}
