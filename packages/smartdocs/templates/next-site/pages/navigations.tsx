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

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'page': return 'fill-purple-100 stroke-purple-500 dark:fill-purple-900/30 dark:stroke-purple-400'
      case 'component': return 'fill-blue-100 stroke-blue-500 dark:fill-blue-900/30 dark:stroke-blue-400'
      case 'hook': return 'fill-green-100 stroke-green-500 dark:fill-green-900/30 dark:stroke-green-400'
      default: return 'fill-slate-100 stroke-slate-500 dark:fill-slate-800 dark:stroke-slate-400'
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

              {/* Connections */}
              {connections.map(connection => {
                const fromNode = nodes.find(n => n.id === connection.fromPageId)
                const toNode = nodes.find(n => n.id === connection.toPageId)
                if (!fromNode || !toNode) return null

                const fromX = fromNode.x + 80
                const fromY = fromNode.y + 30
                const toX = toNode.x
                const toY = toNode.y + 30

                // Calculate arrow
                const angle = Math.atan2(toY - fromY, toX - fromX)
                const arrowLength = 10
                const arrowX = toX - arrowLength * Math.cos(angle)
                const arrowY = toY - arrowLength * Math.sin(angle)

                return (
                  <g key={connection.id}>
                    <path
                      d={`M ${fromX} ${fromY} Q ${(fromX + toX) / 2} ${fromY - 50} ${toX} ${toY}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-indigo-500 dark:text-indigo-400"
                      markerEnd="url(#arrowhead)"
                    />
                    <defs>
                      <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="7"
                        refX="9"
                        refY="3.5"
                        orient="auto"
                      >
                        <polygon
                          points="0 0, 10 3.5, 0 7"
                          className="fill-indigo-500 dark:fill-indigo-400"
                        />
                      </marker>
                    </defs>
                  </g>
                )
              })}

              {/* Temporary connection line while connecting */}
              {isConnecting && connectingFrom && (
                <path
                  d={`M ${nodes.find(n => n.id === connectingFrom)?.x! + 80} ${nodes.find(n => n.id === connectingFrom)?.y! + 30} L ${mousePos.x} ${mousePos.y}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  className="text-indigo-400 dark:text-indigo-500"
                />
              )}

              {/* Nodes */}
              {nodes.map(node => (
                <g key={node.id} className="cursor-pointer">
                  <rect
                    x={node.x}
                    y={node.y}
                    width="160"
                    height="60"
                    rx="8"
                    className={`${getNodeColor(node.type)} transition-all hover:shadow-lg ${
                      selectedNode === node.id ? 'stroke-2' : 'stroke-1'
                    } ${draggedNode === node.id ? 'opacity-80' : ''} ${
                      isConnecting && connectingFrom === node.id ? 'stroke-2 stroke-yellow-400' : ''
                    }`}
                    onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                    style={{ filter: draggedNode === node.id ? 'drop-shadow(0 8px 16px rgba(0,0,0,0.15))' : 'none' }}
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
                        node.type === 'page' ? 'text-purple-600 dark:text-purple-400' :
                        node.type === 'component' ? 'text-blue-600 dark:text-blue-400' :
                        'text-green-600 dark:text-green-400'
                      }`}>
                        {getNodeIcon(node.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                          {node.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">
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
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 mb-3 sm:mb-4 text-center">
          🎯 How to Use
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 text-sm">
          <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <Move className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-slate-900 dark:text-slate-100">Drag Pages</div>
              <div className="text-slate-500 dark:text-slate-400">Click and drag page nodes to reposition them</div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <ArrowRight className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-slate-900 dark:text-slate-100">Connect Pages</div>
              <div className="text-slate-500 dark:text-slate-400">Click "Connect" then click two pages to create arrows</div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <ZoomIn className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-slate-900 dark:text-slate-100">Zoom & Pan</div>
              <div className="text-slate-500 dark:text-slate-400">Mouse wheel to zoom, drag canvas to pan around</div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <Trash2 className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-slate-900 dark:text-slate-100">Clear Connections</div>
              <div className="text-slate-500 dark:text-slate-400">Remove all connection arrows between pages</div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <Maximize2 className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-slate-900 dark:text-slate-100">Fit View</div>
              <div className="text-slate-500 dark:text-slate-400">Reset zoom and pan to default view</div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <RotateCcw className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-slate-900 dark:text-slate-100">Reset All</div>
              <div className="text-slate-500 dark:text-slate-400">Restore positions, connections, and view</div>
            </div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
            <div className="text-sm">
              <div className="font-medium text-yellow-800 dark:text-yellow-200">Auto Connections</div>
              <div className="text-yellow-700 dark:text-yellow-300">Pages are automatically connected based on relationships (HomePage to others, related pages, etc.)</div>
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
