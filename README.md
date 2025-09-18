# SmartDocs 📚✨ (BETA v0.1.0)

> **Auto-generate beautiful documentation for React/Next.js projects with zero configuration**

[![npm version](https://badge.fury.io/js/smartdocs.svg)](https://www.npmjs.com/package/smartdocs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

SmartDocs automatically scans your React/Next.js codebase and generates a beautiful, searchable documentation site. It extracts props, types, JSDoc comments, and examples from Storybook stories to create comprehensive documentation with zero manual work.

## ✨ Features

🔍 **Smart Scanning**
- React components, hooks, pages, and API routes
- Automatic prop extraction with types and defaults
- JSDoc comment parsing (`@param`, `@returns`, `@example`)
- Storybook story examples integration
- MDX file processing

🎨 **Beautiful Documentation Site**
- Modern Next.js-based documentation site
- Real-time search with fuzzy matching
- Dark/light theme support
- Responsive design with mobile-friendly sidebar
- Automatic categorization by type

⚡ **Developer Experience**
- Single command setup: `npx smartdocs init`
- Hot-reload development server
- File watching with instant updates
- Static export ready for deployment
- TypeScript support throughout

## 🚀 Quick Start

### 1. Initialize SmartDocs

```bash
npx smartdocs init
```

This creates:
- `smartdocs.config.ts` - Configuration file
- `.smartdocs/site/` - Documentation site template

### 2. Generate Documentation

```bash
npx smartdocs build
```

Scans your project → Generates MDX → Builds static site → Outputs to `smartdocs-dist/`

### 3. Development Mode

```bash
npx smartdocs dev
```

Starts development server at http://localhost:4400 with hot-reload

## 📋 Commands

| Command | Description |
|---------|-------------|
| `smartdocs init` | Create config and scaffold docs template |
| `smartdocs build` | Generate static documentation site |
| `smartdocs dev` | Start development server with hot-reload |
| `smartdocs check` | Validate config and environment |

## ⚙️ Configuration

`smartdocs.config.ts`:

```typescript
import { defineConfig } from "smartdocs/config";

export default defineConfig({
  projectName: "My Awesome App",
  entryPaths: ["src/**/*.{ts,tsx,js,jsx}"],
  include: [
    "src/components/**",
    "src/hooks/**", 
    "app/**",
    "pages/**"
  ],
  exclude: [
    "**/__tests__/**",
    "**/*.stories.*",
    "node_modules/**"
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
| `entryPaths` | `string[]` | `["src/**/*.{ts,tsx,js,jsx}"]` | Glob patterns for scanning |
| `include` | `string[]` | `["src/**", "app/**", "pages/**"]` | Directories to include |
| `exclude` | `string[]` | `["**/__tests__/**", "**/*.stories.*", "node_modules/**"]` | Patterns to exclude |
| `outDir` | `string` | `".smartdocs"` | Output directory for generated files |
| `siteOutDir` | `string` | `"smartdocs-dist"` | Static site output directory |
| `parse.tsx` | `boolean` | `true` | Enable TypeScript JSX parsing |
| `parse.jsx` | `boolean` | `true` | Enable JavaScript JSX parsing |

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
│   │   ├── components/          # Component docs
│   │   ├── hooks/              # Hook docs
│   │   ├── pages/              # Page docs
│   │   └── search.json         # Search index
│   └── site/                   # Next.js app
│       ├── components/         # Site components
│       ├── pages/             # Site pages
│       └── styles/            # Styling
└── smartdocs-dist/             # Static export (deploy this!)
    ├── index.html
    ├── _next/
    └── ...
```

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
    │   │   ├── init.ts         # Initialize command
    │   │   ├── build.ts        # Build command
    │   │   ├── dev.ts          # Development command
    │   │   └── check.ts        # Validation command
    │   ├── scan/               # Code scanning
    │   │   └── react.ts        # React component scanner
    │   └── generate/           # Documentation generation
    │       └── mdx.ts          # MDX file generator
    └── templates/
        └── next-site/          # Next.js documentation template
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

## 🙏 Acknowledgments

- [react-docgen-typescript](https://github.com/styleguidist/react-docgen-typescript) - TypeScript component parsing
- [react-docgen](https://github.com/reactjs/react-docgen) - JavaScript component parsing
- [Next.js](https://nextjs.org/) - Documentation site framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Fuse.js](https://fusejs.io/) - Fuzzy search

---

**Built with ❤️ for the React community**

[Documentation](https://github.com/abdelrahman18036/smartdocs) • [NPM Package](https://www.npmjs.com/package/smartdocs) • [GitHub](https://github.com/abdelrahman18036/smartdocs)