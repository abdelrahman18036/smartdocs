# SmartDocs 📚✨ 

> **Auto-generate beautiful, intelligent documentation for React/Next.js projects with zero configuration**

[![npm version](https://badge.fury.io/js/smartdocs.svg)](https://www.npmjs.com/package/smartdocs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

**🎉 NOW AVAILABLE ON NPM!** Install SmartDocs today: `npm i smartdocs`

SmartDocs revolutionizes documentation by intelligently scanning your React/Next.js codebase and generating a comprehensive, modern documentation site. It uses advanced content analysis and route detection to automatically categorize components, hooks, pages, services, and utilities while extracting detailed prop information, types, JSDoc comments, and component relationships.

**📦 [View on NPM](https://www.npmjs.com/package/smartdocs)** • **🚀 [Try it now](#-quick-start)** • **⭐ [Star on GitHub](https://github.com/abdelrahman18036/smartdocs)**

## ✨ Features

🧠 **Intelligent Code Analysis**
- **Smart Categorization**: Content-based detection of components, hooks, pages, services, utilities, and contexts
- **Route-Aware Page Detection**: Uses actual routing patterns (React Router, Next.js, etc.) to identify real pages
- **Component Dependency Mapping**: Shows which components/hooks each page uses with visual relationships
- **Advanced Type Extraction**: Displays complex object parameters with actual properties instead of `{...}`
- **Cross-Reference Analysis**: Tracks component usage patterns across your entire codebase

🔍 **Comprehensive Scanning**
- **Full Project Coverage**: Scans entire project with intelligent exclusion of config files and build artifacts
- **Multi-Framework Support**: React Router v7, Tanstack Router, Next.js, Remix, and more
- **Automatic Prop Extraction**: Types, defaults, and JSDoc comments with enhanced object parsing
- **Storybook Integration**: Examples from your existing stories
- **MDX File Processing**: Custom documentation pages

🎨 **Modern Documentation Site**
- **Beautiful UI**: Modern gradient backgrounds, animated elements, and responsive design
- **Component Visualization**: Interactive colored cards showing component relationships and usage counts
- **Enhanced Navigation**: Scrollable sidebar with active states, package counts, and visual indicators
- **Advanced Search**: Real-time fuzzy matching with comprehensive filtering
- **Interactive Sitemap**: File tree view of your entire project structure
- **Dark/Light Themes**: Complete theme support with smooth transitions

📊 **Rich Analytics & Insights**
- **Dependency Tracking**: Visual package dependency management with categorization
- **Usage Statistics**: See how often components are used across pages
- **Component Health**: Identify unused components and dependencies
- **Project Overview**: Dashboard with quick stats and navigation shortcuts

⚡ **Superior Developer Experience**
- **Zero Configuration**: Works out of the box with intelligent defaults
- **Lightning Fast**: Optimized scanning with smart caching and error handling
- **Hot Reload**: Instant updates during development with file watching
- **Static Export**: Deploy anywhere with pre-built static sites
- **TypeScript First**: Full TypeScript support with enhanced type display

## 🚀 Quick Start

### Install SmartDocs

```bash
# Install globally (recommended)
npm install -g smartdocs

# Or use directly with npx (no installation needed)
npx smartdocs init
```

### 1. Initialize Your Project

```bash
# Creates smartdocs.config.ts with intelligent defaults
smartdocs init
```

This creates:
- `smartdocs.config.ts` - **Intelligent configuration** with comprehensive scanning
- `.smartdocs/site/` - **Modern documentation site** template

### 2. Generate Documentation

```bash
# Build beautiful documentation site
smartdocs build
```

**Smart Process**: Scans entire project → Analyzes routes & dependencies → Generates enhanced MDX → Builds modern static site → Outputs to `smartdocs-dist/`

### 3. Development Mode  

```bash
# Start development server with hot-reload
smartdocs dev
```

Starts development server at http://localhost:4400 with:
- 🔥 **Hot-reload** for instant updates
- 🎨 **Modern UI** with beautiful gradients and animations  
- 📊 **Component dependency maps** showing relationships
- 🔍 **Enhanced search** with fuzzy matching
- 📱 **Mobile-responsive** design

> **📦 Available on npm**: [https://www.npmjs.com/package/smartdocs](https://www.npmjs.com/package/smartdocs)

## 📋 Commands

| Command | Description |
|---------|-------------|
| `smartdocs init` | Create config and scaffold docs template |
| `smartdocs build` | Generate static documentation site |
| `smartdocs dev` | Start development server with hot-reload |
| `smartdocs check` | Validate config and environment |

> **💡 Pro tip**: Install globally with `npm install -g smartdocs` to use `smartdocs` directly, or use `npx smartdocs` without installation

## ⚙️ Configuration

SmartDocs works with **zero configuration** but can be customized for advanced use cases.

`smartdocs.config.ts`:

```typescript
import { defineConfig } from "smartdocs/config";

export default defineConfig({
  projectName: "My Awesome App",
  entryPaths: ["**/*.{ts,tsx,js,jsx}"], // Scan entire project
  include: ["./**"], // Include everything by default
  exclude: [
    // Build artifacts and dependencies
    "node_modules/**",
    "dist/**", 
    "build/**",
    ".next/**",
    "out/**",
    // Configuration files
    "**/*.config.{js,ts,mjs,cjs}",
    "**/vite.config.*",
    "**/webpack.config.*",
    "**/rollup.config.*",
    "**/jest.config.*",
    "**/cypress.config.*",
    // Test and story files
    "**/__tests__/**",
    "**/*.test.{js,ts,jsx,tsx}",
    "**/*.spec.{js,ts,jsx,tsx}",
    "**/*.stories.*",
    // Hidden files and directories
    "**/.*/**",
    "**/.git/**",
    // Documentation and readme files
    "**/*.md",
    "**/LICENSE*",
    "**/CHANGELOG*"
  ],
  outDir: ".smartdocs",
  siteOutDir: "smartdocs-dist",
  parse: { 
    tsx: true, 
    jsx: true 
  }
});
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `projectName` | `string` | `"My Project"` | Name displayed in documentation |
| `entryPaths` | `string[]` | `["**/*.{ts,tsx,js,jsx}"]` | Glob patterns for scanning (now covers entire project) |
| `include` | `string[]` | `["./**"]` | Directories to include (comprehensive by default) |
| `exclude` | `string[]` | `[...extensive list]` | Intelligent exclusion of config, test, and build files |
| `outDir` | `string` | `".smartdocs"` | Output directory for generated files |
| `siteOutDir` | `string` | `"smartdocs-dist"` | Static site output directory |
| `parse.tsx` | `boolean` | `true` | Enable TypeScript JSX parsing |
| `parse.jsx` | `boolean` | `true` | Enable JavaScript JSX parsing |

### Intelligent Scanning

SmartDocs automatically:
- **🎯 Detects Components** based on JSX usage and React patterns
- **🪝 Identifies Hooks** using naming conventions (`use*`) and React hook calls
- **📄 Recognizes Pages** through route analysis and navigation patterns  
- **⚙️ Finds Services** via class definitions and service patterns
- **🛠️ Discovers Utilities** through pure function analysis
- **🌐 Maps Contexts** using React Context API patterns

## 📖 What Gets Documented

### React Components
```tsx
/**
 * A beautiful button component
 * @example
 * <Button variant="primary" onClick={() => alert('Hello!')}>
 *   Click me
 * </Button>
 */
interface ButtonProps {
  /** Button text content */
  children: React.ReactNode;
  /** Visual style variant */
  variant?: 'primary' | 'secondary';
  /** Click handler */
  onClick?: () => void;
  /** Whether button is disabled */
  disabled?: boolean;
}

export function Button({ children, variant = 'primary', ...props }: ButtonProps) {
  return <button className={`btn btn-${variant}`} {...props}>{children}</button>;
}
```

### Custom Hooks
```tsx
/**
 * Hook for managing local storage state
 * @param key Storage key
 * @param initialValue Default value
 * @returns [value, setValue] tuple
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // Implementation...
}
```

### API Routes (Next.js)
```tsx
/**
 * Get user profile
 * @param req Next.js request object
 * @param res Next.js response object
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Implementation...
}
```

### Pages
```tsx
/**
 * User dashboard page
 * Shows user statistics and recent activity
 */
export default function Dashboard() {
  // Implementation...
}
```

## 🎯 Advanced Features

### Component Dependency Visualization

SmartDocs creates **interactive dependency maps** showing which components and hooks each page uses:

```tsx
// ContactPage.tsx - SmartDocs automatically detects:
import { Button } from '../components/Button';
import { Input } from '../components/Input';  
import { useFormValidator } from '../hooks/useFormValidator';

export default function ContactPage() {
  const validator = useFormValidator(); // ✅ Detected as hook usage
  
  return (
    <form>
      <Input type="email" />      {/* ✅ Detected as component usage */}
      <Button type="submit">      {/* ✅ Detected as component usage */}
        Submit
      </Button>
    </form>
  );
}
```

**Result**: ContactPage documentation shows:
- 📦 **2 Components Used**: Button, Input (with usage counts and code examples)  
- 🪝 **1 Hook Used**: useFormValidator (with parameters and return values)
- 🔗 **Direct Navigation Links** to each component's full documentation

### Enhanced Type Extraction

Complex objects and parameters are displayed with **full property breakdowns**:

```tsx
// Before: useState({...})                    ❌ Not helpful
// After:  useState({                         ✅ Crystal clear!
//   name: "",
//   email: "", 
//   company: "",
//   newsletter: false,
//   +2 more properties
// })
```

### Intelligent Route Detection

SmartDocs analyzes your **actual routing configuration** to distinguish pages from components:

```tsx
// ✅ Correctly identified as PAGE (used in routes)
<Route path="/dashboard" element={<Dashboard />} />

// ✅ Correctly identified as COMPONENT (not in routes) 
<Navigation />  // Used in layout, not a route
```

Supports all major routing libraries: React Router v7, Tanstack Router, Next.js App Router, Remix, and more.

### Storybook Integration

SmartDocs automatically finds and includes examples from your Storybook stories:

```tsx
// Button.stories.tsx
export const Primary = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const Secondary = {
  args: {
    variant: 'secondary', 
    children: 'Secondary Button',
  },
};
```

### JSDoc Support

Rich JSDoc parsing for enhanced documentation:

```tsx
/**
 * Calculate the area of a circle
 * @param radius - The radius of the circle
 * @returns The area of the circle
 * @example
 * const area = calculateArea(5);
 * console.log(area); // 78.54
 */
function calculateArea(radius: number): number {
  return Math.PI * radius * radius;
}
```

### MDX Documentation

Include custom documentation pages:

```mdx
---
title: Getting Started
description: Learn how to use our components
---

# Getting Started

Welcome to our component library! Here's how to get started...
```

## 🏗️ Output Structure

```
your-project/
├── smartdocs.config.ts          # Configuration
├── .smartdocs/
│   ├── content/                 # Generated MDX files
│   │   ├── components/          # Component documentation
│   │   ├── hooks/              # Custom hook documentation  
│   │   ├── pages/              # Page documentation with dependency maps
│   │   ├── services/           # Service class documentation
│   │   ├── utils/              # Utility function documentation
│   │   ├── contexts/           # React Context documentation
│   │   ├── apis/               # API route documentation
│   │   └── search.json         # Enhanced search index
│   └── site/                   # Modern Next.js documentation app
│       ├── components/         # Enhanced UI components
│       │   ├── Layout.tsx      # Gradient layouts and modern styling
│       │   ├── Sidebar.tsx     # Scrollable nav with active states
│       │   └── SearchBox.tsx   # Advanced fuzzy search
│       ├── pages/             # Documentation pages
│       │   ├── index.tsx       # Beautiful overview dashboard
│       │   ├── sitemap.tsx     # Interactive project tree
│       │   ├── dependencies.tsx # Visual package management
│       │   └── [slug].tsx      # Smart component pages
│       └── styles/            # Modern Tailwind styling
└── smartdocs-dist/             # Static export (deploy anywhere!)
    ├── index.html              # Modern responsive design
    ├── _next/                  # Optimized assets
    └── sitemap.xml             # SEO-friendly sitemap
```

### Documentation Categories

SmartDocs automatically organizes your code into intelligent categories:

| Category | Icon | Detection Method | Examples |
|----------|------|------------------|----------|
| **Components** | 🧩 | JSX usage, React patterns | `Button.tsx`, `Modal.jsx`, `Layout.tsx` |
| **Hooks** | 🪝 | `use*` naming, React hook calls | `useAuth.ts`, `useLocalStorage.js` |
| **Pages** | 📄 | Route analysis, navigation patterns | `Dashboard.tsx`, `LoginPage.jsx` |
| **Services** | ⚙️ | Class definitions, service patterns | `ApiService.ts`, `AuthService.js` |
| **Utils** | 🛠️ | Pure functions, helper methods | `formatDate.ts`, `validators.js` |  
| **Contexts** | 🌐 | React Context API usage | `AuthContext.tsx`, `ThemeProvider.jsx` |
| **APIs** | 🌍 | Next.js API routes, endpoints | `api/users.ts`, `api/auth/login.js` |

## 🎨 Modern Documentation Experience

### 🌟 Beautiful Overview Dashboard
- **Hero Section**: Animated gradient backgrounds with floating elements
- **Quick Stats**: Live counts of components, hooks, pages, and dependencies  
- **Feature Showcase**: Highlight key capabilities with modern cards
- **Quick Actions**: Direct navigation to different documentation sections

### 🧭 Enhanced Navigation
- **Smart Sidebar**: Scrollable sections (5 visible + scroll for more)
- **Active States**: Visual indicators for current page and parent sections
- **Package Counts**: Live dependency tracking in navigation
- **Interactive Sitemap**: File tree view of entire project structure

### 📊 Component Relationship Mapping
- **Dependency Cards**: Beautiful colored rectangles showing component usage
- **Usage Statistics**: See how often each component/hook is used
- **Code Examples**: First usage context for each dependency
- **Direct Links**: Navigate immediately to full component documentation

### 🎯 Advanced Search & Filtering
- **Fuzzy Search**: Find anything across your entire documentation
- **Category Filtering**: Filter by components, hooks, pages, etc.
- **Real-time Results**: Instant search with smart ranking

### 📱 Responsive Design
- **Mobile-First**: Optimized for all screen sizes
- **Touch-Friendly**: Smooth interactions on mobile devices
- **Progressive Enhancement**: Works offline after initial load

## 🚀 Deployment

SmartDocs generates a static site that can be deployed anywhere:

### Vercel
```bash
npx smartdocs build
npx vercel --prod smartdocs-dist
```

### Netlify
```bash
npx smartdocs build
npx netlify deploy --prod --dir smartdocs-dist
```

### GitHub Pages
```bash
npx smartdocs build
# Copy smartdocs-dist contents to your gh-pages branch
```

### Docker
```dockerfile
FROM nginx:alpine
COPY smartdocs-dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm/yarn/pnpm

### Local Development

```bash
# Clone the repo
git clone https://github.com/abdelrahman18036/smartdocs
cd smartdocs

# Install dependencies
pnpm install

# Build the package
pnpm build

# Test in a project
cd /path/to/your-project
npx smartdocs init
npx smartdocs dev
```

### Project Structure

```
packages/
└── smartdocs/
    ├── src/
    │   ├── cli.ts              # CLI entry point
    │   ├── config.ts           # Configuration schema  
    │   ├── commands/           # CLI commands
    │   │   ├── init.ts         # Initialize with smart defaults
    │   │   ├── build.ts        # Intelligent build process
    │   │   ├── dev.ts          # Hot-reload development
    │   │   └── check.ts        # Validation and health checks
    │   ├── scan/               # Advanced code analysis
    │   │   ├── react-fixed.ts  # Enhanced React scanner with route detection
    │   │   └── react.ts        # Legacy React scanner
    │   └── generate/           # Documentation generation
    │       └── mdx.ts          # MDX file generator with templates
    └── templates/
        └── next-site/          # Modern documentation site template
            ├── components/     # Enhanced UI components
            │   ├── Layout.tsx      # Gradient layouts
            │   ├── Sidebar.tsx     # Smart navigation
            │   ├── SearchBox.tsx   # Fuzzy search
            │   └── ComponentsList.tsx # Component listings
            ├── pages/          # Documentation pages
            │   ├── index.tsx       # Modern overview
            │   ├── sitemap.tsx     # Project tree view
            │   ├── packages/       # Dependency management
            │   ├── components/[slug].tsx # Smart component pages
            │   ├── hooks/[slug].tsx     # Hook documentation
            │   ├── pages/[slug].tsx     # Page dependency maps
            │   └── api/        # Data endpoints
            └── styles/         # Modern Tailwind styling
demo/
└── demo-app/               # Example React application
    ├── src/
    │   ├── components/     # Example components
    │   ├── hooks/          # Example hooks
    │   ├── pages/          # Example pages
    │   ├── services/       # Example services
    │   ├── utils/          # Example utilities
    │   └── contexts/       # Example contexts
    └── smartdocs.config.ts # Demo configuration
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## ⭐ What Makes SmartDocs Special

- **🧠 Truly Intelligent**: Goes beyond simple file scanning to understand your app's architecture
- **🎯 Zero False Positives**: Advanced route detection prevents misclassification of components as pages
- **📊 Relationship Mapping**: See exactly how your components interact and depend on each other
- **🎨 Modern & Beautiful**: Not just functional—your documentation will be a joy to use
- **⚡ Enterprise Ready**: Scales from small projects to large monorepos with thousands of components
- **🔄 Live Updates**: Documentation stays in sync with your code automatically

## 🙏 Acknowledgments

- [react-docgen-typescript](https://github.com/styleguidist/react-docgen-typescript) - TypeScript component parsing
- [react-docgen](https://github.com/reactjs/react-docgen) - JavaScript component parsing  
- [Next.js](https://nextjs.org/) - Documentation site framework
- [Tailwind CSS](https://tailwindcss.com/) - Modern styling system
- [Fuse.js](https://fusejs.io/) - Intelligent fuzzy search
- [AST Explorer](https://astexplorer.net/) - Code analysis inspiration

---

**Built with ❤️ and 🧠 intelligence for the React community**

### Version 0.1.0 BETA Features:
✅ **Smart Content Analysis** - Knows components from pages from services  
✅ **Route-Aware Detection** - Uses your actual routing configuration  
✅ **Dependency Visualization** - See component relationships at a glance  
✅ **Modern UI Experience** - Beautiful, responsive, touch-friendly  
✅ **Enhanced Type Display** - No more `{...}` mysteries  
✅ **Full Project Scanning** - Covers your entire codebase intelligently  

[📖 Documentation](https://github.com/abdelrahman18036/smartdocs) • [📦 NPM Package](https://www.npmjs.com/package/smartdocs) • [🐙 GitHub](https://github.com/abdelrahman18036/smartdocs)