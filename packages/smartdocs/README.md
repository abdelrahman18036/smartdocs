# SmartDocs 🧠✨

> **Auto-generate beautiful, intelligent documentation for React/Next.js projects with zero configuration**

[![npm version](https://badge.fury.io/js/smartdocs.svg)](https://www.npmjs.com/package/smartdocs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

SmartDocs revolutionizes React documentation by **intelligently analyzing** your codebase to create comprehensive, modern documentation sites. Unlike traditional tools, SmartDocs uses advanced content analysis and route detection to automatically categorize components, hooks, pages, services, and utilities while generating beautiful component dependency visualizations.

## ✨ What Makes SmartDocs Different

🧠 **Truly Intelligent**
- **Smart Categorization**: Knows components from pages from hooks from services (not just file paths)
- **Route-Aware Detection**: Analyzes your actual routing configuration to identify real pages
- **Component Dependency Mapping**: Shows exactly which components each page uses with visual cards
- **Advanced Type Display**: Shows `{name: "", email: ""}` instead of cryptic `{...}`

🎨 **Beautiful & Modern**
- **Gradient Backgrounds**: Stunning animated UI that developers want to use
- **Interactive Navigation**: Scrollable sidebar with smart active states  
- **Responsive Design**: Perfect on desktop, tablet, and mobile
- **Enhanced Search**: Fuzzy matching across your entire codebase

⚡ **Developer Experience**
- **Zero Configuration**: Works out of the box with intelligent defaults
- **Hot Reload**: Instant updates during development
- **Lightning Fast**: Optimized for large codebases (1000+ components)
- **Framework Agnostic**: React Router, Next.js, Vite, CRA, and more
- **Deploy-Ready**: Single `.smartdocs/` directory contains everything needed

## 🚀 Quick Start

### Installation

```bash
# No installation needed! Use directly with npx
npx smartdocs init
```

### Initialize Your Project

```bash
# Creates smartdocs.config.ts with intelligent defaults
npx smartdocs init
```

### Generate Documentation

```bash
# Scans your entire project and builds beautiful docs
npx smartdocs build

# Everything is built into a single .smartdocs/ directory 
# - Ready for deployment to Vercel, Netlify, or any static host!
```

### Development Mode

```bash
# Start with hot reload at http://localhost:4400
npx smartdocs dev
```

That's it! SmartDocs automatically:
- 🔍 Scans your entire codebase intelligently  
- 🎯 Categorizes components, hooks, pages, services, and utilities
- 📊 Maps component dependencies and relationships
- 🎨 Generates a stunning documentation site
- 🚀 Serves it with hot reload for development

## 📖 What You Get

### Smart Component Analysis
```typescript
// SmartDocs automatically detects:

// ✅ COMPONENT (JSX usage, not in routes)
export function Navigation() { 
  return <nav>...</nav>; 
}

// ✅ PAGE (found in routing configuration)  
export default function Dashboard() {
  return <div>Dashboard</div>;
}

// ✅ HOOK (use* naming + React hooks)
export function useAuth() {
  return useState(null);
}

// ✅ SERVICE (class-based patterns)
export class ApiService {
  async get() { /* */ }
}

// ✅ UTILITY (pure functions)
export function formatDate(date: Date) {
  return date.toISOString();
}
```

### Component Dependency Visualization
```typescript
// ContactPage.tsx
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useForm } from '../hooks/useForm';

export default function ContactPage() {
  const form = useForm({ email: "", message: "" });
  
  return (
    <form>
      <Input {...form.register('email')} />
      <Button type="submit">Send</Button>
    </form>
  );
}
```

**Result**: ContactPage documentation automatically shows:
- 📦 **2 Components Used**: Button (1×), Input (1×) with colored cards
- 🪝 **1 Hook Used**: useForm with parameter breakdown
- 🔗 **Direct Links** to each component's full documentation
- 📝 **Code Examples** of actual usage

### Enhanced Type Display
```typescript
// Instead of confusing {...} displays:
useState({
  user: { name: "John", email: "john@example.com" },
  settings: { theme: "dark", notifications: true },
  items: [1, 2, 3]
});

// SmartDocs shows the actual structure with full breakdown
```

## ⚙️ Configuration

SmartDocs works with **zero configuration** but can be customized:

```typescript
// smartdocs.config.ts (auto-generated)
import { defineConfig } from "smartdocs/config";

export default defineConfig({
  projectName: "My Awesome App",
  entryPaths: ["**/*.{ts,tsx,js,jsx}"],
  include: ["./**"], // Scan everything
  exclude: [
    "node_modules/**",
    "dist/**",
    "**/*.config.*", // Smart exclusions
    "**/__tests__/**"
  ],
  outDir: ".smartdocs"  // Everything builds here - site + content
});
```

## 📱 Modern Documentation Experience

### 🌟 Beautiful Overview Dashboard
- Animated gradient backgrounds with floating elements
- Live component, hook, and dependency counts
- Quick navigation to different documentation sections

### 🧭 Smart Navigation  
- Scrollable sidebar (5 visible + scroll for more)
- Active states with visual indicators
- Package dependency tracking
- Interactive project sitemap

### 📊 Component Relationships
- Colored dependency cards showing usage patterns  
- Real-time usage statistics
- Code examples and navigation links
- Filter and search across all relationships

## 🚀 Deploy Anywhere

```bash
# Generate static site (everything goes into .smartdocs/)
npx smartdocs build

# Deploy to any static hosting - just point to .smartdocs/
npx vercel --prod .smartdocs
npx netlify deploy --prod --dir .smartdocs

# Or upload .smartdocs/ directory to your hosting provider
# Contains everything needed: HTML, CSS, JS, and content files
```

## 🌍 Framework Support

SmartDocs intelligently detects and works with:
- ✅ **React Router** (v6, v7) with route-aware page detection
- ✅ **Next.js** (App Router, Pages Router)  
- ✅ **Vite + React** with hot module replacement
- ✅ **Create React App** with TypeScript
- ✅ **Tanstack Router**, **Reach Router**
- ✅ **Monorepos** and custom webpack setups

## 🧪 Beta Version

SmartDocs is currently in **BETA v0.1.0** with all core intelligent features working:

✅ Smart content analysis and categorization  
✅ Route-aware page detection  
✅ Component dependency visualization  
✅ Modern UI with gradients and animations  
✅ Enhanced type display  
✅ Full project scanning with smart exclusions

## 📚 Documentation & Support

- **📖 Full Documentation**: [GitHub Repository](https://github.com/abdelrahman18036/smartdocs)
- **🐛 Bug Reports**: [GitHub Issues](https://github.com/abdelrahman18036/smartdocs/issues)
- **💡 Feature Requests**: [GitHub Discussions](https://github.com/abdelrahman18036/smartdocs/discussions)
- **🤝 Contributing**: [Contributing Guide](https://github.com/abdelrahman18036/smartdocs/blob/main/CONTRIBUTING.md)

## 📋 Commands Reference

| Command | Description |
|---------|-------------|
| `npx smartdocs init` | Initialize with intelligent config |
| `npx smartdocs build` | Generate static documentation |
| `npx smartdocs dev` | Start development server with hot reload |
| `npx smartdocs check` | Validate configuration and setup |

## 🛠️ Requirements

- **Node.js**: 18 or higher
- **Package Manager**: npm, yarn, or pnpm
- **React**: 16.8+ (hooks support)
- **TypeScript**: Optional but recommended

## 📄 License

MIT License - see [LICENSE](https://github.com/abdelrahman18036/smartdocs/blob/main/LICENSE)

## 🙏 Built With

- [react-docgen-typescript](https://github.com/styleguidist/react-docgen-typescript) - TypeScript component analysis
- [Next.js](https://nextjs.org/) - Modern documentation site framework  
- [Tailwind CSS](https://tailwindcss.com/) - Beautiful, responsive styling
- [Fuse.js](https://fusejs.io/) - Intelligent fuzzy search

---

**Transform your React documentation experience with intelligence and beauty** ✨

[📖 Full Documentation](https://github.com/abdelrahman18036/smartdocs) • [🐙 GitHub](https://github.com/abdelrahman18036/smartdocs) • [📦 npm](https://www.npmjs.com/package/smartdocs)
