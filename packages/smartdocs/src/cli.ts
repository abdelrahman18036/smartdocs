#!/usr/bin/env node
import { Command } from "commander";
import pc from "picocolors";
import ora from "ora";
import { build } from "./commands/build";
import { init } from "./commands/init";
import { dev } from "./commands/dev";
import { check } from "./commands/check";

const program = new Command();
program.name("smartdocs")
  .description("🚀 Smart documentation generator for React/Next.js projects")
  .version("0.1.4");

program.command("init")
  .description("📋 Initialize SmartDocs in your project")
  .action(async () => {
    const spinner = ora("🔧 Setting up SmartDocs configuration and templates...").start();
    try { 
      await init(); 
      spinner.succeed(pc.green("✅ SmartDocs initialized successfully!")); 
    }
    catch (e: any) { 
      spinner.fail(pc.red("❌ Initialization failed: " + (e?.message ?? "Unknown error"))); 
      process.exit(1); 
    }
  });

program.command("build")
  .description("🏗️  Scan components and build static documentation site")
  .option("-c, --config <path>", "📄 Path to configuration file", "smartdocs.config.ts")
  .action(async (opts) => {
    const spinner = ora("🔍 Scanning project and building documentation...").start();
    try { 
      await build(opts); 
      spinner.succeed(pc.green("✅ Documentation built successfully!")); 
      console.log(pc.cyan("\n🌐 Documentation is ready!"));
      console.log(pc.white("  Run 'smartdocs dev' to preview your docs"));
    }
    catch (e: any) { 
      spinner.fail(pc.red("❌ Build failed: " + (e?.message ?? "Unknown error"))); 
      process.exit(1); 
    }
  });

program.command("dev")
  .description("🔥 Start development server with hot reload")
  .option("-p, --port <port>", "🌐 Port number for the development server", "4400")
  .action(async (opts) => { 
    console.log(pc.cyan("🚀 Starting SmartDocs development server..."));
    await dev(opts); 
  });

program.command("check")
  .description("🔍 Validate configuration and environment setup")
  .action(async () => { 
    console.log(pc.cyan("🔍 Checking SmartDocs configuration..."));
    await check(); 
  });

program.command("packages")
  .description("📦 Display all detected packages and their versions")
  .action(async () => {
    const spinner = ora("📦 Scanning project packages...").start();
    try {
      await displayPackages();
      spinner.succeed(pc.green("✅ Package scan complete!"));
    }
    catch (e: any) {
      spinner.fail(pc.red("❌ Package scan failed: " + (e?.message ?? "Unknown error")));
    }
  });

async function displayPackages() {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  
  try {
    // Read package.json from current directory
    const packageJsonPath = path.resolve(process.cwd(), "package.json");
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));
    
    console.log(pc.cyan("\n📦 Project Package Information"));
    console.log(pc.blue("═".repeat(50)));
    
    // Display main project info
    console.log(pc.white(`📋 Name: ${pc.bold(packageJson.name || "Unknown")}`));
    console.log(pc.white(`🔢 Version: ${pc.bold(packageJson.version || "Unknown")}`));
    console.log(pc.white(`📝 Description: ${packageJson.description || "No description"}`));
    
    // Display dependencies
    if (packageJson.dependencies) {
      console.log(pc.cyan("\n🔗 Dependencies:"));
      console.log(pc.blue("─".repeat(30)));
      
      const deps = Object.entries(packageJson.dependencies as Record<string, string>);
      deps.forEach(([name, version]) => {
        console.log(pc.white(`  ${pc.green("▪")} ${pc.bold(name)}: ${pc.gray(version)}`));
      });
    }
    
    // Display dev dependencies
    if (packageJson.devDependencies) {
      console.log(pc.cyan("\n🛠️  Dev Dependencies:"));
      console.log(pc.blue("─".repeat(30)));
      
      const devDeps = Object.entries(packageJson.devDependencies as Record<string, string>);
      devDeps.forEach(([name, version]) => {
        console.log(pc.white(`  ${pc.yellow("▪")} ${pc.bold(name)}: ${pc.gray(version)}`));
      });
    }
    
    // Display scripts
    if (packageJson.scripts) {
      console.log(pc.cyan("\n🎯 Available Scripts:"));
      console.log(pc.blue("─".repeat(30)));
      
      const scripts = Object.entries(packageJson.scripts as Record<string, string>);
      scripts.forEach(([name, command]) => {
        console.log(pc.white(`  ${pc.magenta("▶")} ${pc.bold(name)}: ${pc.dim(command)}`));
      });
    }
    
  } catch (error) {
    throw new Error("Could not read package.json. Make sure you're in a valid Node.js project.");
  }
}

program.parse(process.argv);
