# Contributing to SmartDocs 🧠✨

Thank you for your interest in contributing to SmartDocs! We're building the most **intelligent documentation tool** for React developers, and your contributions help make it even better.

SmartDocs revolutionizes documentation through advanced code analysis, route-aware detection, component dependency mapping, and beautiful modern UI. This document provides comprehensive guidelines for contributors.

## 🚀 Quick Start

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/smartdocs
   cd smartdocs
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Build the project**
   ```bash
   pnpm build
   ```

4. **Test your changes**
   ```bash
   cd packages/smartdocs
   npx smartdocs --help
   ```

5. **Test with demo project**
   ```bash
   cd ../../demo/demo-app
   npx smartdocs init
   npx smartdocs dev
   # Visit http://localhost:4400 to see the modern documentation site
   ```

## 🛠️ Development Setup

### Prerequisites
- Node.js 18 or higher
- pnpm (recommended) or npm
- Git

### Project Structure
```
smartdocs/
├── packages/
│   └── smartdocs/           # 🧠 Main intelligent package
│       ├── src/
│       │   ├── cli.ts       # CLI entry point
│       │   ├── config.ts    # Configuration schema
│       │   ├── commands/    # 🎯 Smart command implementations
│       │   │   ├── init.ts    # Intelligent initialization
│       │   │   ├── build.ts   # Enhanced build process
│       │   │   ├── dev.ts     # Hot-reload development
│       │   │   └── check.ts   # Health validation
│       │   ├── scan/        # 🔍 Advanced code analysis
│       │   │   ├── react-fixed.ts # Enhanced scanner with route detection
│       │   │   └── react.ts       # Legacy scanner
│       │   └── generate/    # 📝 Documentation generation
│       │       └── mdx.ts     # MDX generation with templates
│       └── templates/       # 🎨 Modern site templates
│           └── next-site/     # Beautiful Next.js documentation app
│               ├── components/  # Enhanced UI components
│               │   ├── Layout.tsx    # Gradient layouts
│               │   ├── Sidebar.tsx   # Smart navigation
│               │   ├── SearchBox.tsx # Fuzzy search
│               │   └── ComponentsList.tsx # Component listings
│               ├── pages/      # Documentation pages
│               │   ├── index.tsx          # Modern overview dashboard
│               │   ├── sitemap.tsx        # Interactive project tree
│               │   ├── packages/          # Dependency management
│               │   ├── components/[slug].tsx # Smart component pages
│               │   ├── hooks/[slug].tsx      # Hook documentation
│               │   ├── pages/[slug].tsx      # Page dependency maps
│               │   └── api/              # Data endpoints
│               └── styles/     # Modern Tailwind styling
├── demo/                    # 🧪 Example React application
│   └── demo-app/
│       ├── src/
│       │   ├── components/    # Example components
│       │   ├── hooks/         # Example hooks  
│       │   ├── pages/         # Example pages
│       │   ├── services/      # Example services
│       │   ├── utils/         # Example utilities
│       │   └── contexts/      # Example contexts
│       └── smartdocs.config.ts # Demo configuration
├── package.json             # 📦 Workspace configuration
├── pnpm-workspace.yaml      # pnpm workspace config  
├── README.md                # 📖 Enhanced documentation
└── CONTRIBUTING.md          # 🤝 This file
```

### Build Process
```bash
# Build all packages
pnpm build

# Watch mode for development (with hot reload)
pnpm -r dev

# Test the CLI with enhanced features
cd packages/smartdocs
npx smartdocs init
npx smartdocs build  # Test intelligent scanning
npx smartdocs dev    # Test modern UI with hot reload

# Test on demo project (comprehensive testing)
cd ../../demo/demo-app
npx smartdocs init
npx smartdocs dev    # See all features: dependency mapping, modern UI, smart categorization
```

### Key Development Features to Test

When making changes, ensure these core **intelligent features** work correctly:

🧠 **Smart Code Analysis**
- Component vs Page vs Hook vs Service detection
- Route-aware page identification
- Content-based categorization (not just file paths)

🎯 **Component Dependency Mapping**  
- Real component usage extraction (not imports)
- Visual colored dependency cards
- Usage count accuracy

🎨 **Modern UI Features**
- Gradient backgrounds and animations
- Scrollable sidebar with active states
- Enhanced search with fuzzy matching
- Responsive mobile design

⚡ **Enhanced Type Display**
- Complex object parameter breakdown (`{name: "", email: ""}` not `{...}`)
- Proper array, function, and primitive type display

## 📝 Making Changes

### Code Style & Standards
- **TypeScript First**: Use TypeScript for all new code
- **Intelligent Defaults**: Follow the "zero configuration" philosophy
- **JSDoc Documentation**: Comprehensive comments for public APIs  
- **Meaningful Names**: Variable and function names should be self-documenting
- **Error Handling**: Graceful degradation with helpful error messages
- **Performance**: Consider impact on large codebases (thousands of components)

### Architecture Principles

🧠 **Intelligence Over Configuration**
- Prefer smart detection over manual configuration
- Use content analysis, not just file paths
- Implement graceful fallbacks for edge cases

🎯 **User Experience First**  
- Beautiful, modern UI that developers want to use
- Fast performance with intelligent caching
- Responsive design for all devices

⚡ **Developer Experience**
- Hot reload for instant feedback
- Clear error messages with actionable solutions
- Comprehensive debugging information in development

### Comprehensive Testing Guide

#### 1. **Quick Validation with Demo Project**
   ```bash
   cd demo/demo-app
   pnpm build && npx smartdocs build
   npx smartdocs dev
   # Visit http://localhost:4400
   ```

   **Verify These Features Work:**
   - ✅ Smart categorization (components ≠ pages ≠ hooks ≠ services)
   - ✅ Component dependency cards on page documentation  
   - ✅ Modern UI with gradients, animations, scrollable sidebar
   - ✅ Enhanced search with fuzzy matching
   - ✅ Package dependency tracking in sidebar
   - ✅ Interactive project sitemap with file tree

#### 2. **Test Intelligent Detection Edge Cases**
   ```bash
   mkdir test-edge-cases && cd test-edge-cases
   npx smartdocs init
   ```
   
   Create these test files to verify smart detection:
   ```typescript
   // Should be COMPONENT (not page)  
   // src/Navigation.tsx - used in layout, not routes
   export function Navigation() { return <nav>...</nav>; }
   
   // Should be PAGE (route-aware detection)
   // src/pages/Dashboard.tsx - referenced in routing
   export default function Dashboard() { return <div>Dashboard</div>; }
   
   // Should be HOOK (use* naming + React hooks)
   // src/hooks/useAuth.ts
   export function useAuth() { return useState(null); }
   
   // Should be SERVICE (class-based)  
   // src/services/ApiService.ts
   export class ApiService { async get() { /* */ } }
   
   // Should be UTILITY (pure functions)
   // src/utils/formatters.ts  
   export function formatDate(date: Date) { return date.toISOString(); }
   ```

#### 3. **Test Component Dependency Extraction**
   Create a page that uses multiple components:
   ```typescript
   // src/pages/ContactPage.tsx
   import { Button } from '../components/Button';
   import { Input } from '../components/Input';
   import { useFormValidator } from '../hooks/useFormValidator';
   
   export default function ContactPage() {
     const validator = useFormValidator({
       email: "",
       name: "",
       message: ""
     });
     
     return (
       <form>
         <Input type="email" />
         <Input type="text" />
         <Button type="submit">Submit</Button>
       </form>
     );
   }
   ```
   
   **Expected Results:**
   - ContactPage shows **2 Components Used**: Button (1×), Input (2×)
   - ContactPage shows **1 Hook Used**: useFormValidator with object breakdown
   - Colored dependency cards with navigation links
   - Usage counts exclude imports, count only actual usage

#### 4. **Test Enhanced Type Display**
   Create hooks with complex parameters:
   ```typescript
   // Should display actual object properties, not {...}
   const [formData, setFormData] = useState({
     name: "",
     email: "",
     settings: { theme: "dark", notifications: true }
   });
   
   // Should show array contents
   const [items, setItems] = useState([1, 2, 3]);
   
   // Should identify function parameters
   const callback = useCallback((id: string) => {}, []);
   ```

#### 5. **Test CLI Commands with Real Projects**
   ```bash
   # Test all commands
   npx smartdocs init     # Should create intelligent config
   npx smartdocs check    # Should validate setup
   npx smartdocs build    # Should handle any project structure  
   npx smartdocs dev      # Should start with hot reload
   ```

#### 6. **Test Framework Compatibility**
   Test with different project structures:
   - ✅ Create React App
   - ✅ Next.js projects (App Router & Pages Router)
   - ✅ Vite projects  
   - ✅ React Router v7 projects
   - ✅ Monorepo structures
   - ✅ TypeScript strict mode

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Clear description** of the issue
2. **Steps to reproduce** the problem
3. **Expected vs actual behavior**
4. **Environment information**:
   - Node.js version
   - Operating system
   - Package version
5. **Code samples** or minimal reproduction case

### Bug Report Template
```markdown
## Bug Description
A clear description of what the bug is.

## Steps to Reproduce
1. Run `smartdocs init`
2. Create component with props
3. Run `smartdocs build`
4. See error

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Environment
- Node.js: v18.17.0
- OS: Windows 11
- SmartDocs: v0.1.0

## Additional Context
Any other context about the problem.
```

## ✨ Feature Requests

We welcome feature requests! Please:

1. **Check existing issues** to avoid duplicates
2. **Describe the use case** and motivation
3. **Provide examples** of how it would work
4. **Consider implementation complexity**

### Feature Request Template
```markdown
## Feature Description
A clear description of what you want to happen.

## Use Case
Describe the problem this feature would solve.

## Proposed Solution
Describe how you'd like this feature to work.

## Alternatives
Any alternative solutions you've considered.

## Additional Context
Any other context or screenshots.
```

## 🔧 Areas for Contribution

### 🚀 High Priority (Core Intelligence)
- **Enhanced Route Detection**: Support for more routing libraries (SvelteKit, Astro, Solid Router)
- **AI-Powered Analysis**: GPT integration for component description generation
- **Component Health Scoring**: Identify unused components, complexity metrics, maintainability scores
- **Dependency Graph Visualization**: Interactive network diagrams of component relationships
- **Performance Optimization**: Faster scanning for enterprise monorepos (10k+ components)

### 🎯 Medium Priority (User Experience)
- **Theme System**: Multiple modern design themes (Dark Pro, Light Minimal, Colorful, etc.)
- **Advanced Analytics**: Component usage patterns, dependency trends, technical debt insights
- **Export Formats**: PDF documentation, Confluence/Notion exports, Figma design tokens
- **Plugin Architecture**: Custom scanners, generators, and UI extensions
- **Team Collaboration**: Comments on components, approval workflows, version tracking

### 🌍 Framework Expansion  
- **Vue.js 3 Support**: Smart composition API detection, Pinia state analysis
- **Svelte/SvelteKit**: Component detection, store analysis, route scanning
- **Angular**: Component, service, and directive analysis with intelligent categorization
- **Solid.js**: Signal-based reactivity analysis
- **React Native**: Mobile component patterns, navigation analysis

### 📱 Modern Features
- **Real-time Collaboration**: Live editing, team comments, shared workspaces
- **Integration Ecosystem**: 
  - Storybook 7+ with new features
  - Figma design system sync
  - GitHub Actions workflows
  - VS Code extension with inline docs
  - Slack/Discord notifications
- **Enterprise Features**: SSO authentication, role-based permissions, audit logs

### 🧪 Developer Experience
- **Smart Code Generation**: Generate component boilerplate from documentation
- **Automated Testing**: Generate test templates based on component props
- **Design System Validation**: Ensure components follow design system guidelines
- **Migration Tools**: Help migrate from other documentation tools
- **CLI Enhancements**: Interactive component creation, smart scaffolding

### 📚 Documentation & Community
- **Interactive Tutorials**: Guided tours of SmartDocs features  
- **Video Content**: Feature demonstrations, setup guides, best practices
- **Community Templates**: Industry-specific templates (e-commerce, dashboards, etc.)
- **Best Practices Guide**: How to structure projects for optimal SmartDocs experience
- **API Reference**: Complete programmatic API for custom integrations

### 💡 Innovative Features (Future Vision)
- **Component Marketplace**: Share and discover reusable components
- **Automated Documentation Updates**: AI-powered description generation from code changes
- **Visual Component Builder**: Drag-and-drop component creation with automatic documentation
- **Design Token Integration**: Sync with design systems, show token usage in components
- **Accessibility Insights**: Automated a11y analysis and recommendations

## 📋 Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make your changes**
   - Follow the code style guidelines
   - Add tests for new functionality
   - Update documentation as needed

3. **Commit your changes**
   ```bash
   git commit -m 'feat: add amazing feature'
   ```
   
   Use conventional commit format:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation
   - `refactor:` for code refactoring
   - `test:` for adding tests

4. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

5. **Create a Pull Request**
   - Use the PR template
   - Link related issues
   - Provide clear description
   - Add screenshots for UI changes

### Pull Request Template
```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested locally
- [ ] Added/updated tests
- [ ] All tests pass

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Related Issues
Fixes #123
```

## 🧪 Comprehensive Testing Guidelines

### 🔍 **Intelligence Testing (Critical)**
These tests ensure SmartDocs' core intelligent features work correctly:

```bash
# Test smart categorization with edge cases
cd demo/demo-app && npx smartdocs build
# Verify: Navigation.tsx → Component (not Page)
# Verify: Dashboard.tsx → Page (route-aware detection)  
# Verify: useAuth.ts → Hook
# Verify: ApiService.ts → Service
```

**Categorization Test Checklist:**
- ✅ Components used in layouts are **not** classified as pages
- ✅ Files in routing configurations **are** classified as pages
- ✅ Hooks follow `use*` naming and React hook usage patterns
- ✅ Services use class-based or object-oriented patterns
- ✅ Utilities contain pure functions without React dependencies

### 🎯 **Component Dependency Testing**
```bash
# Create test page with multiple dependencies
# src/pages/TestPage.tsx
import { Button, Input, Modal } from '../components';
import { useForm, useAuth } from '../hooks';

export default function TestPage() {
  const form = useForm({ name: "", email: "" });
  const auth = useAuth();
  
  return (
    <div>
      <Input {...form.register('name')} />
      <Input {...form.register('email')} />  
      <Button onClick={auth.login}>Login</Button>
    </div>
  );
}
```

**Expected Results:**
- TestPage documentation shows **3 Components**: Button (1×), Input (2×), Modal (0× - filtered out)
- TestPage documentation shows **2 Hooks**: useForm, useAuth with parameter breakdown
- Colored dependency cards with correct usage counts
- Navigation links to full component documentation

### 🎨 **UI/UX Testing**
Manual testing checklist for modern interface:

**Desktop Testing:**
- ✅ Gradient backgrounds load properly
- ✅ Sidebar scrolls when > 5 items in category
- ✅ Active states highlight current page
- ✅ Search works with fuzzy matching
- ✅ Package count displays in sidebar
- ✅ Sitemap shows interactive file tree

**Mobile Testing:**
- ✅ Responsive design works on mobile devices
- ✅ Sidebar collapses/expands properly
- ✅ Touch interactions feel natural
- ✅ Search overlay works on mobile
- ✅ Component cards stack vertically

**Performance Testing:**
- ✅ Large projects (500+ components) scan in reasonable time
- ✅ Hot reload works quickly during development
- ✅ Search is responsive with large datasets
- ✅ No memory leaks during long dev sessions

### ⚡ **Enhanced Type Display Testing**
Create test cases for complex parameter types:

```typescript
// Test object parameters
useState({
  user: { name: "John", email: "john@example.com" },
  settings: { theme: "dark", notifications: true },
  preferences: [1, 2, 3]
});

// Expected: Full object breakdown, not {...}
// Expected: Arrays shown as [1, 2, 3], not [...]
// Expected: Nested objects handled gracefully
```

### 🚀 **CLI Command Testing**

```bash
# Test all CLI commands comprehensively
mkdir cli-test && cd cli-test

# Test 1: Initialize with intelligent defaults
npx smartdocs init
# Verify: Creates modern smartdocs.config.ts with comprehensive scanning
# Verify: Config includes proper exclusions for config files

# Test 2: Build with real components
# Create sample React components, hooks, pages
npx smartdocs build
# Verify: Generates .smartdocs directory with proper structure
# Verify: No parsing errors for config files
# Verify: Component categorization is accurate

# Test 3: Development server
npx smartdocs dev
# Verify: Starts on http://localhost:4400
# Verify: Hot reload works when files change
# Verify: Modern UI loads with all features

# Test 4: Health check
npx smartdocs check
# Verify: Validates configuration
# Verify: Checks for common issues
# Verify: Provides helpful error messages
```

### 🧪 **Framework Compatibility Testing**

**Create React App:**
```bash
npx create-react-app test-cra --template typescript
cd test-cra && npx smartdocs init && npx smartdocs build
```

**Next.js (App Router):**
```bash
npx create-next-app@latest test-nextjs --typescript --app  
cd test-nextjs && npx smartdocs init && npx smartdocs build
```

**Vite + React:**
```bash
npm create vite@latest test-vite -- --template react-ts
cd test-vite && npm install && npx smartdocs init && npx smartdocs build
```

**React Router v7:**
```bash
# Test with React Router v7 routing patterns
# Verify route-aware page detection works
```

### 🤖 **Automated Testing**
```bash
# Run comprehensive test suite
pnpm test

# Test specific modules
pnpm test src/scan/react-fixed.test.ts
pnpm test src/generate/mdx.test.ts

# Integration tests
pnpm test:integration

# Performance benchmarks
pnpm test:performance
```

### 🐛 **Regression Testing**
Before releasing, verify these previously fixed issues don't reoccur:

- ✅ Navigation components are not classified as pages
- ✅ Complex object parameters show actual properties, not `{...}`
- ✅ Config files (eslint.config.js, etc.) don't cause parsing errors  
- ✅ Component usage counts exclude imports, count only actual usage
- ✅ Package count displays correctly in sidebar
- ✅ TypeScript compatibility with matchAll and regex operations
- ✅ Hot reload works without memory leaks

## 📦 Beta Release Process

SmartDocs is currently in **BETA v0.1.0**. Here's how we handle releases:

### Publishing Beta Versions
```bash
# Build and test thoroughly
pnpm build
cd packages/smartdocs

# Publish with beta tag (required for pre-release versions)
pnpm publish --access public --tag beta

# Verify the beta release
npm view smartdocs@beta
```

### Version Guidelines
- **Beta versions**: `0.1.0-beta.X` for feature additions and improvements  
- **Patch versions**: `0.1.X` for bug fixes and minor enhancements
- **Minor versions**: `0.X.0` for significant new features
- **Major versions**: `X.0.0` for breaking changes (post-beta)

### Pre-Release Checklist
Before publishing any version:

- ✅ All tests pass (`pnpm test`)
- ✅ Demo project works (`cd demo/demo-app && npx smartdocs dev`)
- ✅ No TypeScript errors (`pnpm build`)
- ✅ README reflects current features
- ✅ CHANGELOG.md updated
- ✅ All intelligent features tested:
  - Smart categorization (components ≠ pages ≠ hooks)
  - Component dependency visualization  
  - Enhanced type display
  - Modern UI with gradients and animations
  - Route-aware page detection

### Beta Feedback Process
1. **GitHub Issues**: Report bugs and feature requests
2. **GitHub Discussions**: General feedback and questions
3. **Demo Videos**: Show your SmartDocs setup for feedback
4. **Real-world Testing**: Test with actual projects, not just demo

## 📚 Enhanced Documentation Standards

### README Updates
- **Feature Accuracy**: Keep feature lists current with actual capabilities
- **Code Examples**: Verify all code samples work with latest version
- **Screenshots**: Update UI screenshots when interface changes
- **Links**: Ensure all links work and point to correct resources

### Code Documentation  
- **JSDoc Standards**: Comprehensive comments for all public APIs
- **Algorithm Explanation**: Document complex logic (especially in scanning)
- **Design Decisions**: Explain why certain approaches were chosen
- **Usage Examples**: Include real-world usage patterns
- **Performance Notes**: Document any performance considerations

### Intelligent Feature Documentation
When documenting new intelligent features:

```typescript
/**
 * Analyzes code content to determine component type intelligently
 * 
 * Uses multiple detection methods:
 * 1. Content analysis (JSX usage, React patterns)
 * 2. Route pattern detection (actual routing usage)
 * 3. Naming conventions (use*, *Service, etc.)
 * 4. File structure analysis (with smart overrides)
 * 
 * @param fileContent - Raw file content to analyze
 * @param filePath - File path for context
 * @param allFiles - All project files for cross-reference analysis
 * @returns Component type with confidence score
 * 
 * @example
 * ```typescript
 * const type = analyzeCodeContent(
 *   "export function useAuth() { return useState(null); }",
 *   "src/hooks/useAuth.ts",
 *   projectFiles
 * );
 * // Returns: { type: 'hook', confidence: 0.95 }
 * ```
 */
function analyzeCodeContent(fileContent: string, filePath: string, allFiles: string[]) {
  // Implementation...
}
```

## 🎯 Code Review Guidelines

### For Contributors
- **Small, focused PRs** are easier to review
- **Self-review** your code before submitting
- **Respond promptly** to review feedback
- **Test thoroughly** before marking as ready

### For Reviewers
- **Be constructive** and helpful
- **Focus on the code**, not the person
- **Explain reasoning** behind suggestions
- **Approve promptly** when ready

## 🌟 Recognition

Contributors will be:
- Listed in the README contributors section
- Mentioned in release notes
- Invited to join the maintainers team (for significant contributions)

## 📞 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Discord**: [Join our community](https://discord.gg/smartdocs) (coming soon)

## 📄 License

By contributing to SmartDocs, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to SmartDocs! 🎉**