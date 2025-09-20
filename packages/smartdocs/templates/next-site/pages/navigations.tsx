import { GetStaticProps } from 'next'
import { Layout } from '../components/Layout'
import { Navigation, MousePointer, Move, Zap, FileText, Component, Code, ArrowRight, Plus, Save, RotateCcw, Trash2, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import React, { useState, useEffect, useRef, useCallback } from 'react'

interface PageNode {
  id: string;
  name: string;
  type: 'page' | 'component' | 'hook';
  x: number;
  y: number;
  filePath: string;
}

interface Connection {
  id: string;
  fromPageId: string;
  toPageId: string;
}

interface NavigationData {
  components: any[];
}

interface NavigationsPageProps {
  navigationData: NavigationData;
}

export default function NavigationsPage({ navigationData }: NavigationsPageProps) {
  const canvasRef = useRef<SVGSVGElement>(null)
  const [nodes, setNodes] = useState<PageNode[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [lastPanOffset, setLastPanOffset] = useState({ x: 0, y: 0 })

  // Initialize nodes and auto connections from components data
  useEffect(() => {
    const pages = navigationData.components.filter(comp => comp.type === 'page')
    const initialNodes: PageNode[] = pages.map((page, index) => ({
      id: page.displayName,
      name: page.displayName,
      type: page.type,
      x: 150 + (index % 4) * 300,
      y: 100 + Math.floor(index / 4) * 200,
      filePath: page.filePath
    }))
    setNodes(initialNodes)

    // Auto-generate connections based on page relationships
    const autoConnections: Connection[] = []
    
    // Create connections for pages that likely connect to each other
    pages.forEach((page, index) => {
      const pageName = page.displayName.toLowerCase()
      
      // Connect to HomePage if it exists and this isn't HomePage
      const homePage = pages.find(p => p.displayName.toLowerCase().includes('home'))
      if (homePage && page.displayName !== homePage.displayName && pageName !== 'home') {
        autoConnections.push({
          id: `${homePage.displayName}-${page.displayName}`,
          fromPageId: homePage.displayName,
          toPageId: page.displayName
        })
      }
      
      // Connect related pages (e.g., Contact to About, Dynamic pages to each other)
      pages.forEach((otherPage, otherIndex) => {
        if (index !== otherIndex) {
          const otherName = otherPage.displayName.toLowerCase()
          
          // Connect Dynamic pages to each other
          if (pageName.includes('dynamic') && otherName.includes('dynamic')) {
            autoConnections.push({
              id: `${page.displayName}-${otherPage.displayName}`,
              fromPageId: page.displayName,
              toPageId: otherPage.displayName
            })
          }
          
          // Connect Contact to About
          if (pageName.includes('contact') && otherName.includes('about')) {
            autoConnections.push({
              id: `${otherPage.displayName}-${page.displayName}`,
              fromPageId: otherPage.displayName,
              toPageId: page.displayName
            })
          }
          
          // Connect Example pages to main pages
          if (pageName.includes('example') && (otherName.includes('home') || otherName.includes('about'))) {
            autoConnections.push({
              id: `${otherPage.displayName}-${page.displayName}`,
              fromPageId: otherPage.displayName,
              toPageId: page.displayName
            })
          }
        }
      })
    })
    
    // Remove duplicates and set connections
    const uniqueConnections = autoConnections.filter((conn, index, self) => 
      index === self.findIndex(c => c.id === conn.id)
    )
    setConnections(uniqueConnections)
  }, [navigationData])

  // Coordinate transformation helpers
  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    return {
      x: (screenX - panOffset.x) / zoom,
      y: (screenY - panOffset.y) / zoom
    }
  }, [zoom, panOffset])

  const canvasToScreen = useCallback((canvasX: number, canvasY: number) => {
    return {
      x: canvasX * zoom + panOffset.x,
      y: canvasY * zoom + panOffset.y
    }
  }, [zoom, panOffset])

  // Zoom handlers
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.25))
  }

  const handleZoomReset = () => {
    setZoom(1)
    setPanOffset({ x: 0, y: 0 })
  }

  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault()
    if (!canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    
    const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.min(Math.max(zoom * zoomDelta, 0.25), 3)
    
    // Zoom towards mouse position
    const mouseX = e.clientX - rect.left - centerX
    const mouseY = e.clientY - rect.top - centerY
    
    const zoomRatio = newZoom / zoom
    setPanOffset(prev => ({
      x: prev.x + mouseX * (1 - zoomRatio),
      y: prev.y + mouseY * (1 - zoomRatio)
    }))
    
    setZoom(newZoom)
  }, [zoom])

  // Mouse move handler for canvas
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!canvasRef.current) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top
    const canvasCoords = screenToCanvas(screenX, screenY)
    setMousePos(canvasCoords)

    if (isPanning) {
      const deltaX = e.clientX - panStart.x
      const deltaY = e.clientY - panStart.y
      setPanOffset({
        x: lastPanOffset.x + deltaX,
        y: lastPanOffset.y + deltaY
      })
    } else if (draggedNode) {
      setNodes(prev => prev.map(node => 
        node.id === draggedNode 
          ? { 
              ...node, 
              x: canvasCoords.x - dragOffset.x, 
              y: canvasCoords.y - dragOffset.y 
            }
          : node
      ))
    }
  }, [draggedNode, dragOffset, isPanning, panStart, lastPanOffset, screenToCanvas])

  const handleNodeMouseDown = (nodeId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isConnecting) {
      if (connectingFrom && connectingFrom !== nodeId) {
        // Create connection
        const newConnection: Connection = {
          id: `${connectingFrom}-${nodeId}`,
          fromPageId: connectingFrom,
          toPageId: nodeId
        }
        setConnections(prev => [...prev.filter(c => c.id !== newConnection.id), newConnection])
        setIsConnecting(false)
        setConnectingFrom(null)
      } else if (!connectingFrom) {
        setConnectingFrom(nodeId)
      }
      return
    }

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const node = nodes.find(n => n.id === nodeId)
    if (!node) return

    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top
    const canvasCoords = screenToCanvas(screenX, screenY)

    setDraggedNode(nodeId)
    setSelectedNode(nodeId)
    setDragOffset({
      x: canvasCoords.x - node.x,
      y: canvasCoords.y - node.y
    })
  }

  const handleCanvasMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isConnecting) {
      setIsConnecting(false)
      setConnectingFrom(null)
    }
    
    if (!draggedNode) {
      setIsPanning(true)
      setPanStart({ x: e.clientX, y: e.clientY })
      setLastPanOffset(panOffset)
      setSelectedNode(null)
    }
  }

  const handleMouseUp = () => {
    setDraggedNode(null)
    setDragOffset({ x: 0, y: 0 })
    setIsPanning(false)
  }


  const clearConnections = () => {
    setConnections([])
    setIsConnecting(false)
    setConnectingFrom(null)
  }

  const startConnecting = () => {
    setIsConnecting(true)
    setConnectingFrom(null)
  }

  const resetLayout = () => {
    const pages = navigationData.components.filter(comp => comp.type === 'page')
    const resetNodes: PageNode[] = pages.map((page, index) => ({
      id: page.displayName,
      name: page.displayName,
      type: page.type,
      x: 150 + (index % 4) * 300,
      y: 100 + Math.floor(index / 4) * 200,
      filePath: page.filePath
    }))
    setNodes(resetNodes)
    
    // Regenerate auto connections
    const autoConnections: Connection[] = []
    pages.forEach((page, index) => {
      const pageName = page.displayName.toLowerCase()
      const homePage = pages.find(p => p.displayName.toLowerCase().includes('home'))
      if (homePage && page.displayName !== homePage.displayName && pageName !== 'home') {
        autoConnections.push({
          id: `${homePage.displayName}-${page.displayName}`,
          fromPageId: homePage.displayName,
          toPageId: page.displayName
        })
      }
    })
    setConnections(autoConnections.filter((conn, index, self) => 
      index === self.findIndex(c => c.id === conn.id)
    ))
    
    // Reset view
    setZoom(1)
    setPanOffset({ x: 0, y: 0 })
    setSelectedNode(null)
    setIsConnecting(false)
    setConnectingFrom(null)
    setIsPanning(false)
  }

  const getNodeColor = (type: string, isDark = false) => {
    switch (type) {
      case 'page': 
        return isDark 
          ? 'fill-url(#pageGradientDark) stroke-purple-400' 
          : 'fill-url(#pageGradient) stroke-purple-500'
      case 'component': 
        return isDark 
          ? 'fill-url(#componentGradientDark) stroke-blue-400' 
          : 'fill-url(#componentGradient) stroke-blue-500'
      case 'hook': 
        return isDark 
          ? 'fill-url(#hookGradientDark) stroke-green-400' 
          : 'fill-url(#hookGradient) stroke-green-500'
      default: 
        return isDark 
          ? 'fill-slate-800 stroke-slate-400' 
          : 'fill-slate-100 stroke-slate-500'
    }
  }

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'page': return <FileText className="h-5 w-5" />
      case 'component': return <Component className="h-5 w-5" />
      case 'hook': return <Zap className="h-5 w-5" />
      default: return <Code className="h-5 w-5" />
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 dark:from-indigo-900/10 dark:via-slate-900 dark:to-purple-900/10 -z-10"></div>
        <div className="relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg">
                <Navigation className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 via-indigo-800 to-purple-800 dark:from-slate-100 dark:via-indigo-300 dark:to-purple-300 bg-clip-text text-transparent">
                  🗺️ Navigations
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-400 mt-1 sm:mt-2">
                  Visual page flow and navigation mapping
                </p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg px-3 sm:px-4 py-2 shadow-lg border border-slate-200 dark:border-slate-700 self-start lg:self-auto">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {nodes.length} pages
                </span>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4 sm:mt-6">
            <button
              onClick={startConnecting}
              className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isConnecting 
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-600'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <ArrowRight className="h-4 w-4" />
              <span className="hidden sm:inline">{isConnecting ? 'Connecting...' : 'Connect Pages'}</span>
              <span className="sm:hidden">{isConnecting ? '...' : 'Connect'}</span>
            </button>
            <button
              onClick={clearConnections}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Clear Connections</span>
              <span className="sm:hidden">Clear</span>
            </button>
            
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800">
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 0.25}
                className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-l-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 border-x border-slate-200 dark:border-slate-700 min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>
            
            <button
              onClick={handleZoomReset}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              title="Reset View"
            >
              <Maximize2 className="h-4 w-4" />
              <span className="hidden sm:inline">Fit View</span>
            </button>
            
            <button
              onClick={resetLayout}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Reset All</span>
              <span className="sm:hidden">Reset</span>
            </button>
            
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <Move className="h-3 w-3" />
              <span className="hidden sm:inline">Drag canvas • Wheel zoom • Drag nodes</span>
              <span className="sm:hidden">Drag • Zoom</span>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="p-4 sm:p-6">
          <div className="relative bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <svg
              ref={canvasRef}
              width="100%"
              height="600"
              viewBox={`${-panOffset.x / zoom} ${-panOffset.y / zoom} ${1200 / zoom} ${600 / zoom}`}
              className={`block ${isPanning ? 'cursor-move' : 'cursor-default'}`}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseDown={handleCanvasMouseDown}
              onWheel={handleWheel}
              style={{ touchAction: 'none' }}
            >
              {/* Grid pattern */}
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-300 dark:text-slate-600" opacity="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Connection Definitions */}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="6"
                  markerHeight="4"
                  refX="5.5"
                  refY="2"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <polygon
                    points="0 0, 6 2, 0 4"
                    fill="#1e293b"
                    className="dark:fill-slate-300"
                  />
                </marker>
                
                {/* Node Gradients - Better Colors */}
                <linearGradient id="pageGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fdf4ff" />
                  <stop offset="50%" stopColor="#fae8ff" />
                  <stop offset="100%" stopColor="#f3e8ff" />
                </linearGradient>
                <linearGradient id="pageGradientDark" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(168, 85, 247, 0.8)" />
                  <stop offset="50%" stopColor="rgba(147, 51, 234, 0.6)" />
                  <stop offset="100%" stopColor="rgba(126, 34, 206, 0.5)" />
                </linearGradient>
                
                <linearGradient id="componentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f0f9ff" />
                  <stop offset="50%" stopColor="#e0f2fe" />
                  <stop offset="100%" stopColor="#bae6fd" />
                </linearGradient>
                <linearGradient id="componentGradientDark" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(14, 165, 233, 0.8)" />
                  <stop offset="50%" stopColor="rgba(59, 130, 246, 0.6)" />
                  <stop offset="100%" stopColor="rgba(37, 99, 235, 0.5)" />
                </linearGradient>
                
                <linearGradient id="hookGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f0fdf4" />
                  <stop offset="50%" stopColor="#d1fae5" />
                  <stop offset="100%" stopColor="#a7f3d0" />
                </linearGradient>
                <linearGradient id="hookGradientDark" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(34, 197, 94, 0.8)" />
                  <stop offset="50%" stopColor="rgba(16, 185, 129, 0.6)" />
                  <stop offset="100%" stopColor="rgba(5, 150, 105, 0.5)" />
                </linearGradient>
                
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                
                <filter id="nodeGlow">
                  <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Connections */}
              {connections.map(connection => {
                const fromNode = nodes.find(n => n.id === connection.fromPageId)
                const toNode = nodes.find(n => n.id === connection.toPageId)
                if (!fromNode || !toNode) return null

                // Calculate connection points (center to center)
                const fromCenterX = fromNode.x + 80
                const fromCenterY = fromNode.y + 30
                const toCenterX = toNode.x + 80
                const toCenterY = toNode.y + 30

                // Calculate edge intersection points for cleaner connections
                const dx = toCenterX - fromCenterX
                const dy = toCenterY - fromCenterY
                const distance = Math.sqrt(dx * dx + dy * dy)
                
                if (distance === 0) return null

                // Normalize direction
                const unitX = dx / distance
                const unitY = dy / distance

                // Calculate edge points
                const nodeWidth = 160
                const nodeHeight = 60
                
                // From node edge point
                let fromX = fromCenterX
                let fromY = fromCenterY
                
                if (Math.abs(unitX) > Math.abs(unitY)) {
                  // Horizontal connection
                  fromX = fromCenterX + (unitX > 0 ? nodeWidth/2 : -nodeWidth/2)
                  fromY = fromCenterY
                } else {
                  // Vertical connection
                  fromX = fromCenterX
                  fromY = fromCenterY + (unitY > 0 ? nodeHeight/2 : -nodeHeight/2)
                }

                // To node edge point
                let toX = toCenterX
                let toY = toCenterY
                
                if (Math.abs(unitX) > Math.abs(unitY)) {
                  // Horizontal connection
                  toX = toCenterX + (unitX > 0 ? -nodeWidth/2 : nodeWidth/2)
                  toY = toCenterY
                } else {
                  // Vertical connection
                  toX = toCenterX
                  toY = toCenterY + (unitY > 0 ? -nodeHeight/2 : nodeHeight/2)
                }

                // Create smooth curved path
                const controlOffset = Math.min(Math.abs(dx), Math.abs(dy)) * 0.5 + 50
                const controlX1 = fromX + (unitX * controlOffset)
                const controlY1 = fromY
                const controlX2 = toX - (unitX * controlOffset)
                const controlY2 = toY

                return (
                  <g key={connection.id}>
                    {/* Shadow/glow effect */}
                    <path
                      d={`M ${fromX} ${fromY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${toX} ${toY}`}
                      fill="none"
                      stroke="rgba(30, 41, 59, 0.3)"
                      strokeWidth="4"
                      className="dark:stroke-slate-300/30"
                    />
                    {/* Main connection line */}
                    <path
                      d={`M ${fromX} ${fromY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${toX} ${toY}`}
                      fill="none"
                      stroke="#334155"
                      strokeWidth="2"
                      className="dark:stroke-slate-300 transition-all hover:stroke-slate-700 dark:hover:stroke-slate-200"
                      markerEnd="url(#arrowhead)"
                      style={{ filter: 'url(#glow)' }}
                    />
                  </g>
                )
              })}

              {/* Temporary connection line while connecting */}
              {isConnecting && connectingFrom && (() => {
                const fromNode = nodes.find(n => n.id === connectingFrom)
                if (!fromNode) return null
                
                const fromCenterX = fromNode.x + 80
                const fromCenterY = fromNode.y + 30
                
                // Calculate direction to mouse
                const dx = mousePos.x - fromCenterX
                const dy = mousePos.y - fromCenterY
                const distance = Math.sqrt(dx * dx + dy * dy)
                
                if (distance === 0) return null
                
                const unitX = dx / distance
                const unitY = dy / distance
                
                // Start from edge of node
                let fromX = fromCenterX
                let fromY = fromCenterY
                
                const nodeWidth = 160
                const nodeHeight = 60
                
                if (Math.abs(unitX) > Math.abs(unitY)) {
                  fromX = fromCenterX + (unitX > 0 ? nodeWidth/2 : -nodeWidth/2)
                  fromY = fromCenterY
                } else {
                  fromX = fromCenterX
                  fromY = fromCenterY + (unitY > 0 ? nodeHeight/2 : -nodeHeight/2)
                }
                
                return (
                  <g>
                    {/* Glow effect for preview */}
                    <path
                      d={`M ${fromX} ${fromY} L ${mousePos.x} ${mousePos.y}`}
                      fill="none"
                      stroke="rgba(30, 41, 59, 0.4)"
                      strokeWidth="4"
                      strokeDasharray="8,8"
                      className="dark:stroke-slate-300/40"
                    />
                    {/* Main preview line */}
                    <path
                      d={`M ${fromX} ${fromY} L ${mousePos.x} ${mousePos.y}`}
                      fill="none"
                      stroke="#475569"
                      strokeWidth="2"
                      strokeDasharray="8,8"
                      className="dark:stroke-slate-400 animate-pulse"
                      markerEnd="url(#arrowhead)"
                    />
                  </g>
                )
              })()}

              {/* Nodes */}
              {nodes.map(node => (
                <g 
                  key={node.id} 
                  className="cursor-pointer transition-all duration-300 ease-out"
                  style={{ 
                    transform: draggedNode === node.id ? 'scale(1.08) rotate(2deg)' : 
                              selectedNode === node.id ? 'scale(1.04)' : 'scale(1)',
                    transformOrigin: `${node.x + 80}px ${node.y + 30}px`,
                    filter: draggedNode === node.id ? 'drop-shadow(0 20px 35px rgba(0,0,0,0.15))' : 
                           selectedNode === node.id ? 'drop-shadow(0 12px 20px rgba(0,0,0,0.1))' :
                           'drop-shadow(0 6px 12px rgba(0,0,0,0.08))'
                  }}
                >
                  {/* Node shadow */}
                  <rect
                    x={node.x + 2}
                    y={node.y + 2}
                    width="160"
                    height="60"
                    rx="12"
                    className="fill-black/10 dark:fill-black/30"
                    style={{ filter: 'blur(4px)' }}
                  />
                  {/* Main node */}
                  <rect
                    x={node.x}
                    y={node.y}
                    width="160"
                    height="60"
                    rx="12"
                    fill={node.type === 'page' ? '#570083' : 
                          node.type === 'component' ? 'url(#componentGradient)' : 
                          node.type === 'hook' ? 'url(#hookGradient)' : '#f8fafc'}
                    stroke={node.type === 'page' ? '#7c3aed' : 
                            node.type === 'component' ? '#0ea5e9' : 
                            node.type === 'hook' ? '#10b981' : '#64748b'}
                    strokeWidth={selectedNode === node.id || (isConnecting && connectingFrom === node.id) ? '2' : '1.5'}
                    className={`${
                      selectedNode === node.id ? 'filter brightness-110' : ''
                    } ${draggedNode === node.id ? 'opacity-95' : 'hover:opacity-90'} ${
                      isConnecting && connectingFrom === node.id ? 'animate-pulse' : ''
                    }`}
                    onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                    style={{ cursor: 'grab' }}
                  />
                  <foreignObject 
                    x={node.x + 8} 
                    y={node.y + 8} 
                    width="144" 
                    height="44"
                    onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                    style={{ pointerEvents: 'none' }}
                  >
                    <div 
                      className="flex items-center gap-2 p-2 select-none"
                      style={{ 
                        userSelect: 'none', 
                        WebkitUserSelect: 'none',
                        MozUserSelect: 'none',
                        msUserSelect: 'none'
                      }}
                    >
                      <div className={`p-1 rounded ${
                        node.type === 'page' ? 'text-white' :
                        node.type === 'component' ? 'text-blue-600 dark:text-blue-400' :
                        'text-green-600 dark:text-green-400'
                      }`}>
                        {getNodeIcon(node.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium text-sm truncate ${
                          node.type === 'page' ? 'text-white' : 'text-slate-900 dark:text-slate-100'
                        }`}>
                          {node.name}
                        </div>
                        <div className={`text-xs capitalize ${
                          node.type === 'page' ? 'text-purple-200' : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          {node.type}
                        </div>
                      </div>
                      {isConnecting && connectingFrom === node.id && (
                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                      )}
                    </div>
                  </foreignObject>
                  {/* Invisible overlay for better click handling */}
                  <rect
                    x={node.x}
                    y={node.y}
                    width="160"
                    height="60"
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                  />
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-pink-50/50 dark:from-indigo-900/10 dark:via-purple-900/10 dark:to-pink-900/10 rounded-xl"></div>
        <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 rounded-xl p-6 sm:p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full text-white font-semibold text-lg shadow-lg">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                🎯
              </div>
              How to Use
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {/* Drag Pages */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all group-hover:shadow-xl group-hover:-translate-y-1">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Move className="h-6 w-6 text-white" />
                  </div>
                  <div className="font-bold text-lg text-slate-900 dark:text-slate-100">Drag Pages</div>
                </div>
                <div className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Click and drag page nodes to reposition them anywhere on the canvas
                </div>
              </div>
            </div>

            {/* Connect Pages */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 transition-all group-hover:shadow-xl group-hover:-translate-y-1">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                    <ArrowRight className="h-6 w-6 text-white" />
                  </div>
                  <div className="font-bold text-lg text-slate-900 dark:text-slate-100">Connect Pages</div>
                </div>
                <div className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Click "Connect" then click two pages to create curved connection arrows
                </div>
              </div>
            </div>

            {/* Zoom & Pan */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all group-hover:shadow-xl group-hover:-translate-y-1">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                    <ZoomIn className="h-6 w-6 text-white" />
                  </div>
                  <div className="font-bold text-lg text-slate-900 dark:text-slate-100">Zoom & Pan</div>
                </div>
                <div className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Mouse wheel to zoom, drag empty areas to pan around the canvas
                </div>
              </div>
            </div>

            {/* Clear Connections */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-600 transition-all group-hover:shadow-xl group-hover:-translate-y-1">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Trash2 className="h-6 w-6 text-white" />
                  </div>
                  <div className="font-bold text-lg text-slate-900 dark:text-slate-100">Clear Connections</div>
                </div>
                <div className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Remove all connection arrows between pages with one click
                </div>
              </div>
            </div>

            {/* Fit View */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-600 transition-all group-hover:shadow-xl group-hover:-translate-y-1">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Maximize2 className="h-6 w-6 text-white" />
                  </div>
                  <div className="font-bold text-lg text-slate-900 dark:text-slate-100">Fit View</div>
                </div>
                <div className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Reset zoom and pan to default view with perfect centering
                </div>
              </div>
            </div>

            {/* Reset All */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-600 transition-all group-hover:shadow-xl group-hover:-translate-y-1">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                    <RotateCcw className="h-6 w-6 text-white" />
                  </div>
                  <div className="font-bold text-lg text-slate-900 dark:text-slate-100">Reset All</div>
                </div>
                <div className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Restore positions, connections, and view to original state
                </div>
              </div>
            </div>
          </div>

          {/* Pro Tip */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-orange-400/20 rounded-xl blur-lg"></div>
            <div className="relative bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-6 rounded-xl border border-amber-200 dark:border-amber-700/50">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                  ✨
                </div>
                <div>
                  <div className="font-bold text-lg text-amber-900 dark:text-amber-200 mb-2">Smart Auto-Connections</div>
                  <div className="text-amber-800 dark:text-amber-300 leading-relaxed">
                    Pages are automatically connected based on detected relationships - HomePage connects to others, dynamic pages link together, and related pages find each other intelligently.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  let navigationData: NavigationData = { components: [] }
  
  try {
    const fs = await import('fs')
    const path = await import('path')
    const searchJsonPath = path.join(process.cwd(), 'content', 'search.json')
    
    const searchData = JSON.parse(fs.readFileSync(searchJsonPath, 'utf-8'))
    navigationData = { components: searchData.components || [] }
  } catch (error) {
    console.warn('Could not read components data for navigations:', error)
    navigationData = { components: [] }
  }

  return {
    props: {
      navigationData
    }
  }
}
