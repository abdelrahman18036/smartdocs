# SmartDocs 📚✨

<div align="center">

**🚀 Auto-generate beautiful, intelligent documentation for React/Next.js projects with zero configuration**

[![npm version](https://img.shields.io/npm/v/smartdocs?style=flat-square&color=blue)](https://www.npmjs.com/package/smartdocs)
[![npm downloads](https://img.shields.io/npm/dm/smartdocs?style=flat-square&color=green)](https://www.npmjs.com/package/smartdocs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
[![GitHub stars](https://img.shields.io/github/stars/abdelrahman18036/smartdocs?style=flat-square&color=yellow)](https://github.com/abdelrahman18036/smartdocs)

[📦 NPM Package](https://www.npmjs.com/package/smartdocs) • [🚀 Quick Start](#-quick-start) • [📖 Documentation](#-what-gets-documented) • [⭐ Star on GitHub](https://github.com/abdelrahman18036/smartdocs)

</div>

---

## 🌟 What is SmartDocs?

SmartDocs revolutionizes documentation by **intelligently scanning** your React/Next.js codebase and generating a **comprehensive, modern documentation site**. It uses advanced content analysis and route detection to automatically categorize components, hooks, pages, services, and utilities while extracting detailed prop information, types, JSDoc comments, and component relationships.

### ✨ Key Highlights

<table>
<tr>
<td width="33%">

**🧠 Truly Intelligent**
- Content-based detection vs file location
- Smart categorization of components, hooks, pages
- Advanced route analysis for accurate page detection

</td>
<td width="33%">

**🎨 Beautiful & Modern**
- Responsive documentation site with dark/light themes
- Interactive component dependency visualization
- Advanced search with fuzzy matching

</td>
<td width="33%">

**⚡ Zero Configuration**
- Works out of the box with intelligent defaults
- Hot-reload development with automatic rebuilds
- Deploy anywhere as static site

</td>
</tr>
</table>

---

## 🚀 Quick Start

### Installation

```bash
# Install globally (recommended)
npm install -g smartdocs

# Or use directly with npx (no installation needed)
npx smartdocs init
```

### 3-Step Setup

<table>
<tr>
<td width="10%"><div align="center"><strong>1️⃣</strong></div></td>
<td width="30%"><strong>Initialize</strong></td>
<td width="60%">

```bash
# If installed globally
smartdocs init

# Or with npx
npx smartdocs init
```
Creates configuration and site template with intelligent defaults

</td>
</tr>
<tr>
<td width="10%"><div align="center"><strong>2️⃣</strong></div></td>
<td width="30%"><strong>Build</strong></td>
<td width="60%">

```bash
# If installed globally
smartdocs build

# Or with npx
npx smartdocs build
```
Scans project → Analyzes dependencies → Generates beautiful docs

</td>
</tr>
<tr>
<td width="10%"><div align="center"><strong>3️⃣</strong></div></td>
<td width="30%"><strong>Develop</strong></td>
<td width="60%">

```bash
# If installed globally
smartdocs dev

# Or with npx
npx smartdocs dev
```
Starts dev server at http://localhost:4400 with hot-reload

</td>
</tr>
</table>

---

## ✨ Core Features

### 🧠 Intelligent Analysis
- **Smart Categorization**: Content-based detection of components, hooks, pages, services, utilities
- **Route-Aware Detection**: Uses actual routing patterns to distinguish pages from components  
- **Component Dependencies**: Maps which components/hooks each page uses with usage statistics
- **Advanced Type Extraction**: Displays complex object parameters with full property breakdowns

### 🎨 Modern Documentation Experience
- **Beautiful UI**: Modern gradient backgrounds, animations, responsive design
- **Component Visualization**: Interactive colored cards showing relationships and usage counts
- **Enhanced Navigation**: Scrollable sidebar with active states and visual indicators
- **Advanced Search**: Real-time fuzzy matching with comprehensive filtering
- **Interactive Sitemap**: File tree view of your entire project structure

### ⚡ Superior Developer Experience
- **Zero Configuration**: Works out of the box with intelligent defaults
- **Hot Reload**: Instant updates during development with file watching
- **Override System**: Easy type corrections with automatic rebuilds
- **Static Export**: Deploy anywhere with pre-built static sites
- **TypeScript First**: Full TypeScript support with enhanced type display

---

## 📋 Commands Reference

| Command | Description | Example |
|---------|-------------|---------|
| `smartdocs init` or `npx smartdocs init` | Create config and scaffold docs template | Creates `smartdocs.config.ts` |
| `smartdocs build` or `npx smartdocs build` | Generate static documentation site | Outputs to `smartdocs-dist/` |
| `smartdocs dev` or `npx smartdocs dev` | Start development server with hot-reload | Runs on `http://localhost:4400` |
| `smartdocs check` or `npx smartdocs check` | Validate config and environment | Health checks and validation |

---

## 📖 What Gets Documented

<details>
<summary><strong>🧩 React Components</strong></summary>

```tsx
/**
 * A beautiful button component with variants
 * @example
 * <Button variant="primary" onClick={() => alert('Hello!')}>
 *   Click me
 * </Button>
 */
interface ButtonProps {
  /** Button text content */
  children: React.ReactNode;
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'danger';
  /** Click handler */
  onClick?: () => void;
  /** Whether button is disabled */
  disabled?: boolean;
}

export function Button({ children, variant = 'primary', ...props }: ButtonProps) {
  return <button className={`btn btn-${variant}`} {...props}>{children}</button>;
}
```

**Auto-extracted**: Props, types, defaults, JSDoc comments, usage examples

</details>

<details>
<summary><strong>🪝 Custom Hooks</strong></summary>

```tsx
/**
 * Hook for managing local storage state with type safety
 * @param key Storage key
 * @param initialValue Default value
 * @returns [value, setValue] tuple
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });
  // Implementation...
}
```

**Auto-extracted**: Hook signature, parameters, return types, usage patterns

</details>

<details>
<summary><strong>📄 Pages with Dependencies</strong></summary>

```tsx
// ContactPage.tsx - SmartDocs automatically detects:
import { Button } from '../components/Button';
import { Input } from '../components/Input';  
import { useFormValidator } from '../hooks/useFormValidator';

export default function ContactPage() {
  const validator = useFormValidator(); // ✅ Hook usage detected
  
  return (
    <form>
      <Input type="email" />      {/* ✅ Component usage detected */}
      <Button type="submit">      {/* ✅ Component usage detected */}
        Submit
      </Button>
    </form>
  );
}
```

**Smart Analysis**: Shows component dependencies, usage counts, code examples

</details>

<details>
<summary><strong>⚙️ Services & Utilities</strong></summary>

```tsx
/**
 * API service for user management
 */
export class UserService {
  static async getUser(id: string): Promise<User> {
    // Implementation...
  }
}

/**
 * Utility for date formatting
 * @param date Date to format
 * @param format Format string
 */
export function formatDate(date: Date, format: string): string {
  // Implementation...
}
```

**Auto-detected**: Service classes, utility functions, API methods

</details>

---

## ⚙️ Configuration

SmartDocs works with **zero configuration** but can be customized:

<details>
<summary><strong>📁 smartdocs.config.ts</strong></summary>

```typescript
import { defineConfig } from "smartdocs/config";

export default defineConfig({
  projectName: "My Awesome App",
  entryPaths: ["**/*.{ts,tsx,js,jsx}"], // Scan entire project
  include: ["./**"], // Include everything by default
  exclude: [
    // Smart defaults - build artifacts, config files, tests
    "node_modules/**", "dist/**", "build/**", ".next/**",
    "**/*.config.{js,ts}", "**/*.test.{js,ts,jsx,tsx}",
    "**/*.stories.*", "**/.*/**", "**/*.md"
  ],
  outDir: "smartdocs",
  siteOutDir: "smartdocs-dist",
  parse: { tsx: true, jsx: true }
});
```

</details>

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `projectName` | `string` | `"My Project"` | Name displayed in documentation |
| `entryPaths` | `string[]` | `["**/*.{ts,tsx,js,jsx}"]` | Glob patterns for scanning |
| `exclude` | `string[]` | Smart defaults | Files/folders to exclude |
| `outDir` | `string` | `"smartdocs"` | Site generation directory |
| `siteOutDir` | `string` | `"smartdocs-dist"` | Static export directory |

---

## 🏗️ Advanced Features

### 🔍 Component Dependency Visualization

SmartDocs creates **interactive dependency maps** showing component relationships:

```tsx
// Dashboard.tsx uses:
// → 2 Components: Header, UserCard  
// → 1 Hook: useAuth
// → 1 Service: AnalyticsService
```

**Visual Output**: Beautiful colored cards with usage counts and direct links

### 🧠 Smart Type Detection  

Complex objects show **full property breakdowns**:

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

### 🛣️ Intelligent Route Analysis

Distinguishes pages from components using **actual routing configuration**:

```tsx
// ✅ PAGE (used in routes)
<Route path="/dashboard" element={<Dashboard />} />

// ✅ COMPONENT (used in layouts)  
<Navigation />
```

Supports: React Router v7, Tanstack Router, Next.js, Remix, and more.

---

## 🎨 Documentation Categories

SmartDocs automatically organizes code into intelligent categories:

<table>
<thead>
<tr>
<th width="20%">Category</th>
<th width="10%">Icon</th>
<th width="35%">Detection Method</th>
<th width="35%">Examples</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Components</strong></td>
<td align="center">🧩</td>
<td>JSX usage, React patterns</td>
<td><code>Button.tsx</code>, <code>Modal.jsx</code></td>
</tr>
<tr>
<td><strong>Hooks</strong></td>
<td align="center">🪝</td>
<td><code>use*</code> naming, React hook calls</td>
<td><code>useAuth.ts</code>, <code>useLocalStorage.js</code></td>
</tr>
<tr>
<td><strong>Pages</strong></td>
<td align="center">📄</td>
<td>Route analysis, navigation patterns</td>
<td><code>Dashboard.tsx</code>, <code>LoginPage.jsx</code></td>
</tr>
<tr>
<td><strong>Services</strong></td>
<td align="center">⚙️</td>
<td>Class definitions, service patterns</td>
<td><code>ApiService.ts</code>, <code>AuthService.js</code></td>
</tr>
<tr>
<td><strong>Utils</strong></td>
<td align="center">🛠️</td>
<td>Pure functions, helper methods</td>
<td><code>formatDate.ts</code>, <code>validators.js</code></td>
</tr>
<tr>
<td><strong>Contexts</strong></td>
<td align="center">🌐</td>
<td>React Context API usage</td>
<td><code>AuthContext.tsx</code>, <code>ThemeProvider.jsx</code></td>
</tr>
</tbody>
</table>

---

## 🚀 Deployment

Deploy your documentation site anywhere:

<table>
<tr>
<td width="25%">

**Vercel**
```bash
# Build docs
smartdocs build
# or: npx smartdocs build

# Deploy
npx vercel --prod smartdocs-dist
```

</td>
<td width="25%">

**Netlify**  
```bash
# Build docs
smartdocs build
# or: npx smartdocs build

# Deploy
npx netlify deploy --prod --dir smartdocs-dist
```

</td>
<td width="25%">

**GitHub Pages**
```bash
# Build docs
smartdocs build
# or: npx smartdocs build

# Copy smartdocs-dist to gh-pages
```

</td>
<td width="25%">

**Docker**
```dockerfile
FROM nginx:alpine
COPY smartdocs-dist /usr/share/nginx/html
EXPOSE 80
```

</td>
</tr>
</table>

---

## 🏗️ Project Structure

<details>
<summary><strong>📁 Generated Output Structure</strong></summary>

```
your-project/
├── smartdocs.config.ts          # Configuration
├── smartdocs/
│   ├── content/                 # Generated MDX files
│   │   ├── components/          # Component documentation
│   │   ├── hooks/              # Hook documentation  
│   │   ├── pages/              # Page documentation with dependencies
│   │   ├── services/           # Service documentation
│   │   ├── utils/              # Utility documentation
│   │   └── search.json         # Search index
│   └── site/                   # Next.js documentation app
│       ├── components/         # UI components
│       ├── pages/             # Documentation pages
│       └── styles/            # Tailwind styling
└── smartdocs-dist/             # Static export (ready to deploy!)
    ├── index.html
    ├── _next/
    └── sitemap.xml
```

</details>

---

## 🛠️ Development

<details>
<summary><strong>🔧 Local Development Setup</strong></summary>

```bash
# Clone the repository
git clone https://github.com/abdelrahman18036/smartdocs
cd smartdocs

# Install dependencies
pnpm install

# Build the package
pnpm build

# Test in a project
cd /path/to/your-project
npx smartdocs init    # or: smartdocs init (if installed globally)
npx smartdocs dev     # or: smartdocs dev (if installed globally)
```

**Prerequisites**: Node.js 18+, npm/yarn/pnpm

</details>

---

## 🤝 Contributing

We welcome contributions! 

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)  
5. **Open** a Pull Request

See our [Contributing Guide](CONTRIBUTING.md) for details.

---

## ⭐ What Makes SmartDocs Special

<table>
<tr>
<td width="50%">

### 🧠 **Truly Intelligent**
- Goes beyond simple file scanning
- Understands your app's architecture
- Zero false positives with smart detection

### 📊 **Relationship Mapping** 
- See exactly how components interact
- Visual dependency tracking
- Usage statistics and patterns

</td>
<td width="50%">

### 🎨 **Modern & Beautiful**
- Not just functional—joy to use
- Responsive design with dark/light themes
- Interactive visualizations

### ⚡ **Enterprise Ready**
- Scales from small projects to large monorepos
- Thousands of components supported
- Live updates and hot-reload

</td>
</tr>
</table>

---

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [react-docgen-typescript](https://github.com/styleguidist/react-docgen-typescript) - TypeScript component parsing
- [Next.js](https://nextjs.org/) - Documentation site framework
- [Tailwind CSS](https://tailwindcss.com/) - Modern styling system
- [Fuse.js](https://fusejs.io/) - Intelligent fuzzy search

---

<div align="center">

**Built with ❤️ and 🧠 intelligence for the React community**

[📖 Documentation](https://github.com/abdelrahman18036/smartdocs) • [📦 NPM Package](https://www.npmjs.com/package/smartdocs) • [🐙 GitHub](https://github.com/abdelrahman18036/smartdocs)

**⭐ Star us on GitHub if SmartDocs helped you!**

</div>