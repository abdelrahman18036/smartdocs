import { defineConfig } from "smartdocs/config";

export default defineConfig({
  projectName: "My App",
  entryPaths: ["src/**/*.{ts,tsx,js,jsx}"],
  include: ["src/**","app/**","pages/**"],
  exclude: ["**/__tests__/**","**/*.stories.*","node_modules/**"],
  outDir: ".smartdocs",
  siteOutDir: "smartdocs-dist",
  parse: { tsx: true, jsx: true }
});
