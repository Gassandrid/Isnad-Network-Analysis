"use client"

import { useEffect, useRef, useState, useMemo, useCallback } from "react"
import dynamic from "next/dynamic"
import type { Narrator, Link, ForceConfig } from "@/types/network"

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
})

interface NetworkGraphProps {
  nodes: Narrator[]
  links: Link[]
  selectedNarrator?: string | number
  onNodeClick?: (narrator: Narrator) => void
  highlightedPath?: Array<string | number>
  forceConfig: ForceConfig
}

export function NetworkGraph({
  nodes,
  links,
  selectedNarrator,
  onNodeClick,
  highlightedPath = [],
  forceConfig,
}: NetworkGraphProps) {
  const graphRef = useRef<any>()
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [hoveredNode, setHoveredNode] = useState<string | number | null>(null)

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        setDimensions({ width, height })
      }
    }
    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  // Apply forces on mount and when config changes (debounced for smooth transitions)
  useEffect(() => {
    const applyForces = () => {
      if (graphRef.current) {
        const fg = graphRef.current

        fg.d3Force("charge")?.strength(forceConfig.charge)
        fg.d3Force("link")?.distance(forceConfig.linkDistance).strength(0.2)
        fg.d3Force("center")?.strength(forceConfig.centerStrength)
        fg.d3Force("collide")?.radius(forceConfig.collisionRadius).strength(1)

        // Don't reheat - let simulation continue with current velocity for smooth transitions

        console.log("[Graph] Applied forces:", {
          charge: forceConfig.charge,
          linkDistance: forceConfig.linkDistance,
          linkStrength: 0.2,
          centerStrength: forceConfig.centerStrength
        })
      }
    }

    // Debounce force application for smoother slider interactions
    const timer = setTimeout(applyForces, 200)
    return () => clearTimeout(timer)
  }, [forceConfig])


  // Memoize graph data to prevent object recreation on every render
  const graphData = useMemo(() => ({ nodes, links }), [nodes, links])

  // Memoize neighbor map for better performance
  const neighborMap = useMemo(() => {
    const map = new Map<string, Set<string>>()

    links.forEach((link) => {
      const sourceId = String(typeof link.source === "object" ? link.source.id : link.source)
      const targetId = String(typeof link.target === "object" ? link.target.id : link.target)

      if (!map.has(sourceId)) map.set(sourceId, new Set())
      if (!map.has(targetId)) map.set(targetId, new Set())

      map.get(sourceId)!.add(targetId)
      map.get(targetId)!.add(sourceId)
    })

    return map
  }, [links])

  const getNodeColor = useCallback((node: Narrator) => {
    const isDark = document.documentElement.classList.contains("dark")
    const nodeId = String(node.id)

    // Highlighted path uses secondary color
    if (highlightedPath.map(String).includes(nodeId)) {
      return isDark ? "#c59b8d" : "#a67c6d"
    }

    // Selected node uses secondary color
    if (String(selectedNarrator) === nodeId) {
      return isDark ? "#c59b8d" : "#a67c6d"
    }

    // Hovered node
    if (hoveredNode && String(hoveredNode) === nodeId) {
      return isDark ? "#e8c4b8" : "#8a5a4a"
    }

    // Neighbor of hovered node
    if (hoveredNode) {
      const neighbors = neighborMap.get(String(hoveredNode))
      if (neighbors?.has(nodeId)) {
        return isDark ? "#a88b7f" : "#b39080"
      }
    }

    if (isDark) {
      return "#6b6158" // gray from dark mode palette
    }
    return "#9a8f82" // gray from light mode palette
  }, [hoveredNode, highlightedPath, selectedNarrator, neighborMap])

  const getLinkColor = useCallback((link: any) => {
    const sourceId = String(typeof link.source === "object" ? link.source.id : link.source)
    const targetId = String(typeof link.target === "object" ? link.target.id : link.target)

    // Check if both nodes are in the highlighted path
    const pathStr = highlightedPath.map(String)
    const sourceIndex = pathStr.indexOf(sourceId)
    const targetIndex = pathStr.indexOf(targetId)

    // Link is part of path if both nodes exist and are adjacent in the path
    if (sourceIndex !== -1 && targetIndex !== -1 && Math.abs(sourceIndex - targetIndex) === 1) {
      const isDark = document.documentElement.classList.contains("dark")
      return isDark ? "#c59b8d" : "#a67c6d" // secondary color
    }

    // Highlight edges connected to hovered node
    if (hoveredNode) {
      const hoveredStr = String(hoveredNode)
      if (sourceId === hoveredStr || targetId === hoveredStr) {
        const isDark = document.documentElement.classList.contains("dark")
        return isDark ? "#a88b7f" : "#b39080"
      }
    }

    const isDark = document.documentElement.classList.contains("dark")
    return isDark ? "#2a2520" : "#e6dfd6" // very light links
  }, [hoveredNode, highlightedPath])

  const getLinkWidth = useCallback((link: any) => {
    const sourceId = String(typeof link.source === "object" ? link.source.id : link.source)
    const targetId = String(typeof link.target === "object" ? link.target.id : link.target)

    const pathStr = highlightedPath.map(String)
    const sourceIndex = pathStr.indexOf(sourceId)
    const targetIndex = pathStr.indexOf(targetId)

    if (sourceIndex !== -1 && targetIndex !== -1 && Math.abs(sourceIndex - targetIndex) === 1) {
      return 4 // Thicker for highlighted path
    }
    return Math.sqrt(link.weight || 1) * 0.5
  }, [highlightedPath])

  const getLinkParticles = useCallback((link: any) => {
    const sourceId = String(typeof link.source === "object" ? link.source.id : link.source)
    const targetId = String(typeof link.target === "object" ? link.target.id : link.target)

    const pathStr = highlightedPath.map(String)
    const sourceIndex = pathStr.indexOf(sourceId)
    const targetIndex = pathStr.indexOf(targetId)

    if (sourceIndex !== -1 && targetIndex !== -1 && Math.abs(sourceIndex - targetIndex) === 1) {
      return 2 // Reduced particles for performance
    }
    return 0
  }, [highlightedPath])

  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const nodeRadius = Math.sqrt(Math.max((node.pagerank || 0.001) * 1000, 3)) * 6

    // Draw node circle
    ctx.beginPath()
    ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI, false)
    ctx.fillStyle = getNodeColor(node)
    ctx.fill()

    // Only show labels when zoomed in enough (globalScale > 2)
    if (globalScale > 2) {
      const fontSize = 14 / globalScale
      ctx.font = `${fontSize}px Inter, system-ui, sans-serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      const isDark = document.documentElement.classList.contains("dark")
      ctx.fillStyle = isDark ? "#ebe7e1" : "#2d2520"
      ctx.fillText(node.name, node.x, node.y + nodeRadius + fontSize)
    }
  }, [getNodeColor])

  const nodePointerAreaPaint = useCallback((node: any, color: string, ctx: CanvasRenderingContext2D) => {
    const nodeRadius = Math.sqrt(Math.max((node.pagerank || 0.001) * 1000, 3)) * 6
    ctx.beginPath()
    ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI, false)
    ctx.fillStyle = color
    ctx.fill()
  }, [])

  const nodeLabel = useCallback((node: any) => `${node.name}`, [])

  return (
    <div ref={containerRef} className="relative w-full h-full rounded-lg overflow-hidden border border-border bg-card">
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        nodeLabel={nodeLabel}
        nodeCanvasObject={paintNode}
        nodeCanvasObjectMode={useCallback(() => "replace", [])}
        nodePointerAreaPaint={nodePointerAreaPaint}
        linkColor={getLinkColor}
        linkWidth={getLinkWidth}
        linkDirectionalParticles={getLinkParticles}
        linkDirectionalParticleWidth={3}
        linkDirectionalParticleSpeed={0.006}
        onNodeClick={(node: any) => onNodeClick?.(node)}
        onNodeHover={(node: any) => {
          setHoveredNode(node?.id || null)
        }}
        onNodeDrag={(node: any) => {}}
        onNodeDragEnd={(node: any) => {}}
        cooldownTicks={300}
        d3AlphaDecay={0.005}
        d3VelocityDecay={0.2}
        d3AlphaMin={0.0005}
        warmupTicks={0}
        enableNodeDrag={true}
        enableZoomInteraction={true}
        enablePanInteraction={true}
      />
    </div>
  )
}
