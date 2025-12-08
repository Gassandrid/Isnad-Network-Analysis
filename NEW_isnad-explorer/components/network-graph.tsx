"use client"

import { useEffect, useRef, useState } from "react"
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
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const lastInteractionRef = useRef<number>(Date.now())
  const slowdownTimerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth - 400,
        height: window.innerHeight - 100,
      })
    }
    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  useEffect(() => {
    if (graphRef.current) {
      const fg = graphRef.current

      fg.d3Force("charge")?.strength(forceConfig.charge)
      fg.d3Force("link")?.distance(forceConfig.linkDistance)
      fg.d3Force("center")?.strength(forceConfig.centerStrength)
      fg.d3Force("collide")?.radius(forceConfig.collisionRadius)
    }
  }, [forceConfig])

  // Gradually slow down simulation when user is idle
  useEffect(() => {
    const checkAndSlowDown = () => {
      if (!graphRef.current) return

      const timeSinceInteraction = Date.now() - lastInteractionRef.current
      const fg = graphRef.current

      if (timeSinceInteraction > 3000) {
        // After 3 seconds of no interaction, slow down significantly
        fg.d3Force("charge")?.strength(forceConfig.charge * 0.1)
        fg.d3Force("link")?.strength(0.05)
        fg.d3AlphaDecay(0.1) // Slow decay
      } else {
        // Active interaction - normal forces
        fg.d3Force("charge")?.strength(forceConfig.charge)
        fg.d3Force("link")?.strength(1)
        fg.d3AlphaDecay(0.02)
      }
    }

    slowdownTimerRef.current = setInterval(checkAndSlowDown, 1000)
    return () => {
      if (slowdownTimerRef.current) clearInterval(slowdownTimerRef.current)
    }
  }, [forceConfig])

  const handleInteraction = () => {
    lastInteractionRef.current = Date.now()
    if (graphRef.current) {
      // Reheat the simulation on interaction
      graphRef.current.d3ReheatSimulation()
      const fg = graphRef.current
      fg.d3Force("charge")?.strength(forceConfig.charge)
      fg.d3Force("link")?.strength(1)
      fg.d3AlphaDecay(0.02)
    }
  }

  const getNodeColor = (node: Narrator) => {
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

    if (isDark) {
      return "#6b6158" // gray from dark mode palette
    }
    return "#9a8f82" // gray from light mode palette
  }

  const getLinkColor = (link: any) => {
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

    const isDark = document.documentElement.classList.contains("dark")
    return isDark ? "#2a2520" : "#e6dfd6" // very light links
  }

  const getLinkWidth = (link: any) => {
    const sourceId = String(typeof link.source === "object" ? link.source.id : link.source)
    const targetId = String(typeof link.target === "object" ? link.target.id : link.target)

    const pathStr = highlightedPath.map(String)
    const sourceIndex = pathStr.indexOf(sourceId)
    const targetIndex = pathStr.indexOf(targetId)

    if (sourceIndex !== -1 && targetIndex !== -1 && Math.abs(sourceIndex - targetIndex) === 1) {
      return 4 // Thicker for highlighted path
    }
    return Math.sqrt(link.weight || 1) * 0.5
  }

  const getLinkParticles = (link: any) => {
    const sourceId = String(typeof link.source === "object" ? link.source.id : link.source)
    const targetId = String(typeof link.target === "object" ? link.target.id : link.target)

    const pathStr = highlightedPath.map(String)
    const sourceIndex = pathStr.indexOf(sourceId)
    const targetIndex = pathStr.indexOf(targetId)

    if (sourceIndex !== -1 && targetIndex !== -1 && Math.abs(sourceIndex - targetIndex) === 1) {
      return 4 // Show flowing particles on path
    }
    return 0
  }

  const paintNode = (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.name
    const fontSize = 14 / globalScale // Increased from 12 to 14
    const nodeRadius = Math.sqrt(Math.max((node.pagerank || 0.001) * 1000, 3)) * 6 // Reduced from 8 to 6

    // Draw node circle
    ctx.beginPath()
    ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI, false)
    ctx.fillStyle = getNodeColor(node)
    ctx.fill()

    // Only show labels when zoomed in enough (globalScale > 1.5)
    if (globalScale > 1.5) {
      ctx.font = `${fontSize}px Inter, system-ui, sans-serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      const isDark = document.documentElement.classList.contains("dark")
      ctx.fillStyle = isDark ? "#ebe7e1" : "#2d2520"
      ctx.fillText(label, node.x, node.y + nodeRadius + fontSize)
    }
  }

  const nodePointerAreaPaint = (node: any, color: string, ctx: CanvasRenderingContext2D) => {
    const nodeRadius = Math.sqrt(Math.max((node.pagerank || 0.001) * 1000, 3)) * 6
    ctx.beginPath()
    ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI, false)
    ctx.fillStyle = color
    ctx.fill()
  }

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border border-border bg-card">
      <ForceGraph2D
        ref={graphRef}
        graphData={{ nodes, links }}
        width={dimensions.width}
        height={dimensions.height}
        nodeLabel={(node: any) => `${node.name}`}
        nodeCanvasObject={paintNode}
        nodeCanvasObjectMode={() => "replace"}
        nodePointerAreaPaint={nodePointerAreaPaint}
        linkColor={getLinkColor}
        linkWidth={getLinkWidth}
        linkDirectionalParticles={getLinkParticles}
        linkDirectionalParticleWidth={3}
        linkDirectionalParticleSpeed={0.006}
        onNodeClick={(node: any) => onNodeClick?.(node)}
        onNodeDrag={handleInteraction}
        onNodeDragEnd={handleInteraction}
        cooldownTicks={50}
        d3AlphaDecay={0.05}
        d3VelocityDecay={0.4}
        warmupTicks={0}
        enableNodeDrag={true}
        enableZoomInteraction={true}
        enablePanInteraction={true}
      />
    </div>
  )
}
