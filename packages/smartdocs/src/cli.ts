#!/usr/bin/env node
import { Command } from "commander";
import pc from "picocolors";
import ora from "ora";
import { build } from "./commands/build";
import { init } from "./commands/init";
import { dev } from "./commands/dev";
import { check } from "./commands/check";

const program = new Command();
program.name("smartdocs").description("Smart docs for React/Next").version("0.1.0-beta.0");

program.command("init")
  .description("Create smartdocs.config.ts and scaffold the docs template")
  .action(async () => {
    const spinner = ora("Scaffolding").start();
    try { await init(); spinner.succeed(pc.green("Init complete")); }
    catch (e: any) { spinner.fail(pc.red(e?.message ?? "Init failed")); process.exit(1); }
  });

program.command("build")
  .description("Scan project and generate static docs")
  .option("-c, --config <path>", "Path to config", "smartdocs.config.ts")
  .action(async (opts) => {
    const spinner = ora("Building docs").start();
    try { await build(opts); spinner.succeed(pc.green("Build complete")); }
    catch (e: any) { spinner.fail(pc.red(e?.message ?? "Build failed")); process.exit(1); }
  });

program.command("dev")
  .description("Watch & rebuild docs")
  .option("-p, --port <port>", "4400", "4400")
  .action(async (opts) => { await dev(opts); });

program.command("check")
  .description("Validate config and environment")
  .action(async () => { await check(); });

program.parse(process.argv);
