import { z } from "zod";

export const ConfigSchema = z.object({
  projectName: z.string().default("My Project"),
  entryPaths: z.array(z.string()).default(["src/**/*.{ts,tsx,js,jsx}"]),
  include: z.array(z.string()).default(["src/**", "app/**", "pages/**"]),
  exclude: z.array(z.string()).default(["**/__tests__/**","**/*.stories.*","node_modules/**"]),
  outDir: z.string().default(".smartdocs"),
  siteOutDir: z.string().default("smartdocs-dist"),
  parse: z.object({ 
    tsx: z.boolean().default(true), 
    jsx: z.boolean().default(true) 
  }).default({ tsx: true, jsx: true })
});

export type Config = z.infer<typeof ConfigSchema>;

export function defineConfig(config: Partial<Config>): Config {
  return ConfigSchema.parse(config);
}