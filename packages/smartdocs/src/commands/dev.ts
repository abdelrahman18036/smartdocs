import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { watch } from "chokidar";
import { ConfigSchema, type Config } from "../config";
import { scanComponents, type ComponentDoc } from "../scan/react-fixed";
import { writeComponentPages } from "../generate/mdx";
import { analyzeComponentUsageInPages } from "../scan/usage-analysis";

export async function dev(opts: { port: string }) {
  const cfgPath = path.resolve(process.cwd(), "smartdocs.config.ts");
  const config = await loadConfig(cfgPath);
  const port = opts.port || "4400";

  // Initial build
  await buildDocumentation(config);
  
  // Start Next.js dev server (unified build - files are directly in outDir)
  const siteDir = path.resolve(process.cwd(), config.outDir);
  const packageJsonExists = await fs.access(path.join(siteDir, "package.json")).then(() => true).catch(() => false);
  
  if (!packageJsonExists) {
    console.log("⚠️  Site not built yet. Run 'smartdocs build' first.");
    return;
  }

  // Install dependencies if needed
  const nodeModulesPath = path.join(siteDir, "node_modules");
  const hasNodeModules = await fs.access(nodeModulesPath).then(() => true).catch(() => false);
  
  if (!hasNodeModules) {
    console.log("📦 Installing dependencies...");
    await runCommand("npm", ["install"], siteDir);
  }

  // Start file watcher
  startFileWatcher(config);

  // Start Next.js dev server
  console.log(`🌐 Starting docs site at http://localhost:${port}`);
  const devServer = spawn("npm", ["run", "dev"], {
    cwd: siteDir,
    stdio: "inherit",
    shell: true
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n⏹️  Shutting down...');
    devServer.kill();
    process.exit(0);
  });
}

async function buildDocumentation(config: Config): Promise<void> {
  console.log("📂 Scanning project files...");
  
  const patterns = config.entryPaths;
  const projectRoot = process.cwd();
  const components = await scanComponents(patterns, projectRoot);
  
  // Analyze component usage for pages at build time
  console.log("🔍 Analyzing component usage in pages...");
  const componentsWithUsage = await analyzeComponentUsageInPages(components, projectRoot);

  const contentDir = path.join(config.outDir, "content");
  await fs.mkdir(contentDir, { recursive: true });

  await writeComponentPages(contentDir, componentsWithUsage);
  await fs.writeFile(path.join(contentDir, "search.json"), JSON.stringify({ components: componentsWithUsage }, null, 2));
  
  console.log("✓ Updated documentation");
}

function startFileWatcher(config: Config): void {
  // Use chokidar for better cross-platform file watching
  const patterns = config.entryPaths.map(pattern => pattern.replace(/\*\*/g, '**'));
  
  const watcher = watch(patterns, {
    ignored: /node_modules/,
    ignoreInitial: true,
    persistent: true
  });

  watcher
    .on('change', async (filePath: string) => {
      await debouncedRebuild(config);
    })
    .on('add', async (filePath: string) => {
      await debouncedRebuild(config);
    })
    .on('unlink', async (filePath: string) => {
      await debouncedRebuild(config);
    });

  console.log(`�️  Watching for changes in: ${patterns.join(', ')}`);
  
  // Clean up on exit
  process.on('exit', () => watcher.close());
  process.on('SIGINT', () => watcher.close());
}

function debouncedRebuild(config: Config): Promise<void> {
  return new Promise((resolve) => {
    // Debounce rebuilds
    clearTimeout((global as any).__smartdocs_rebuild_timeout);
    (global as any).__smartdocs_rebuild_timeout = setTimeout(async () => {
      try {
        await buildDocumentation(config);
        resolve();
      } catch (error) {
        console.error('❌ Rebuild failed:', error);
        resolve();
      }
    }, 500);
  });
}

async function runCommand(cmd: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: "inherit", shell: true });
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${cmd} ${args.join(' ')} failed with code ${code}`));
      }
    });
  });
}

async function loadConfig(p: string): Promise<Config> {
  let userCfg: any = {};
  try {
    const m = await import("file://" + p);
    userCfg = (m.default ?? m) as Record<string, unknown>;
  } catch {
    // no config? fall back to defaults
  }
  return ConfigSchema.parse(userCfg);
}

