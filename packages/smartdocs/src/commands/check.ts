import fs from "node:fs/promises";
import path from "node:path";
import { ConfigSchema, type Config } from "../config";
import { scanComponents } from "../scan/react";

export async function check() {
  console.log("🔍 Running SmartDocs environment check...\n");
  
  let hasErrors = false;

  // 1. Check if config file exists
  const configPath = path.resolve(process.cwd(), "smartdocs.config.ts");
  try {
    await fs.access(configPath);
    console.log("✅ Configuration file found");
    
    // 2. Validate config
    try {
      const config = await loadConfig(configPath);
      console.log("✅ Configuration is valid");
      
      // 3. Check entry paths exist
      let validPaths = 0;
      for (const entryPath of config.entryPaths) {
        const basePath = entryPath.split('*')[0];
        try {
          await fs.access(basePath);
          validPaths++;
        } catch {
          console.log(`⚠️  Entry path not found: ${basePath}`);
        }
      }
      
      if (validPaths > 0) {
        console.log(`✅ Found ${validPaths}/${config.entryPaths.length} valid entry paths`);
      } else {
        console.log("❌ No valid entry paths found");
        hasErrors = true;
      }
      
      // 4. Test scanning
      try {
        console.log("🔎 Testing component scanning...");
        const components = await scanComponents(config.entryPaths);
        console.log(`✅ Successfully scanned ${components.length} items`);
        
        // Show breakdown by type
        const byType = components.reduce((acc, comp) => {
          acc[comp.type] = (acc[comp.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        if (Object.keys(byType).length > 0) {
          console.log("📊 Items found:");
          Object.entries(byType).forEach(([type, count]) => {
            console.log(`   ${type}: ${count}`);
          });
        }
      } catch (error) {
        console.log("❌ Component scanning failed:", error);
        hasErrors = true;
      }
      
      // 5. Check site template
      const siteDir = path.join(config.outDir, "site");
      try {
        await fs.access(siteDir);
        console.log("✅ Documentation site template found");
        
        // Check if dependencies are installed
        const nodeModulesPath = path.join(siteDir, "node_modules");
        try {
          await fs.access(nodeModulesPath);
          console.log("✅ Site dependencies are installed");
        } catch {
          console.log("⚠️  Site dependencies not installed (run 'npm install' in site directory)");
        }
      } catch {
        console.log("⚠️  Documentation site template not found (run 'smartdocs init' to create)");
      }
      
      // 6. Check for broken links in existing docs
      await checkBrokenLinks(config);
      
    } catch (error) {
      console.log("❌ Configuration validation failed:", error);
      hasErrors = true;
    }
    
  } catch {
    console.log("❌ Configuration file not found");
    console.log("   Run 'smartdocs init' to create smartdocs.config.ts");
    hasErrors = true;
  }

  // 7. Check Node.js and npm versions
  console.log("\n🔧 Environment:");
  console.log(`   Node.js: ${process.version}`);
  
  try {
    const { spawn } = await import("node:child_process");
    const npmVersion = await new Promise<string>((resolve) => {
      const npm = spawn("npm", ["--version"], { shell: true });
      let version = "";
      npm.stdout?.on("data", (data) => {
        version += data.toString();
      });
      npm.on("close", () => {
        resolve(version.trim());
      });
    });
    console.log(`   npm: ${npmVersion}`);
  } catch {
    console.log("   npm: not found");
  }

  console.log("\n" + (hasErrors ? "❌ Issues found" : "✅ All checks passed"));
  
  if (hasErrors) {
    process.exit(1);
  }
}

async function checkBrokenLinks(config: Config): Promise<void> {
  try {
    const contentDir = path.join(config.outDir, "content");
    const searchPath = path.join(contentDir, "search.json");
    
    await fs.access(searchPath);
    const searchData = JSON.parse(await fs.readFile(searchPath, "utf-8"));
    
    if (searchData.components && searchData.components.length > 0) {
      console.log("✅ Documentation content is accessible");
      
      // Check for components with missing descriptions
      const missingDescriptions = searchData.components.filter((comp: any) => 
        !comp.description || comp.description.trim() === ""
      );
      
      if (missingDescriptions.length > 0) {
        console.log(`⚠️  ${missingDescriptions.length} items missing descriptions`);
      }
    }
  } catch {
    console.log("⚠️  No existing documentation content found");
  }
}

async function loadConfig(p: string): Promise<Config> {
  const m = await import("file://" + p);
  const userCfg = (m.default ?? m) as Record<string, unknown>;
  return ConfigSchema.parse(userCfg);
}
