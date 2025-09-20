import fs from 'fs/promises';
import path from 'path';

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

// Override management functions
export const loadOverrides = async (projectRoot: string): Promise<OverridesConfig> => {
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

export const saveOverrides = async (projectRoot: string, config: OverridesConfig): Promise<void> => {
  const overridesPath = path.join(projectRoot, '.smartdocs-overrides.json');
  
  try {
    await fs.writeFile(overridesPath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.warn('Failed to save overrides file:', error);
  }
};

export const findOverride = (overrides: ComponentOverride[], filePath: string, componentName: string): ComponentOverride | undefined => {
  // Normalize paths for comparison (handle both relative and absolute paths)
  const normalizePathForComparison = (path: string) => {
    return path.replace(/\\/g, '/').toLowerCase();
  };

  const normalizedFilePath = normalizePathForComparison(filePath);
  
  return overrides.find(override => {
    const normalizedOverridePath = normalizePathForComparison(override.filePath);
    
    // Try exact match first
    if (normalizedOverridePath === normalizedFilePath && override.componentName === componentName) {
      return true;
    }
    
    // Try relative path matching (in case one is absolute and other is relative)
    if (normalizedFilePath.endsWith(normalizedOverridePath) || normalizedOverridePath.endsWith(normalizedFilePath)) {
      return override.componentName === componentName;
    }
    
    return false;
  });
};

// Export function to add/update overrides
export const updateComponentOverride = async (
  projectRoot: string, 
  filePath: string, 
  componentName: string, 
  originalType: 'component' | 'hook' | 'page', 
  newType: 'component' | 'hook' | 'page', 
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
    originalType,
    overrideType: newType,
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

// Export function to remove overrides
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
