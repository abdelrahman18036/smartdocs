import * as reactDocgenTs from "react-docgen-typescript";
import { parse as parseJsx } from "react-docgen";
import * as babelParser from "@babel/parser";
import { globby } from "globby";
import fs from "node:fs/promises";
import path from "node:path";

// User override types
export interface ComponentOverride {
  filePath: string;
  componentName: string;
  originalType: 'component' | 'hook' | 'page';
  overrideType: 'component' | 'hook' | 'page';
  timestamp: string;
  reason?: string;
}

export interface OverridesConfig {
  version: string;
  overrides: ComponentOverride[];
}

export type ComponentDoc = {
  displayName: string;
  filePath: string;
  description?: string;
  type: 'component' | 'hook' | 'page' | 'api' | 'service' | 'util' | 'mdx';
  props: Array<{
    name: string; type: string; required: boolean;
    defaultValue?: string; description?: string;
  }>;
  examples?: string[];
  realUsageExamples?: string[];
  // Hook-specific fields
  hookSignature?: string;
  parameters?: Array<{
    name: string; type: string; required: boolean;
    description?: string;
  }>;
  returnType?: {
    type: string;
    description?: string;
  };
  // Enhanced hook usage tracking
  hookUsages?: Array<{
    file: string;
    line: number;
    code: string;
    context: string;
    destructuring?: string[];
    parameters?: any[];
    defaults?: Record<string, any>;
  }>;
  isBuiltInHook?: boolean;
  hookCategory?: 'state' | 'effect' | 'performance' | 'custom' | 'context' | 'ref';
  jsdoc?: {
    description?: string;
    params?: Array<{ name: string; type: string; description: string; }>;
    returns?: { type: string; description: string; };
    examples?: string[];
  };
};

const isTs = (f: string) => /\.(ts|tsx)$/.test(f);
const isJs = (f: string) => /\.(js|jsx)$/.test(f);
const isMdx = (f: string) => /\.(md|mdx)$/.test(f);
// Content-based type detection (not location-based)
const isHook = (name: string) => name.startsWith('use');


// Override management functions
const loadOverrides = async (projectRoot: string): Promise<OverridesConfig> => {
  const overridesPath = path.join(projectRoot, '.smartdocs-overrides.json');
  
  try {
    const content = await fs.readFile(overridesPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    // Return empty config if file doesn't exist
    return {
      version: '1.0.0',
      overrides: []
    };
  }
};

const saveOverrides = async (projectRoot: string, config: OverridesConfig): Promise<void> => {
  const overridesPath = path.join(projectRoot, '.smartdocs-overrides.json');
  
  try {
    await fs.writeFile(overridesPath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.warn('Failed to save overrides file:', error);
  }
};

const findOverride = (overrides: ComponentOverride[], filePath: string, componentName: string): ComponentOverride | undefined => {
  return overrides.find(override => 
    override.filePath === filePath && override.componentName === componentName
  );
};

// Export function to add/update overrides (for API use)
export const updateComponentOverride = async (
  projectRoot: string, 
  filePath: string, 
  componentName: string, 
  originalType: ComponentDoc['type'], 
  newType: ComponentDoc['type'], 
  reason?: string
): Promise<void> => {
  const config = await loadOverrides(projectRoot);
  
  // Find existing override or create new one
  const existingIndex = config.overrides.findIndex(override => 
    override.filePath === filePath && override.componentName === componentName
  );
  
  const newOverride: ComponentOverride = {
    filePath,
    componentName,
    originalType: originalType as 'component' | 'hook' | 'page',
    overrideType: newType as 'component' | 'hook' | 'page',
    timestamp: new Date().toISOString(),
    reason
  };
  
  if (existingIndex >= 0) {
    config.overrides[existingIndex] = newOverride;
  } else {
    config.overrides.push(newOverride);
  }
  
  await saveOverrides(projectRoot, config);
};

// Export function to remove overrides (for API use)
export const removeComponentOverride = async (
  projectRoot: string, 
  filePath: string, 
  componentName: string
): Promise<void> => {
  const config = await loadOverrides(projectRoot);
  config.overrides = config.overrides.filter(override => 
    !(override.filePath === filePath && override.componentName === componentName)
  );
  await saveOverrides(projectRoot, config);
};

// Helper function to detect page-specific content patterns
const hasPageSpecificPatterns = (fileContent: string): boolean => {
  const pagePatterns = [
    // Next.js specific functions
    'getStaticProps', 'getServerSideProps', 'getStaticPaths', 'generateStaticParams', 'generateMetadata',
    // React Router hooks
    'useParams', 'useSearchParams', 'useNavigate', 'useLocation', 'useRouteLoaderData',
    // Next.js router hooks
    'useRouter', 'usePathname', 'useSearchParams',
    // Page lifecycle patterns
    'Head from', 'metadata =', 'export const metadata',
    // Common page patterns
    'params:', 'searchParams:', 'query:', 'slug:'
  ];
  
  return pagePatterns.some(pattern => fileContent.includes(pattern));
};

// Helper function to check if component is referenced in routes/navigation
const isReferencedInRoutes = async (filePath: string, componentName: string): Promise<boolean> => {
  try {
    // Get project root directory
    const projectRoot = path.dirname(filePath);
    let currentDir = projectRoot;
    
    // Go up directories to find project root (where package.json is)
    while (currentDir && !await fs.access(path.join(currentDir, 'package.json')).then(() => true).catch(() => false)) {
      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) break; // reached filesystem root
      currentDir = parentDir;
    }
    
    // Enhanced routing/navigation file patterns with descriptions
    const routingPatterns = [
      // React Router configuration files
      { pattern: '**/*router*', type: 'router_config', description: 'React Router configuration files' },
      { pattern: '**/*route*', type: 'route_config', description: 'Route configuration files' },
      { pattern: '**/*routes*', type: 'routes_config', description: 'Routes definition files' },
      { pattern: '**/router.{ts,tsx,js,jsx}', type: 'router_file', description: 'Router implementation files' },
      { pattern: '**/routes.{ts,tsx,js,jsx}', type: 'routes_file', description: 'Routes definition files' },
      { pattern: '**/routing.{ts,tsx,js,jsx}', type: 'routing_file', description: 'Routing logic files' },
      
      // Navigation components
      { pattern: '**/*nav*', type: 'navigation', description: 'Navigation components' },
      { pattern: '**/*navigation*', type: 'navigation', description: 'Navigation components' },
      { pattern: '**/*menu*', type: 'menu', description: 'Menu components' },
      { pattern: '**/*sidebar*', type: 'sidebar', description: 'Sidebar components' },
      { pattern: '**/*header*', type: 'header', description: 'Header components' },
      { pattern: '**/*layout*', type: 'layout', description: 'Layout components' },
      
      // Main application files
      { pattern: '**/App.{ts,tsx,js,jsx}', type: 'main_app', description: 'Main App component' },
      { pattern: '**/app.{ts,tsx,js,jsx}', type: 'main_app', description: 'Main app files' },
      { pattern: '**/index.{ts,tsx,js,jsx}', type: 'index', description: 'Index/entry files' },
      { pattern: '**/main.{ts,tsx,js,jsx}', type: 'main', description: 'Main entry files' },
      
      // Next.js App Router (v13+)
      { pattern: '**/app/**/page.{ts,tsx,js,jsx}', type: 'nextjs_app_page', description: 'Next.js App Router pages' },
      { pattern: '**/app/**/layout.{ts,tsx,js,jsx}', type: 'nextjs_app_layout', description: 'Next.js App Router layouts' },
      { pattern: '**/app/**/loading.{ts,tsx,js,jsx}', type: 'nextjs_app_loading', description: 'Next.js App Router loading UI' },
      { pattern: '**/app/**/error.{ts,tsx,js,jsx}', type: 'nextjs_app_error', description: 'Next.js App Router error UI' },
      { pattern: '**/app/**/not-found.{ts,tsx,js,jsx}', type: 'nextjs_app_notfound', description: 'Next.js App Router not-found' },
      { pattern: '**/app/globals.css', type: 'nextjs_app_styles', description: 'Next.js App Router global styles' },
      
      // Next.js Pages Router (traditional)
      { pattern: '**/pages/**/*.{ts,tsx,js,jsx}', type: 'nextjs_page', description: 'Next.js Pages Router pages' },
      { pattern: '**/pages/_app.{ts,tsx,js,jsx}', type: 'nextjs_app_component', description: 'Next.js App component' },
      { pattern: '**/pages/_document.{ts,tsx,js,jsx}', type: 'nextjs_document', description: 'Next.js Document component' },
      { pattern: '**/pages/api/**/*.{ts,tsx,js,jsx}', type: 'nextjs_api', description: 'Next.js API routes' },
      
      // Framework-specific patterns
      { pattern: '**/src/app/**/*.{ts,tsx,js,jsx}', type: 'app_router', description: 'App router files' },
      { pattern: '**/src/pages/**/*.{ts,tsx,js,jsx}', type: 'pages_router', description: 'Pages router files' },
      
      // Configuration and utility files
      { pattern: '**/config/**/*.{ts,tsx,js,jsx}', type: 'config', description: 'Configuration files' },
      { pattern: '**/*link*', type: 'link_component', description: 'Link components' },
      { pattern: '**/*breadcrumb*', type: 'breadcrumb', description: 'Breadcrumb components' }
    ];

    const patterns = routingPatterns.map(p => p.pattern);
    
    const files = await globby(patterns, { 
      cwd: currentDir,
      absolute: true,
      gitignore: true 
    });
    
    // Search for component references in routing files
    for (const routeFile of files) {
      if (routeFile === filePath) continue; // Skip the component file itself
      
      try {
        const content = await fs.readFile(routeFile, 'utf-8');
        const componentNameVariants = [
          componentName,
          componentName.toLowerCase(),
          componentName.replace(/([A-Z])/g, '-$1').toLowerCase().substring(1), // kebab-case
          componentName.replace(/([A-Z])/g, '_$1').toLowerCase().substring(1), // snake_case
        ];
        
        // Find the matching routing pattern type
        const matchingPattern = routingPatterns.find(p => {
          const minimatchPattern = p.pattern.replace(/\*\*/g, '*');
          return routeFile.includes(p.pattern.split('*')[0]) || routeFile.match(minimatchPattern);
        });
        
        // Check for comprehensive route/navigation patterns
        const isReferenced = componentNameVariants.some(variant => {
          // Route configuration patterns (React Router)
          if (content.includes(`component={${componentName}}`) ||
              content.includes(`component: ${componentName}`) ||
              content.includes(`element={<${componentName}`) ||
              content.includes(`element: <${componentName}`) ||
              content.includes(`Component: ${componentName}`)) {
            return true;
          }
          
          // Navigation/menu link patterns
          if (content.includes(`to="/${variant}"`) || content.includes(`to='/${variant}'`) ||
              content.includes(`href="/${variant}"`) || content.includes(`href='/${variant}'`) ||
              content.includes(`path="/${variant}"`) || content.includes(`path='/${variant}'`) ||
              content.includes(`route="/${variant}"`) || content.includes(`route='/${variant}'`)) {
            return true;
          }
          
          // Precise route assignment patterns - check for actual route definitions
          
          // React Router v6/v7: element={<ComponentName />}
          if (content.includes(`element={<${componentName}`) || 
              content.includes(`element={ <${componentName}`) ||
              content.includes(`element={<${componentName}>`)) {
            return true;
          }
          
          // React Router v5: component={ComponentName}
          if (content.includes(`component={${componentName}}`) ||
              content.includes(`component={ ${componentName} }`)) {
            return true;
          }
          
          // React Router v7: createBrowserRouter patterns
          if (content.includes('createBrowserRouter') || content.includes('createHashRouter') || content.includes('createMemoryRouter')) {
            // Check for route object patterns
            if ((content.includes(`Component: ${componentName}`) ||
                 content.includes(`component: ${componentName}`) ||
                 content.includes(`element: <${componentName}`) ||
                 content.includes(`loader: ${componentName}`) ||
                 content.includes(`action: ${componentName}`)) &&
                (content.includes('path:') || content.includes('"path"') || content.includes("'path'"))) {
              return true;
            }
          }
          
          // React Router v7: Data Router patterns with loaders/actions
          if (content.includes(`loader: ${componentName}Loader`) ||
              content.includes(`action: ${componentName}Action`) ||
              content.includes(`Component: ${componentName}`) ||
              content.includes(`ErrorBoundary: ${componentName}Error`)) {
            return true;
          }
          
          // React Router v7: Route objects in arrays
          const routeObjectPatterns = [
            `{ path: `, `{ path:`, `{path:`, `{path: `,
            `"path": `, `"path":`, `'path': `, `'path':`
          ];
          
          for (const pattern of routeObjectPatterns) {
            const routeIndex = content.indexOf(pattern);
            if (routeIndex !== -1) {
              // Look for component reference within reasonable distance (next 200 chars)
              const routeSection = content.substring(routeIndex, routeIndex + 200);
              if (routeSection.includes(componentName) && 
                  (routeSection.includes('Component') || routeSection.includes('element') || 
                   routeSection.includes('component') || routeSection.includes('loader'))) {
                return true;
              }
            }
          }
          
          // Special Cases: Framework-specific patterns
          
          // Next.js App Router (pages in app directory)
          if (content.includes(`export default function ${componentName}`) &&
              (content.includes('page.tsx') || content.includes('page.ts') || 
               content.includes('page.jsx') || content.includes('page.js'))) {
            return true;
          }
          
          // Remix patterns
          if ((content.includes('export const loader') || content.includes('export const action')) &&
              content.includes(`export default function ${componentName}`)) {
            return true;
          }
          
          // Vue Router patterns (for multi-framework support)
          if (content.includes('createRouter') && content.includes('routes') &&
              (content.includes(`component: ${componentName}`) ||
               content.includes(`component: () => import`) && content.includes(componentName))) {
            return true;
          }
          
          // Angular Router patterns (for multi-framework support)
          if (content.includes('RouterModule') && content.includes('forRoot') &&
              content.includes(`component: ${componentName}`)) {
            return true;
          }
          
          // Legacy and edge case patterns
          if (content.includes(`"${componentName}"`) || content.includes(`'${componentName}'`)) {
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i].toLowerCase();
              const componentInLine = line.includes(componentName.toLowerCase());
              
              if (componentInLine && (
                // Route configuration objects
                (line.includes('path') && (line.includes('component') || line.includes('element'))) ||
                // Route arrays with component references
                (line.includes('routes') && line.includes(componentName.toLowerCase())) ||
                // Switch/Match patterns
                (line.includes('switch') && line.includes('component')) ||
                // Dynamic imports in routes
                (line.includes('import(') && line.includes('route')) ||
                // Page registry patterns
                (line.includes('page') && line.includes('route') && line.includes(componentName.toLowerCase()))
              )) {
                return true;
              }
            }
          }
          
          // Lazy loading patterns
          if (content.includes(`lazy(() => import('./${variant}')`) ||
              content.includes(`lazy(() => import('./${componentName}')`) ||
              content.includes(`loadComponent: () => import('./${variant}')`) ||
              content.includes(`loadComponent: () => import('./${componentName}')`)) {
            return true;
          }
          
          // Route guard and wrapper patterns (these actually ARE pages)
          if ((content.includes(`<PrivateRoute`) && content.includes(componentName)) ||
              (content.includes(`<PublicRoute`) && content.includes(componentName)) ||
              (content.includes(`<ProtectedRoute`) && content.includes(componentName)) ||
              (content.includes(`<AuthRoute`) && content.includes(componentName)) ||
              (content.includes(`<GuardedRoute`) && content.includes(componentName))) {
            return true;
          }
          
          // React Router v7 and modern routing special cases
          
          // Tanstack Router patterns
          if (content.includes('@tanstack/react-router') || content.includes('createRouter') ||
              content.includes('createRoute')) {
            if (content.includes(`component: ${componentName}`) ||
                content.includes(`Component: ${componentName}`) ||
                content.includes(`getComponent: () => ${componentName}`)) {
              return true;
            }
          }
          
          // File-based routing patterns (Next.js, Nuxt, SvelteKit, etc.)
          if ((filePath.includes('/pages/') || filePath.includes('\\pages\\') ||
               filePath.includes('/routes/') || filePath.includes('\\routes\\') ||
               filePath.includes('/app/') || filePath.includes('\\app\\')) &&
              (filePath.endsWith('page.tsx') || filePath.endsWith('page.ts') ||
               filePath.endsWith('page.jsx') || filePath.endsWith('page.js') ||
               filePath.endsWith('.page.tsx') || filePath.endsWith('.page.ts') ||
               filePath.endsWith('.page.jsx') || filePath.endsWith('.page.js') ||
               filePath.endsWith('route.tsx') || filePath.endsWith('route.ts'))) {
            return true;
          }
          
          // Reach Router (legacy) patterns
          if (content.includes('@reach/router') &&
              (content.includes(`component={${componentName}}`) ||
               content.includes(`<${componentName} path=`))) {
            return true;
          }
          
          // React Router v7 Data API patterns
          if (content.includes('RouterProvider') || content.includes('createBrowserRouter')) {
            // Check for async component loading patterns
            if (content.includes(`import('./${componentName}')`) ||
                content.includes(`import('./${variant}')`) ||
                content.includes(`() => import(`) && content.includes(componentName)) {
              return true;
            }
            
            // Check for route handle patterns
            if (content.includes(`handle: ${componentName}Handle`) ||
                content.includes(`shouldRevalidate: ${componentName}ShouldRevalidate`)) {
              return true;
            }
          }
          
          // Modern meta-framework patterns
          
          // Remix v2 patterns  
          if (content.includes('remix') &&
              (content.includes(`export { default } from "./${componentName}"`) ||
               content.includes(`export { ${componentName} as default }`))) {
            return true;
          }
          
          // SvelteKit patterns (for cross-framework compatibility)
          if (content.includes('+page.svelte') || content.includes('+layout.svelte')) {
            return true;
          }
          
          // Astro patterns
          if (filePath.endsWith('.astro') &&
              content.includes(`import ${componentName}`) &&
              content.includes('---')) {
            return true;
          }
          
          // Additional React Router v7 and edge case patterns
          
          // React Router v7 future flags and experimental features
          if (content.includes('future:') && content.includes('v7_') &&
              (content.includes(`Component: ${componentName}`) ||
               content.includes(`element: <${componentName}`))) {
            return true;
          }
          
          // Route configuration with nested routes
          if (content.includes('children:') && content.includes('routes') &&
              content.includes(componentName)) {
            return true;
          }
          
          // React Router v7 route modules pattern
          if (content.includes('route.') && 
              (content.includes(`route.${componentName}`) ||
               content.includes(`route.component = ${componentName}`) ||
               content.includes(`route.Component = ${componentName}`))) {
            return true;
          }
          
          // React Router with TypeScript generic patterns
          if (content.includes('<Route') && content.includes(componentName) &&
              (content.includes('RouteObject') || content.includes('RouteConfig'))) {
            return true;
          }
          
          // Dynamic route segment patterns  
          if ((content.includes(':id') || content.includes('*') || content.includes('[') || content.includes('{')) &&
              content.includes(componentName) &&
              (content.includes('path') || content.includes('route'))) {
            return true;
          }
          
          // Outlet context patterns (pages that use outlets)
          if (content.includes('useOutletContext') && content.includes(`<${componentName}`) &&
              content.includes('Outlet')) {
            return true;
          }
          
          // Search params and URL state patterns (typically pages)
          if (content.includes(componentName) &&
              (content.includes('useSearchParams') || content.includes('URLSearchParams') ||
               content.includes('useParams') || content.includes('useLocation'))) {
            return true;
          }
          
          // Special case: Error boundaries that are also pages (use componentName instead of nameLower)
          const compNameLower = componentName.toLowerCase();
          if ((compNameLower.includes('error') && compNameLower.includes('page')) ||
              (compNameLower.includes('notfound') && compNameLower.includes('page')) ||
              compNameLower === 'errorpage' || compNameLower === 'notfoundpage' ||
              compNameLower === '404page' || compNameLower === 'error404') {
            return true;
          }
          
          // Object/array route configurations (moved and enhanced)
          if ((content.includes(`'${variant}'`) || content.includes(`"${variant}"`)) &&
              (content.includes(componentName) || content.includes(`<${componentName}`)) &&
              (content.includes('routes') || content.includes('Routes') || content.includes('navigation'))) {
            return true;
          }
          
          return false;
        });
        
        if (isReferenced) {
          return true;
        }
      } catch (error) {
        // Ignore individual file read errors
        continue;
      }
    }
    
    return false;
  } catch (error) {
    // If there's any error in the route checking, don't fail the whole process
    return false;
  }
};

// Helper function to analyze code content and determine type
const analyzeCodeContent = async (filePath: string, name: string, code?: string, projectRoot?: string): Promise<'component' | 'hook' | 'page'> => {
  // Check for user overrides first
  if (projectRoot) {
    const overridesConfig = await loadOverrides(projectRoot);
    const override = findOverride(overridesConfig.overrides, filePath, name);
    if (override) {
      return override.overrideType;
    }
  }
  // 1. Hook detection - names starting with 'use'
  if (isHook(name)) {
    return 'hook';
  }
  
  // 2. Read file content if not provided
  let fileContent = code;
  if (!fileContent) {
    try {
      fileContent = await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      return 'component'; // default fallback
    }
  }
  
  // 3. Additional hook detection - custom hooks that might be in utility files
  if (name.startsWith('use') && 
      (fileContent.includes('export const') || fileContent.includes('export default')) &&
      (fileContent.includes('useState') || fileContent.includes('useEffect') || fileContent.includes('useContext') || 
       fileContent.includes('useRef') || fileContent.includes('useMemo') || fileContent.includes('useCallback'))) {
    return 'hook';
  }
  
  // 6. Dynamic page detection - purely based on route/navigation usage
  const nameLower = name.toLowerCase();
  
          // Quick exclusions for obvious non-page components
  const isObviouslyNotPage = 
    // Infrastructure/utility components that are never pages
    nameLower.includes('provider') || nameLower.includes('context') ||
    nameLower === 'router' || nameLower === 'routes' || nameLower === 'routing' ||
    // Navigation infrastructure components
    nameLower.includes('navigation') || nameLower.includes('nav') ||
    nameLower.includes('header') || nameLower.includes('footer') ||
    nameLower.includes('sidebar') || nameLower.includes('menu') ||
    nameLower.includes('notification') || nameLower.includes('toast') ||
    // Layout infrastructure components  
    nameLower.includes('layout') || nameLower.includes('wrapper') ||
    nameLower.includes('container') || nameLower === 'app' ||
    // Form and UI components that are never pages
    nameLower.includes('button') || nameLower.includes('input') ||
    nameLower.includes('modal') || nameLower.includes('dialog') ||
    nameLower.includes('popup') || nameLower.includes('tooltip') ||
    nameLower.includes('dropdown') || nameLower.includes('select') ||
    nameLower.includes('checkbox') || nameLower.includes('radio') ||
    nameLower.includes('slider') || nameLower.includes('toggle') ||
    // Loading and feedback components
    nameLower.includes('loading') || nameLower.includes('spinner') ||
    nameLower.includes('skeleton') || nameLower.includes('progress') ||
    nameLower.includes('badge') || nameLower.includes('chip') ||
    nameLower.includes('tag') || nameLower.includes('label') ||
    // Data display components
    nameLower.includes('table') || nameLower.includes('list') ||
    nameLower.includes('card') || nameLower.includes('panel') ||
    nameLower.includes('accordion') || nameLower.includes('tab') ||
    nameLower.includes('carousel') || nameLower.includes('gallery') ||
    // Utility components
    nameLower.includes('error') || nameLower.includes('fallback') ||
    nameLower.includes('guard') || nameLower.includes('boundary') ||
    nameLower.includes('portal') || nameLower.includes('teleport');
  
  if (isObviouslyNotPage) {
    return 'component';
  }
  
  // Enhanced Next.js and file-based routing detection
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  // Next.js App Router (v13+) - definitive page patterns
  if (normalizedPath.includes('/app/') && 
      (normalizedPath.endsWith('/page.tsx') || normalizedPath.endsWith('/page.ts') || 
       normalizedPath.endsWith('/page.jsx') || normalizedPath.endsWith('/page.js'))) {
    return 'page';
  }
  
  // Next.js Pages Router - comprehensive patterns
  if (normalizedPath.includes('/pages/')) {
    // Exclude Next.js special files that aren't pages
    const isSpecialNextFile = normalizedPath.endsWith('/_app.tsx') || 
                              normalizedPath.endsWith('/_app.ts') ||
                              normalizedPath.endsWith('/_app.jsx') || 
                              normalizedPath.endsWith('/_app.js') ||
                              normalizedPath.endsWith('/_document.tsx') || 
                              normalizedPath.endsWith('/_document.ts') ||
                              normalizedPath.endsWith('/_document.jsx') || 
                              normalizedPath.endsWith('/_document.js') ||
                              normalizedPath.includes('/api/'); // API routes are not pages
    
    if (!isSpecialNextFile) {
      // Next.js pages include: index files, named files, dynamic routes
      const isNextPage = normalizedPath.match(/\/pages\/.*\.(tsx?|jsx?)$/) &&
                         !normalizedPath.includes('/_') && // Exclude other special files
                         (fileContent.includes('export default') || 
                          fileContent.includes('export { default }'));
      
      if (isNextPage) {
        return 'page';
      }
    }
  }
  
  // Dynamic route detection for Next.js
  const isDynamicRoute = normalizedPath.includes('[') && normalizedPath.includes(']') &&
                         (normalizedPath.includes('/pages/') || normalizedPath.includes('/app/')) &&
                         (fileContent.includes('export default') || fileContent.includes('getStaticProps') || 
                          fileContent.includes('getServerSideProps') || fileContent.includes('generateStaticParams'));
  
  if (isDynamicRoute) {
    return 'page';
  }
  
  // Generic file-based routing patterns (for other frameworks)
  if ((normalizedPath.includes('/routes/') || normalizedPath.includes('/views/')) &&
      (normalizedPath.endsWith('page.tsx') || normalizedPath.endsWith('page.ts') ||
       normalizedPath.endsWith('page.jsx') || normalizedPath.endsWith('page.js') ||
       normalizedPath.endsWith('.page.tsx') || normalizedPath.endsWith('.page.ts') ||
       normalizedPath.endsWith('.page.jsx') || normalizedPath.endsWith('.page.js') ||
       normalizedPath.endsWith('route.tsx') || normalizedPath.endsWith('route.ts') ||
       normalizedPath.endsWith('index.tsx') || normalizedPath.endsWith('index.ts'))) {
    return 'page';
  }
  
  // Check for page-specific content patterns (Next.js functions, router hooks, etc.)
  if (hasPageSpecificPatterns(fileContent)) {
    // Additional validation - must have default export and not be obviously a component
    if ((fileContent.includes('export default') || fileContent.includes('export { default }')) && 
        !isObviouslyNotPage) {
      return 'page';
    }
  }
  
  // Special naming patterns that strongly indicate pages
  if ((nameLower.endsWith('page') || nameLower.endsWith('view') || nameLower.endsWith('screen')) &&
      (fileContent.includes('export default') || fileContent.includes('export const') || fileContent.includes('export function'))) {
    // But still check if it's obviously not a page component
    if (!nameLower.includes('component') && !nameLower.includes('widget') && 
        !nameLower.includes('element') && !nameLower.includes('item')) {
      return 'page';
    }
  }
  
  // Main page detection: Check if component is actually used in routes or navigation
  const isUsedInRoutes = await isReferencedInRoutes(filePath, name);
  
  if (isUsedInRoutes) {
    return 'page';
  }
  
  // Fallback: Only very explicit page naming when no route reference found
  if (nameLower.endsWith('page') && fileContent.includes('export default')) {
    return 'page';
  }
  
  // 7. Everything else is a component (including Context, App, etc.)
  return 'component';
};

// Built-in React hooks categorized by their purpose
const BUILT_IN_HOOKS = {
  state: ['useState', 'useReducer'],
  effect: ['useEffect', 'useLayoutEffect'],
  performance: ['useMemo', 'useCallback'],
  context: ['useContext'],
  ref: ['useRef', 'useImperativeHandle'],
  other: [
    'useId', 'useDebugValue', 'useDeferredValue', 'useTransition',
    'useSyncExternalStore', 'useInsertionEffect'
  ]
};

const ALL_BUILT_IN_HOOKS = Object.values(BUILT_IN_HOOKS).flat();

function getHookCategory(hookName: string): ComponentDoc['hookCategory'] {
  for (const [category, hooks] of Object.entries(BUILT_IN_HOOKS)) {
    if (hooks.includes(hookName)) {
      return category as ComponentDoc['hookCategory'];
    }
  }
  return 'custom';
}

export async function scanComponents(patterns: string[], projectRoot?: string): Promise<ComponentDoc[]> {
  // Determine project root if not provided
  const rootDir = projectRoot || process.cwd();
  const files = await globby(patterns, { 
    gitignore: true, 
    absolute: true,
    ignore: [
      // SmartDocs exclusions - don't scan SmartDocs itself
      '**/.smartdocs/**/*',
      '**/smartdocs/**/*',
      '**/smartdocs-*/**/*',
      '**/node_modules/smartdocs/**/*',
      '**/smartdocs.config.*',
      '**/smartdocs-dist/**/*',
      // Node modules and dependencies
      '**/node_modules/**/*',
      '**/.pnpm/**/*',
      '**/.yarn/**/*',
      '**/dist/**/*',
      '**/build/**/*',
      '**/out/**/*',
      // Common config files
      '**/*.config.{js,ts,mjs,cjs}',
      '**/*.conf.{js,ts}',
      '**/config/**/*',
      // Build tools
      '**/webpack.config.*',
      '**/vite.config.*', 
      '**/rollup.config.*',
      '**/babel.config.*',
      '**/jest.config.*',
      // Linting and formatting
      '**/eslint.config.*',
      '**/.eslintrc.*',
      '**/prettier.config.*',
      // CSS/Style tools
      '**/tailwind.config.*',
      '**/postcss.config.*',
      // Testing
      '**/test-*.{js,ts}',
      '**/*.test.{js,ts,tsx,jsx}',
      '**/*.spec.{js,ts,tsx,jsx}',
      '**/__tests__/**/*',
      // Version control and misc
      '**/.git/**/*',
      '**/.next/**/*',
      '**/.nuxt/**/*',
      '**/coverage/**/*',
      '**/temp/**/*',
      '**/tmp/**/*',
      '**/setup*.{js,ts}',
      '**/index.d.ts',
      '**/*.d.ts'
    ]
  });
  
  // Find all story files for examples
  const storyFiles = await globby(['**/*.stories.{js,jsx,ts,tsx}'], { gitignore: true, absolute: true });
  const storyExamples = await extractStorybookExamples(storyFiles);

  // First pass: Find all hook names across all files (including built-in React hooks)
  const allHookNames = await findAllHookNames(files);
  
  // Scan for hook usage across all files
  const hookUsageMap = await scanAllHookUsages(files);

  const docs: ComponentDoc[] = [];
  for (const file of files) {
    try {
      const relativePath = path.relative(process.cwd(), file);
      
      if (isMdx(file)) {
        // Handle MDX files
        const content = await fs.readFile(file, "utf-8");
        const name = inferNameFromPath(file);
        docs.push({
          displayName: name,
          filePath: relativePath,
          description: extractMdxDescription(content),
          type: 'mdx',
          props: []
        });
      } else if (isTs(file)) {
        // Enhanced TypeScript parsing with multiple parser configurations
        let parsed: any[] = [];
        const code = await fs.readFile(file, "utf-8"); // Read content for analysis
        
        try {
          // First try: Default parser
          parsed = reactDocgenTs.parse(file, {
            savePropValueAsString: true,
            shouldExtractLiteralValuesFromEnum: true,
            shouldRemoveUndefinedFromOptional: true,
            propFilter: (prop: any) => {
              // Filter out props from node_modules
              if (prop.parent) {
                return !prop.parent.fileName.includes('node_modules');
              }
              return true;
            }
          });
        } catch (error1) {
          try {
            // Second try: With TypeScript compiler options
            const tsConfigPath = path.resolve(process.cwd(), "tsconfig.json");
            const parser = reactDocgenTs.withCustomConfig(tsConfigPath, {
              savePropValueAsString: true,
              shouldExtractLiteralValuesFromEnum: true,
              shouldRemoveUndefinedFromOptional: true,
              propFilter: (prop: any) => {
                if (prop.parent) {
                  return !prop.parent.fileName.includes('node_modules');
                }
                return true;
              }
            });
            parsed = parser.parse(file);
          } catch (error2) {
            try {
              // Third try: Simple parse without options
              parsed = reactDocgenTs.parse(file);
            } catch (error3) {
              continue;
            }
          }
        }

        for (const p of parsed) {
          const name = p.displayName;
          // Determine type based on code content, not directory location
          const docType = await analyzeCodeContent(file, name, code, rootDir);
          
          // Enhanced props extraction with safe defaultValue serialization
          const props = Object.entries(p.props ?? {}).map(([propName, pr]: [string, any]) => {
            let defaultValue: string | undefined;
            
            if (pr.defaultValue) {
              if (typeof pr.defaultValue === 'string') {
                defaultValue = pr.defaultValue;
              } else if (pr.defaultValue.value) {
                defaultValue = String(pr.defaultValue.value);
              } else {
                try {
                  defaultValue = JSON.stringify(pr.defaultValue);
                } catch {
                  defaultValue = String(pr.defaultValue);
                }
              }
            }
            
            return {
              name: propName,
              type: pr.type?.name || pr.type?.raw || pr.type || "unknown",
              required: !!pr.required,
              defaultValue,
              description: pr.description || ""
            };
          });

          // Extract real usage examples for components or hooks
          const realUsageExamples = docType === 'component' ? 
            await extractRealUsageExamples(name) : 
            docType === 'hook' ? await extractHookUsageExamples(name) : [];

          // Extract hook-specific information
          let hookSignature: string | undefined;
          let parameters: Array<{ name: string; type: string; required: boolean; description?: string; }> | undefined;
          let returnType: { type: string; description?: string; } | undefined;

          if (docType === 'hook') {
            const hookInfo = await extractHookSignature(file, name);
            hookSignature = hookInfo.signature;
            parameters = hookInfo.parameters;
            returnType = hookInfo.returnType;
          }

          docs.push({
            displayName: name,
            filePath: relativePath,
            description: p.description,
            type: docType,
            props,
            jsdoc: extractJsDoc(p.description),
            examples: storyExamples[name] || [],
            realUsageExamples,
            hookSignature,
            parameters,
            returnType
          });
        }
      } else if (isJs(file)) {
        const code = await fs.readFile(file, "utf-8");
        
        // Skip config files and other non-component JavaScript files
        const filename = path.basename(file).toLowerCase();
        const isConfigFile = filename.includes('.config.') || 
                            filename.includes('.conf.') || 
                            filename.startsWith('config') ||
                            filename.includes('tailwind') ||
                            filename.includes('postcss') ||
                            filename.includes('eslint') ||
                            filename.includes('babel') ||
                            filename.includes('webpack') ||
                            filename.includes('vite') ||
                            filename.includes('test');
        
        if (isConfigFile) {
          continue;
        }
        
        // Quick content check - skip files that don't look like React components
        if (!code.includes('React') && 
            !code.includes('export') && 
            !code.includes('function') && 
            !code.includes('const') && 
            !code.includes('class')) {
          continue;
        }
        
        let components: any[] = [];
        try {
          components = parseJsx(code);
        } catch (error: any) {
          // Skip files that can't be parsed as React components
          if (error.code === 'ERR_REACTDOCGEN_MISSING_DEFINITION') {
            continue;
          } else {
            continue;
          }
        }

        for (const c of components) {
          const name = c.displayName || inferNameFromPath(file);
          // Determine type based on code content, not directory location
          const docType = await analyzeCodeContent(file, name, code, rootDir);
          
          // Extract real usage examples for components or hooks
          const realUsageExamples = docType === 'component' ? 
            await extractRealUsageExamples(name) : 
            docType === 'hook' ? await extractHookUsageExamples(name) : [];

          // Extract hook-specific information for JS files
          let hookSignature: string | undefined;
          let parameters: Array<{ name: string; type: string; required: boolean; description?: string; }> | undefined;
          let returnType: { type: string; description?: string; } | undefined;

          if (docType === 'hook') {
            const hookInfo = await extractHookSignature(file, name);
            hookSignature = hookInfo.signature;
            parameters = hookInfo.parameters;
            returnType = hookInfo.returnType;
          }
          
          const propEntries = Object.entries(c.props ?? {});
          docs.push({
            displayName: name,
            filePath: relativePath,
            description: c.description || "",
            type: docType,
            props: propEntries.map(([name, pr]: any) => {
              let defaultValue: string | undefined;
              
              if (pr.defaultValue) {
                if (typeof pr.defaultValue === 'string') {
                  defaultValue = pr.defaultValue;
                } else if (pr.defaultValue.value) {
                  defaultValue = String(pr.defaultValue.value);
                } else {
                  try {
                    defaultValue = JSON.stringify(pr.defaultValue);
                  } catch {
                    defaultValue = String(pr.defaultValue);
                  }
                }
              }
              
              return {
                name,
                type: pr.tsType?.name || pr.flowType?.name || pr.type?.name || "",
                required: !!pr.required,
                defaultValue,
                description: pr.description || ""
              };
            }),
            jsdoc: extractJsDoc(c.description),
            examples: storyExamples[name] || [],
            realUsageExamples,
            hookSignature,
            parameters,
            returnType
          });
        }
      }
    } catch (error) {
      // ignore non-components/parse errors and continue
    }
  }

  // Second pass: Scan specifically for hooks by name across all source files
  for (const hookName of allHookNames) {
    const hookDoc = await scanSpecificHook(hookName, files, hookUsageMap[hookName] || []);
    if (hookDoc) {
      // Check if we already found this hook in the first pass
      const existingHook = docs.find(doc => doc.displayName === hookName && doc.type === 'hook');
      if (!existingHook) {
        docs.push(hookDoc);
      } else {
        // Enhance existing hook with usage information
        existingHook.hookUsages = hookDoc.hookUsages;
        existingHook.isBuiltInHook = hookDoc.isBuiltInHook;
        existingHook.hookCategory = hookDoc.hookCategory;
      }
    }
  }

  return docs;
}

async function extractStorybookExamples(storyFiles: string[]): Promise<Record<string, string[]>> {
  const examples: Record<string, string[]> = {};
  
  for (const file of storyFiles) {
    try {
      const content = await fs.readFile(file, "utf-8");
      const componentName = inferComponentNameFromStory(file, content);
      
      if (componentName) {
        const storyExamples = extractStoriesFromContent(content);
        if (storyExamples.length > 0) {
          examples[componentName] = storyExamples;
        }
      }
    } catch {
      // ignore parse errors
    }
  }
  
  return examples;
}

function inferComponentNameFromStory(file: string, content: string): string | null {
  // Try to extract from export default title
  const titleMatch = content.match(/title:\s*['"`]([^'"`]+)['"`]/);
  if (titleMatch) {
    return titleMatch[1].split('/').pop() || null;
  }
  
  // Try to extract from component export
  const componentMatch = content.match(/component:\s*(\w+)/);
  if (componentMatch) {
    return componentMatch[1];
  }
  
  // Fallback to filename
  const name = path.basename(file).replace(/\.(stories|story)\.(js|jsx|ts|tsx)$/i, '');
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function extractStoriesFromContent(content: string): string[] {
  const stories: string[] = [];
  
  // Find named exports that are stories
  const storyMatches = content.match(/export\s+const\s+(\w+)\s*[:=]/g);
  if (storyMatches) {
    for (const match of storyMatches) {
      const storyName = match.match(/export\s+const\s+(\w+)/)?.[1];
      if (storyName && storyName !== 'default') {
        // Extract the story implementation
        const storyRegex = new RegExp(`export\\s+const\\s+${storyName}\\s*[:=]\\s*([\\s\\S]*?)(?=export|$)`, 'm');
        const storyMatch = content.match(storyRegex);
        if (storyMatch) {
          stories.push(storyMatch[1].trim());
        }
      }
    }
  }
  
  return stories;
}

function inferNameFromPath(p: string) {
  const base = path.basename(p).replace(/\.(jsx?|tsx?|mdx?)$/i, "");
  return base.charAt(0).toUpperCase() + base.slice(1);
}

function extractMdxDescription(content: string): string {
  // Extract description from frontmatter or first paragraph
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (frontmatterMatch) {
    const yamlContent = frontmatterMatch[1];
    const descMatch = yamlContent.match(/description:\s*["']?(.*?)["']?$/m);
    if (descMatch) return descMatch[1];
  }
  
  // Fallback to first paragraph
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.trim() && !line.startsWith('#') && !line.startsWith('---')) {
      return line.trim();
    }
  }
  return '';
}

function extractJsDoc(description?: string): ComponentDoc['jsdoc'] {
  if (!description) return undefined;
  
  const jsdoc: ComponentDoc['jsdoc'] = {
    description: description
  };
  
  // Extract @param, @returns, @example tags
  const paramMatches = description.match(/@param\s+\{([^}]+)\}\s+(\w+)\s+(.*?)(?=@|\n|$)/g);
  if (paramMatches) {
    jsdoc.params = paramMatches.map(match => {
      const paramMatch = match.match(/@param\s+\{([^}]+)\}\s+(\w+)\s+(.*)/);
      return {
        name: paramMatch?.[2] || '',
        type: paramMatch?.[1] || '',
        description: paramMatch?.[3] || ''
      };
    });
  }
  
  const returnMatch = description.match(/@returns?\s+\{([^}]+)\}\s+(.*?)(?=@|\n|$)/);
  if (returnMatch) {
    jsdoc.returns = {
      type: returnMatch[1],
      description: returnMatch[2]
    };
  }
  
  const exampleMatches = description.match(/@example\s+([\s\S]*?)(?=@|\n\n|$)/g);
  if (exampleMatches) {
    jsdoc.examples = exampleMatches.map(match => 
      match.replace(/@example\s+/, '').trim()
    );
  }
  
  return jsdoc;
}

async function extractRealUsageExamples(componentName: string): Promise<string[]> {
  try {
    // Search for files that might contain the component usage
    const sourceFiles = await globby([
      'src/**/*.{js,jsx,ts,tsx}',
      'pages/**/*.{js,jsx,ts,tsx}',
      'app/**/*.{js,jsx,ts,tsx}',
      'components/**/*.{js,jsx,ts,tsx}',
      '!**/*.stories.{js,jsx,ts,tsx}',
      '!**/*.test.{js,jsx,ts,tsx}',
      '!**/node_modules/**'
    ], { gitignore: true, absolute: true });

    const examples: string[] = [];

    for (const file of sourceFiles) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        
        // Skip if file doesn't contain the component
        if (!content.includes(componentName)) continue;

        // Parse the file to extract JSX usage
        const ast = babelParser.parse(content, {
          sourceType: 'module',
          plugins: ['jsx', 'typescript'],
        });

        // Find JSX elements using the component
        const usageExamples: string[] = [];
        
        function findJSXUsage(node: any, source: string) {
          if (node.type === 'JSXElement' || node.type === 'JSXFragment') {
            if (node.openingElement?.name?.name === componentName) {
              // Extract the JSX element with proper formatting
              const start = node.start;
              const end = node.end;
              if (start !== undefined && end !== undefined) {
                const jsxCode = source.slice(start, end);
                // Clean up and format the code
                const cleanCode = jsxCode
                  .split('\n')
                  .map(line => line.trim())
                  .filter(line => line.length > 0)
                  .join('\n');
                usageExamples.push(cleanCode);
              }
            }
          }
          
          // Recursively check children
          if (node.children) {
            for (const child of node.children) {
              findJSXUsage(child, source);
            }
          }
          
          // Check other properties that might contain JSX
          for (const key in node) {
            if (node[key] && typeof node[key] === 'object') {
              if (Array.isArray(node[key])) {
                for (const item of node[key]) {
                  if (item && typeof item === 'object') {
                    findJSXUsage(item, source);
                  }
                }
              } else {
                findJSXUsage(node[key], source);
              }
            }
          }
        }

        findJSXUsage(ast, content);
        examples.push(...usageExamples);

      } catch (error) {
        // Skip files that can't be parsed
        continue;
      }
    }

    // Remove duplicates and limit to 3 examples
    const uniqueExamples = [...new Set(examples)];
    return uniqueExamples.slice(0, 3);

  } catch (error) {
    return [];
  }
}

async function extractHookUsageExamples(hookName: string): Promise<string[]> {
  try {
    // Search for files that might contain the hook usage
    const sourceFiles = await globby([
      'src/**/*.{js,jsx,ts,tsx}',
      'pages/**/*.{js,jsx,ts,tsx}',
      'app/**/*.{js,jsx,ts,tsx}',
      'components/**/*.{js,jsx,ts,tsx}',
      '!**/*.stories.{js,jsx,ts,tsx}',
      '!**/*.test.{js,jsx,ts,tsx}',
      '!**/node_modules/**'
    ], { gitignore: true, absolute: true });

    const examples: string[] = [];

    for (const file of sourceFiles) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        
        // Skip if file doesn't contain the hook
        if (!content.includes(hookName)) continue;

        // Parse the file to extract hook usage
        const ast = babelParser.parse(content, {
          sourceType: 'module',
          plugins: ['jsx', 'typescript'],
        });

        // Find hook usage patterns
        const usageExamples: string[] = [];
        
        function findHookUsage(node: any, source: string) {
          // Look for variable declarations with hook calls
          if (node.type === 'VariableDeclaration') {
            for (const declaration of node.declarations) {
              if (declaration.init?.type === 'CallExpression' && 
                  declaration.init.callee?.name === hookName) {
                // Extract the full hook usage line
                const start = node.start;
                const end = node.end;
                if (start !== undefined && end !== undefined) {
                  const hookCode = source.slice(start, end);
                  // Clean up the code
                  const cleanCode = hookCode.trim();
                  usageExamples.push(cleanCode);
                }
              }
            }
          }
          
          // Recursively check all properties
          for (const key in node) {
            if (node[key] && typeof node[key] === 'object') {
              if (Array.isArray(node[key])) {
                for (const item of node[key]) {
                  if (item && typeof item === 'object') {
                    findHookUsage(item, source);
                  }
                }
              } else {
                findHookUsage(node[key], source);
              }
            }
          }
        }

        findHookUsage(ast, content);
        examples.push(...usageExamples);

      } catch (error) {
        // Skip files that can't be parsed
        continue;
      }
    }

    // Remove duplicates and limit to 3 examples
    const uniqueExamples = [...new Set(examples)];
    return uniqueExamples.slice(0, 3);

  } catch (error) {
    return [];
  }
}

async function extractHookSignature(filePath: string, hookName: string): Promise<{
  signature: string;
  parameters: Array<{ name: string; type: string; required: boolean; description?: string; }>;
  returnType: { type: string; description?: string; };
}> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Parse the TypeScript file
    const ast = babelParser.parse(content, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });

    let hookInfo = {
      signature: '',
      parameters: [] as Array<{ name: string; type: string; required: boolean; description?: string; }>,
      returnType: { type: 'any', description: undefined }
    };

    function findHookFunction(node: any, depth = 0) {
      if (!node || typeof node !== 'object' || depth > 15) return;  // Add depth limit
      
      // Look for function declarations or exports
      if ((node.type === 'FunctionDeclaration' || node.type === 'ExportNamedDeclaration') && 
          node.declaration?.id?.name === hookName) {
        const func = node.declaration || node;
        
        // Extract function signature
        const start = func.start;
        const end = func.end;
        if (start !== undefined && end !== undefined) {
          const funcCode = content.slice(start, end);
          // Extract just the function signature (first line)
          const signatureMatch = funcCode.match(/export\s+function\s+[^{]+/);
          if (signatureMatch) {
            hookInfo.signature = signatureMatch[0].trim();
          }
        }

        // Extract parameters
        if (func.params) {
          hookInfo.parameters = func.params.map((param: any) => ({
            name: param.name || param.left?.name || 'param',
            type: getTypeFromAnnotation(param.typeAnnotation) || 'any',
            required: !param.optional,
            description: undefined
          }));
        }

        // Extract return type
        if (func.returnType) {
          hookInfo.returnType = {
            type: getTypeFromAnnotation(func.returnType) || 'any',
            description: undefined
          };
        }
        return; // Stop searching once found
      }

      // Check export declarations
      if (node.type === 'ExportNamedDeclaration' && node.declaration?.type === 'FunctionDeclaration') {
        findHookFunction(node, depth + 1);
      }

      // Recursively search
      for (const key in node) {
        if (node[key] && typeof node[key] === 'object') {
          if (Array.isArray(node[key])) {
            for (const item of node[key]) {
              if (item && typeof item === 'object') {
                findHookFunction(item, depth + 1);
              }
            }
          } else {
            findHookFunction(node[key], depth + 1);
          }
        }
      }
    }

    function getTypeFromAnnotation(typeAnnotation: any): string {
      if (!typeAnnotation) return 'any';
      
      const annotation = typeAnnotation.typeAnnotation || typeAnnotation;
      
      if (annotation.type === 'TSStringKeyword') return 'string';
      if (annotation.type === 'TSNumberKeyword') return 'number';
      if (annotation.type === 'TSBooleanKeyword') return 'boolean';
      if (annotation.type === 'TSAnyKeyword') return 'any';
      if (annotation.type === 'TSArrayType') {
        return `${getTypeFromAnnotation(annotation.elementType)}[]`;
      }
      if (annotation.type === 'TSTupleType') {
        const elements = annotation.elementTypes.map((el: any) => getTypeFromAnnotation(el)).join(', ');
        return `[${elements}]`;
      }
      if (annotation.type === 'TSTypeReference') {
        return annotation.typeName.name || 'unknown';
      }
      
      return 'unknown';
    }

    findHookFunction(ast);
    return hookInfo;

  } catch (error) {
    return {
      signature: '',
      parameters: [],
      returnType: { type: 'any' }
    };
  }
}

// Function to find all hook names across all files (including built-in React hooks)
async function findAllHookNames(files: string[]): Promise<Set<string>> {
  const hookNames = new Set<string>();
  
  // Add all built-in React hooks first
  ALL_BUILT_IN_HOOKS.forEach(hook => hookNames.add(hook));
  
  for (const file of files) {
    if (!isTs(file) && !isJs(file)) continue;
    
    try {
      const content = await fs.readFile(file, 'utf-8');
      
      // Look for ANY hook usage (built-in or custom): use[A-Z][a-zA-Z]*
      const hookUsageRegex = /\b(use[A-Z][a-zA-Z]*)\s*\(/g;
      let match;
      while ((match = hookUsageRegex.exec(content)) !== null) {
        hookNames.add(match[1]);
      }
      
      // Look for hook exports: export function useHook, export const useHook
      const hookExportRegex = /export\s+(?:function|const)\s+(use[A-Z][a-zA-Z]*)/g;
      while ((match = hookExportRegex.exec(content)) !== null) {
        hookNames.add(match[1]);
      }
      
      // Look for hook declarations inside files: function useHook, const useHook
      const hookDeclareRegex = /(?:function|const)\s+(use[A-Z][a-zA-Z]*)/g;
      while ((match = hookDeclareRegex.exec(content)) !== null) {
        hookNames.add(match[1]);
      }
      
    } catch (error) {
      // Skip files that can't be read
      continue;
    }
  }
  
  return hookNames;
}

// Function to scan for a specific hook by name across all files
async function scanSpecificHook(
  hookName: string, 
  files: string[], 
  hookUsages: Array<{
    file: string;
    line: number;
    code: string;
    context: string;
    destructuring?: string[];
    parameters?: any[];
    defaults?: Record<string, any>;
  }> = []
): Promise<ComponentDoc | null> {
  
  const isBuiltIn = ALL_BUILT_IN_HOOKS.includes(hookName);
  const hookCategory = getHookCategory(hookName);
  
  // For built-in hooks, create documentation from usage patterns
  if (isBuiltIn && hookUsages.length > 0) {
    return {
      displayName: hookName,
      filePath: 'React Built-in',
      description: getBuiltInHookDescription(hookName),
      type: 'hook',
      props: [],
      hookUsages,
      isBuiltInHook: true,
      hookCategory,
      jsdoc: getBuiltInHookJSDoc(hookName)
    };
  }
  
  // For custom hooks, find definition and combine with usage
  for (const file of files) {
    if (!isTs(file) && !isJs(file)) continue;
    
    try {
      const content = await fs.readFile(file, 'utf-8');
      
      // Check if this file contains the hook definition
      const hookDefRegex = new RegExp(`(?:export\\s+)?(?:function|const)\\s+${hookName}\\b`, 'g');
      if (hookDefRegex.test(content)) {
        
        const relativePath = path.relative(process.cwd(), file);
        
        // Extract hook information
        const hookInfo = await extractHookSignature(file, hookName);
        const realUsageExamples = await extractHookUsageExamples(hookName);
        
        // Extract JSDoc if available
        const jsDocRegex = new RegExp(`/\\*\\*[\\s\\S]*?\\*/\\s*(?:export\\s+)?(?:function|const)\\s+${hookName}`, 'g');
        const jsDocMatch = jsDocRegex.exec(content);
        let description = `Custom React hook: ${hookName}`;
        let jsdocInfo = undefined;
        
        if (jsDocMatch) {
          const jsDocText = jsDocMatch[0];
          description = extractJsDocDescription(jsDocText) || description;
          jsdocInfo = extractJsDoc(jsDocText);
        }
        
        return {
          displayName: hookName,
          filePath: relativePath,
          description,
          type: 'hook',
          props: [],
          hookSignature: hookInfo.signature,
          parameters: hookInfo.parameters,
          returnType: hookInfo.returnType,
          realUsageExamples,
          hookUsages,
          isBuiltInHook: false,
          hookCategory: 'custom',
          jsdoc: jsdocInfo
        };
      }
      
    } catch (error) {
      continue;
    }
  }
  
  // If no definition found but has usages, create documentation from usage patterns
  if (hookUsages.length > 0) {
    return {
      displayName: hookName,
      filePath: 'Unknown',
      description: `Hook: ${hookName} (used in codebase but definition not found)`,
      type: 'hook',
      props: [],
      hookUsages,
      isBuiltInHook: isBuiltIn,
      hookCategory: isBuiltIn ? hookCategory : 'custom'
    };
  }
  
  return null;
}

// Comprehensive function to scan ALL hook usages across all files
async function scanAllHookUsages(files: string[]): Promise<Record<string, Array<{
  file: string;
  line: number;
  code: string;
  context: string;
  destructuring?: string[];
  parameters?: any[];
  defaults?: Record<string, any>;
}>>> {
  const hookUsageMap: Record<string, any[]> = {};
  
  for (const file of files) {
    if (!isTs(file) && !isJs(file)) continue;
    
    try {
      const content = await fs.readFile(file, 'utf-8');
      const lines = content.split('\n');
      const relativePath = path.relative(process.cwd(), file);
      
      // Parse the file to find hook usage
      const ast = babelParser.parse(content, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
        errorRecovery: true
      });

      function findHookUsages(node: any, parentContext = '') {
        if (!node || typeof node !== 'object') return;
        
        // Look for variable declarations with hook calls
        if (node.type === 'VariableDeclaration') {
          for (const declaration of node.declarations || []) {
            if (declaration.init?.type === 'CallExpression') {
              const callee = declaration.init.callee;
              const hookName = callee?.name;
              
              if (hookName && hookName.startsWith('use')) {
                if (!hookUsageMap[hookName]) hookUsageMap[hookName] = [];
                
                const lineNumber = declaration.loc?.start?.line || 0;
                const lineContent = lines[lineNumber - 1] || '';
                
                // Extract destructuring pattern
                let destructuring: string[] | undefined;
                if (declaration.id?.type === 'ArrayPattern') {
                  destructuring = declaration.id.elements?.map((el: any) => el?.name).filter(Boolean) || [];
                } else if (declaration.id?.type === 'ObjectPattern') {
                  destructuring = declaration.id.properties?.map((prop: any) => 
                    prop.key?.name || prop.value?.name
                  ).filter(Boolean) || [];
                }
                
                // Extract parameters with better type representation
                const parameters = declaration.init.arguments?.map((arg: any) => {
                  if (arg.type === 'Literal') {
                    if (typeof arg.value === 'boolean') return arg.value;
                    if (typeof arg.value === 'string') return `"${arg.value}"`;
                    if (typeof arg.value === 'number') return arg.value;
                    return arg.value;
                  }
                  if (arg.type === 'Identifier') {
                    return arg.name;
                  }
                  if (arg.type === 'ArrayExpression') {
                    if (arg.elements && arg.elements.length <= 3) {
                      const elements = arg.elements.map((el: any) => {
                        if (el === null) return 'null';
                        if (el.type === 'Literal') return el.value;
                        if (el.type === 'Identifier') return el.name;
                        return '{...}';
                      });
                      return `[${elements.join(', ')}]`;
                    }
                    return '[...]';
                  }
                  if (arg.type === 'ObjectExpression') {
                    if (arg.properties && arg.properties.length <= 8) { // Increased limit to show more properties
                      const props = arg.properties.map((prop: any) => {
                        const key = prop.key?.name || prop.key?.value || 'key';
                        if (prop.value?.type === 'Literal') {
                          const val = prop.value.value;
                          if (typeof val === 'string') return `${key}: "${val}"`;
                          return `${key}: ${val}`;
                        } else if (prop.value?.type === 'Identifier') {
                          return `${key}: ${prop.value.name}`;
                        } else if (prop.value?.type === 'ArrayExpression') {
                          if (prop.value.elements && prop.value.elements.length <= 3) {
                            const els = prop.value.elements.map((el: any) => el?.value || el?.name || 'item').join(', ');
                            return `${key}: [${els}]`;
                          }
                          return `${key}: [...]`;
                        }
                        return `${key}: ${prop.value?.value || prop.value?.name || '...'}`;
                      });
                      return `{${props.join(', ')}}`;
                    } else if (arg.properties && arg.properties.length > 8) {
                      // Show first few properties and indicate there are more
                      const firstProps = arg.properties.slice(0, 3).map((prop: any) => {
                        const key = prop.key?.name || prop.key?.value || 'key';
                        if (prop.value?.type === 'Literal') {
                          const val = prop.value.value;
                          if (typeof val === 'string') return `${key}: "${val}"`;
                          return `${key}: ${val}`;
                        }
                        return `${key}: ${prop.value?.value || prop.value?.name || '...'}`;
                      });
                      return `{${firstProps.join(', ')}, +${arg.properties.length - 3} more}`;
                    }
                    return '{...}';
                  }
                  if (arg.type === 'ArrowFunctionExpression' || arg.type === 'FunctionExpression') {
                    return '() => {...}';
                  }
                  if (arg.type === 'CallExpression' && arg.callee?.name) {
                    return `${arg.callee.name}(...)`;
                  }
                  // For any other type, return a more meaningful representation
                  return arg.name || `{${arg.type}}`;
                }) || [];
                
                hookUsageMap[hookName].push({
                  file: relativePath,
                  line: lineNumber,
                  code: lineContent.trim(),
                  context: extractFunctionContext(content, lineNumber),
                  destructuring,
                  parameters,
                  defaults: extractDefaults(parameters)
                });
              }
            }
          }
        }
        
        // Recursively search all properties
        for (const key in node) {
          if (node[key] && typeof node[key] === 'object') {
            if (Array.isArray(node[key])) {
              for (const item of node[key]) {
                if (item && typeof item === 'object') {
                  findHookUsages(item, parentContext);
                }
              }
            } else {
              findHookUsages(node[key], parentContext);
            }
          }
        }
      }

      findHookUsages(ast);
      
    } catch (error) {
      // Skip files that can't be parsed
      continue;
    }
  }
  
  return hookUsageMap;
}

// Extract the function context where a hook is used
function extractFunctionContext(content: string, lineNumber: number): string {
  const lines = content.split('\n');
  const targetLine = lineNumber - 1;
  
  // Look backwards to find the function declaration
  for (let i = targetLine; i >= Math.max(0, targetLine - 20); i--) {
    const line = lines[i];
    const funcMatch = line.match(/(?:function|const)\s+(\w+)|export\s+(?:default\s+)?(?:function\s+(\w+)|const\s+(\w+))/);
    if (funcMatch) {
      return funcMatch[1] || funcMatch[2] || funcMatch[3] || 'anonymous';
    }
  }
  
  return 'global';
}

// Extract default values from parameters
function extractDefaults(parameters: any[]): Record<string, any> {
  const defaults: Record<string, any> = {};
  
  parameters.forEach((param, index) => {
    if (typeof param === 'string' && param.startsWith('{') && param.endsWith('}')) {
      // Parse object-like strings
      try {
        const cleanParam = param.slice(1, -1); // Remove { and }
        if (cleanParam.includes(':')) {
          const pairs = cleanParam.split(', ');
          pairs.forEach(pair => {
            const colonIndex = pair.indexOf(': ');
            if (colonIndex > 0) {
              const key = pair.substring(0, colonIndex).trim();
              const value = pair.substring(colonIndex + 2).trim();
              defaults[key] = value;
            }
          });
        } else {
          // If it's just {...} or something like that
          defaults[`initialState`] = param;
        }
      } catch {
        defaults[`initialState`] = param;
      }
    } else if (typeof param === 'string' && param.startsWith('[') && param.endsWith(']')) {
      // Handle arrays
      defaults['initialArray'] = param;
    } else if (typeof param === 'string' && param === '() => {...}') {
      // Handle functions
      defaults['callback'] = 'function';
    } else if (param !== undefined && param !== null) {
      // For primitives and other types, use descriptive names based on common patterns
      if (typeof param === 'boolean') {
        defaults['initialValue'] = param;
      } else if (typeof param === 'number') {
        defaults['initialCount'] = param;
      } else if (typeof param === 'string' && param.startsWith('"') && param.endsWith('"')) {
        defaults['initialText'] = param;
      } else if (typeof param === 'string') {
        // Variable names or other identifiers
        defaults['variable'] = param;
      } else {
        defaults[`param${index}`] = param;
      }
    }
  });
  
  return defaults;
}

// Get built-in hook descriptions
function getBuiltInHookDescription(hookName: string): string {
  const descriptions: Record<string, string> = {
    useState: 'Returns a stateful value and a function to update it',
    useEffect: 'Performs side effects in function components',
    useContext: 'Accepts a context object and returns the current context value',
    useReducer: 'Alternative to useState for complex state logic',
    useCallback: 'Returns a memoized callback function',
    useMemo: 'Returns a memoized value',
    useRef: 'Returns a mutable ref object whose .current property is initialized to the passed argument',
    useLayoutEffect: 'Identical to useEffect, but fires synchronously after all DOM mutations',
    useImperativeHandle: 'Customizes the instance value exposed to parent components when using ref',
    useDebugValue: 'Used to display a label for custom hooks in React DevTools',
    useId: 'Generates unique IDs that are stable across the server and client',
    useTransition: 'Returns a stateful value for the pending state of the transition',
    useDeferredValue: 'Returns a deferred version of the value that may "lag behind" it',
    useSyncExternalStore: 'Subscribes to an external store',
    useInsertionEffect: 'Fires synchronously before all DOM mutations'
  };
  
  return descriptions[hookName] || `React built-in hook: ${hookName}`;
}

// Get built-in hook JSDoc information
function getBuiltInHookJSDoc(hookName: string): ComponentDoc['jsdoc'] {
  const jsDocInfo: Record<string, ComponentDoc['jsdoc']> = {
    useState: {
      description: 'Returns a stateful value and a function to update it',
      params: [{ name: 'initialState', type: 'T | (() => T)', description: 'The initial state value or lazy initial state function' }],
      returns: { type: '[T, Dispatch<SetStateAction<T>>]', description: 'A tuple with the current state value and a setter function' }
    },
    useEffect: {
      description: 'Performs side effects in function components',
      params: [
        { name: 'effect', type: 'EffectCallback', description: 'The effect function to run' },
        { name: 'deps', type: 'DependencyList?', description: 'Optional array of dependencies' }
      ],
      returns: { type: 'void', description: 'This hook does not return a value' }
    },
    useCallback: {
      description: 'Returns a memoized callback function',
      params: [
        { name: 'callback', type: 'T', description: 'The callback function to memoize' },
        { name: 'deps', type: 'DependencyList', description: 'Array of dependencies' }
      ],
      returns: { type: 'T', description: 'The memoized callback function' }
    },
    useMemo: {
      description: 'Returns a memoized value',
      params: [
        { name: 'factory', type: '() => T', description: 'Function that returns a value to memoize' },
        { name: 'deps', type: 'DependencyList', description: 'Array of dependencies' }
      ],
      returns: { type: 'T', description: 'The memoized value' }
    }
  };
  
  return jsDocInfo[hookName];
}

// Extract JSDoc description from comment text
function extractJsDocDescription(jsDocText: string): string | undefined {
  const lines = jsDocText.split('\n');
  const descriptionLines: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('/**') || trimmed.startsWith('*/') || trimmed.startsWith('*')) {
      const content = trimmed.replace(/^\/?\*+\/?/, '').trim();
      if (content && !content.startsWith('@')) {
        descriptionLines.push(content);
      }
    }
  }
  
  return descriptionLines.length > 0 ? descriptionLines.join(' ') : undefined;
}