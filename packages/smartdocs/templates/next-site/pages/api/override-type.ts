import type { NextApiRequest, NextApiResponse } from 'next';
import { updateComponentOverride, removeComponentOverride } from '../../utils/overrides';
import path from 'path';

type ComponentType = 'component' | 'hook' | 'page';

interface OverrideRequest {
  action: 'update' | 'remove';
  filePath: string;
  componentName: string;
  originalType?: ComponentType;
  newType?: ComponentType;
  reason?: string;
}

interface OverrideResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OverrideResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { action, filePath, componentName, originalType, newType, reason }: OverrideRequest = req.body;

    // Get project root (go up from .smartdocs directory)
    const projectRoot = path.join(process.cwd(), '..');

    if (action === 'update') {
      if (!originalType || !newType) {
        return res.status(400).json({
          success: false,
          error: 'originalType and newType are required for update action'
        });
      }

      await updateComponentOverride(
        projectRoot,
        filePath,
        componentName,
        originalType,
        newType,
        reason
      );

      return res.json({
        success: true,
        message: `Successfully updated ${componentName} from ${originalType} to ${newType}`
      });
    }

    if (action === 'remove') {
      await removeComponentOverride(projectRoot, filePath, componentName);

      return res.json({
        success: true,
        message: `Successfully removed override for ${componentName}`
      });
    }

    return res.status(400).json({
      success: false,
      error: 'Invalid action. Must be "update" or "remove"'
    });

  } catch (error) {
    console.error('Override API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
