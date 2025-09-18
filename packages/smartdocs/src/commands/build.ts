import { globby } from "globby";
import fs from "node:fs/promises";
import path from "node:path";
import { ConfigSchema, type Config } from "../config";
import { scanComponents } from "../scan/react";
import { writeComponentPages } from "../generate/mdx";

export async function build(opts: { config?: string }) {
  const cfgPath = path.resolve(process.cwd(), opts.config ?? "smartdocs.config.ts");
  const config = await loadConfig(cfgPath);

  console.log("📂 Scanning project files...");
  
  // 1) Scan for all components, hooks, pages, etc.
  const patterns = config.entryPaths;
  const components = await scanComponents(patterns);
  
  console.log(`✓ Found ${components.length} items to document`);

  // 2) Generate MDX files and search index
  const contentDir = path.join(config.outDir, "content");
  await fs.rm(contentDir, { recursive: true, force: true });
  await fs.mkdir(contentDir, { recursive: true });

  console.log("📝 Generating MDX documentation...");
  await writeComponentPages(contentDir, components);
  await fs.writeFile(path.join(contentDir, "search.json"), JSON.stringify({ components }, null, 2));
  
  console.log("✓ Generated MDX files");

  // 3) Build the Next.js site
  const siteDir = path.resolve(process.cwd(), config.outDir, "site");
  const siteExists = await fs.access(siteDir).then(() => true).catch(() => false);
  
  if (siteExists) {
    console.log("🏗️  Building documentation site...");
    await buildNextSite(siteDir, config.siteOutDir);
    console.log("✓ Built static documentation site");
  } else {
    console.log("⚠️  Site template not found. Run 'smartdocs init' first.");
  }
}

async function buildNextSite(siteDir: string, outputDir: string): Promise<void> {
  const { spawn } = await import("node:child_process");
  
  return new Promise((resolve, reject) => {
    // Check if node_modules exists, if not install dependencies
    const nodeModulesPath = path.join(siteDir, "node_modules");
    
    fs.access(nodeModulesPath)
      .then(() => {
        // Dependencies exist, proceed with build
        runNextBuild();
      })
      .catch(() => {
        // Install dependencies first
        console.log("📦 Installing dependencies...");
        const install = spawn("npm", ["install"], { 
          cwd: siteDir, 
          stdio: "inherit",
          shell: true 
        });
        
        install.on("close", (code) => {
          if (code === 0) {
            runNextBuild();
          } else {
            reject(new Error(`npm install failed with code ${code}`));
          }
        });
      });
    
    function runNextBuild() {
      const build = spawn("npm", ["run", "export"], { 
        cwd: siteDir, 
        stdio: "inherit",
        shell: true,
        env: { ...process.env, NODE_ENV: "production" }
      });
      
      build.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Next.js build failed with code ${code}`));
        }
      });
    }
  });
}

async function loadConfig(p: string): Promise<Config> {
  let userCfg: any = {};
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const m = await import("file://" + p);
    userCfg = (m.default ?? m) as Record<string, unknown>;
  } catch {
    // no config? fall back to defaults
  }
  return ConfigSchema.parse(userCfg);
}
