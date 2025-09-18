import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Try to read package.json from various possible locations
    const possiblePaths = [
      path.join(process.cwd(), '..', '..', 'package.json'), // From built site back to project root
      path.join(process.cwd(), '..', 'package.json'),
      path.join(process.cwd(), 'package.json'),
    ]

    let packageData = null
    
    for (const pkgPath of possiblePaths) {
      try {
        if (fs.existsSync(pkgPath)) {
          const content = fs.readFileSync(pkgPath, 'utf-8')
          packageData = JSON.parse(content)
          break
        }
      } catch (e) {
        continue
      }
    }

    if (!packageData) {
      // Return mock data for demo purposes
      return res.status(200).json({
        dependencies: Array(15).fill(0).map((_, i) => `dependency-${i + 1}`),
        devDependencies: Array(10).fill(0).map((_, i) => `dev-dependency-${i + 1}`)
      })
    }

    // Return actual package data
    const dependencies = Object.keys(packageData.dependencies || {})
    const devDependencies = Object.keys(packageData.devDependencies || {})

    res.status(200).json({
      dependencies,
      devDependencies,
      total: dependencies.length + devDependencies.length
    })
    
  } catch (error) {
    console.error('Error reading package data:', error)
    
    // Return mock data on error
    res.status(200).json({
      dependencies: Array(15).fill(0).map((_, i) => `dependency-${i + 1}`),
      devDependencies: Array(10).fill(0).map((_, i) => `dev-dependency-${i + 1}`)
    })
  }
}
