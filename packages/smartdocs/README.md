# SmartDocs 🧠✨

> **Auto-generate beautiful, intelligent documentation for React/Next.js projects with zero configuration**

[![npm version](https://badge.fury.io/js/smartdocs.svg)](https://www.npmjs.com/package/smartdocs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

SmartDocs intelligently analyzes your React codebase to create beautiful, modern documentation sites with zero configuration. It automatically categorizes components, hooks, pages, and services while generating component dependency visualizations.

## ✨ Key Features

- 🧠 **Smart Categorization**: Automatically detects components, hooks, pages, and services
- 🎨 **Beautiful UI**: Modern design with gradient backgrounds and animations
- ⚡ **Zero Config**: Works out of the box with intelligent defaults
- 📊 **Dependency Mapping**: Visual component relationship cards
- 🔍 **Enhanced Search**: Fuzzy matching across your codebase
- 🚀 **Hot Reload**: Instant updates during development

## 🚀 Quick Start

```bash
# Initialize project
npx smartdocs init

# Generate documentation
npx smartdocs build

# Start development server
npx smartdocs dev
```

SmartDocs automatically scans your codebase and generates a complete documentation site in `smartdocs/` directory.

## 📋 Commands

| Command | Description |
|---------|-------------|
| `npx smartdocs init` | Initialize with intelligent config |
| `npx smartdocs build` | Generate static documentation |
| `npx smartdocs dev` | Start development server |
| `npx smartdocs check` | Validate configuration |

## ⚙️ Configuration

```typescript
// smartdocs.config.ts
import { defineConfig } from "smartdocs/config";

export default defineConfig({
  projectName: "My App",
  entryPaths: ["**/*.{ts,tsx,js,jsx}"],
  exclude: ["node_modules/**", "dist/**"],
  outDir: "smartdocs"
});
```

## 🌍 Framework Support

- ✅ React Router, Next.js (App/Pages Router)
- ✅ Vite, Create React App
- ✅ TypeScript, Monorepos

## 🚀 Deploy

```bash
npx smartdocs build
npx vercel --prod smartdocs
# or upload smartdocs/ to any static host
```

## 🛠️ Requirements

- Node.js 18+
- React 16.8+
- npm/yarn/pnpm

## 📚 Links

- [GitHub](https://github.com/abdelrahman18036/smartdocs)
- [Issues](https://github.com/abdelrahman18036/smartdocs/issues)
- [npm](https://www.npmjs.com/package/smartdocs)

---

**Transform your React documentation with intelligence and beauty** ✨
