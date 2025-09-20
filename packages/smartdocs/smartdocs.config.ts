import { defineConfig } from "smartdocs/config";

export default defineConfig({
  projectName: "My App",
  entryPaths: ["**/*.{ts,tsx,js,jsx}"],
  include: ["./**"],
  exclude: ["**/__tests__/**","**/*.stories.*","node_modules/**","dist/**","build/**",".next/**",".nuxt/**","coverage/**","**/*.config.*","**/*.conf.*",".git/**",".vscode/**",".idea/**","public/**","static/**","assets/**"],
  outDir: "smartdocs",
  parse: { tsx: true, jsx: true }
});
