import { globby } from "globby";
import fs from "node:fs/promises";
import path from "node:path";
import { ConfigSchema, type Config } from "../config";
import { scanComponents, type ComponentDoc } from "../scan/react-fixed";
import { writeComponentPages } from "../generate/mdx";
import { analyzeComponentUsageInPages } from "../scan/usage-analysis";

export async function build(opts: { config?: string }) {
  const cfgPath = path.resolve(process.cwd(), opts.config ?? "smartdocs.config.ts");
  const config = await loadConfig(cfgPath);

  console.log("\n📂 Scanning project files...");
  
  // 1) Scan for all components, hooks, pages, etc.
  const patterns = config.entryPaths;
  const projectRoot = process.cwd();
  const components = await scanComponents(patterns, projectRoot);
  
  // 2) Analyze component usage for pages at build time
  console.log("\n🔍 Analyzing component usage in pages...");
  const componentsWithUsage = await analyzeComponentUsageInPages(components, projectRoot);

  // 3) Generate MDX files and search index in temp directory first
  const tempContentDir = path.join(config.outDir, "temp-content");
  await fs.rm(tempContentDir, { recursive: true, force: true });
  await fs.mkdir(tempContentDir, { recursive: true });

  console.log("\n📝 Generating MDX documentation...");
  await writeComponentPages(tempContentDir, componentsWithUsage);
  await fs.writeFile(path.join(tempContentDir, "search.json"), JSON.stringify({ components: componentsWithUsage }, null, 2));
  
  console.log("✓ Generated MDX files");

  // 3) Check if we have the site template available
  const siteTemplateDir = path.resolve(process.cwd(), config.outDir, "site");
  const siteExists = await fs.access(siteTemplateDir).then(() => true).catch(() => false);
  
  if (siteExists) {
    console.log("🏗️  Building unified documentation site...");
    
    // 4) Copy content FIRST (before Next.js build so getStaticProps can find it)
    const finalContentDir = path.join(config.outDir, "content");
    await fs.rm(finalContentDir, { recursive: true, force: true });
    await fs.mkdir(finalContentDir, { recursive: true });
    
    console.log("📦 Copying content files...");
    await copyDirectory(tempContentDir, finalContentDir);
    
    // 5) Build Next.js site directly in outDir (content is now available)
    await buildNextSiteUnified(siteTemplateDir, config.outDir);
    
    // Clean up temp directory and site template directory
    await fs.rm(tempContentDir, { recursive: true, force: true });
    await fs.rm(siteTemplateDir, { recursive: true, force: true });
    
    console.log("✓ Built unified documentation site in smartdocs/");
    console.log("🚀 Ready to deploy! Just point your hosting provider to the smartdocs/ directory");
  } else {
    console.log("⚠️  Site template not found. Run 'smartdocs init' first.");
  }
}

async function buildNextSiteUnified(siteTemplateDir: string, outputDir: string): Promise<void> {
  // 1) Move all files from siteTemplateDir to outputDir root (excluding node_modules if exists)
  const entries = await fs.readdir(siteTemplateDir, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(siteTemplateDir, entry.name);
    const destPath = path.join(outputDir, entry.name);
    
    // Skip node_modules during copy, we'll install fresh
    if (entry.name === 'node_modules') {
      continue;
    }
    
    if (entry.isDirectory()) {
      await fs.mkdir(destPath, { recursive: true });
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
  
  // 2) Build Next.js directly in the outputDir
  return buildNextSiteInPlace(outputDir);
}

async function buildNextSite(siteDir: string, outputDir: string): Promise<void> {
  const { spawn } = await import("node:child_process");
  
  return new Promise((resolve, reject) => {
    // Always check and ensure dependencies are installed
    const nodeModulesPath = path.join(siteDir, "node_modules");
    const packageLockPath = path.join(siteDir, "package-lock.json");
    
    // Check if dependencies need to be installed
    Promise.all([
      fs.access(nodeModulesPath).catch(() => false),
      fs.access(packageLockPath).catch(() => false)
    ]).then(([hasNodeModules, hasPackageLock]) => {
      
      if (!hasNodeModules || !hasPackageLock) {
        // Install dependencies first
        console.log("📦 Installing dependencies...");
        const install = spawn("npm", ["install"], { 
          cwd: siteDir, 
          stdio: "inherit",
          shell: true 
        });
        
        install.on("close", (code: number | null) => {
          if (code === 0) {
            runNextBuild();
          } else {
            reject(new Error(`npm install failed with code ${code}`));
          }
        });
        
        install.on("error", (err: Error) => {
          reject(new Error(`Failed to run npm install: ${err.message}`));
        });
      } else {
        // Dependencies exist, proceed with build
        runNextBuild();
      }
    });
    
    function runNextBuild() {
      const build = spawn("npm", ["run", "build"], { 
        cwd: siteDir, 
        stdio: "inherit",
        shell: true,
        env: { ...process.env, NODE_ENV: "production" }
      });
      
      build.on("close", (code: number | null) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Next.js build failed with code ${code}`));
        }
      });
      
      build.on("error", (err: Error) => {
        reject(new Error(`Failed to run Next.js build: ${err.message}`));
      });
    }
  });
}

async function buildNextSiteInPlace(buildDir: string): Promise<void> {
  const { spawn } = await import("node:child_process");
  
  return new Promise((resolve, reject) => {
    // Check if dependencies need to be installed
    const nodeModulesPath = path.join(buildDir, "node_modules");
    const packageLockPath = path.join(buildDir, "package-lock.json");
    
    Promise.all([
      fs.access(nodeModulesPath).catch(() => false),
      fs.access(packageLockPath).catch(() => false)
    ]).then(([hasNodeModules, hasPackageLock]) => {
      
      if (!hasNodeModules || !hasPackageLock) {
        // Install dependencies first
        console.log("📦 Installing dependencies...");
        const install = spawn("npm", ["install"], { 
          cwd: buildDir, 
          stdio: "inherit",
          shell: true 
        });
        
        install.on("close", (code: number | null) => {
          if (code === 0) {
            runNextBuild();
          } else {
            reject(new Error(`npm install failed with code ${code}`));
          }
        });
        
        install.on("error", (err: Error) => {
          reject(new Error(`Failed to run npm install: ${err.message}`));
        });
      } else {
        // Dependencies exist, proceed with build
        runNextBuild();
      }
    });
    
    function runNextBuild() {
      // Build Next.js in place (creates .next directory)
      const build = spawn("npm", ["run", "build"], { 
        cwd: buildDir, 
        stdio: "inherit",
        shell: true,
        env: { ...process.env, NODE_ENV: "production" }
      });
      
      build.on("close", (code: number | null) => {
        if (code === 0) {
          console.log("✓ Next.js build completed successfully");
          resolve();
        } else {
          reject(new Error(`Next.js build failed with code ${code}`));
        }
      });
      
      build.on("error", (err: Error) => {
        reject(new Error(`Failed to run Next.js build: ${err.message}`));
      });
    }
  });
}

async function copyDirectory(src: string, dest: string): Promise<void> {
  const entries = await fs.readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await fs.mkdir(destPath, { recursive: true });
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
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

