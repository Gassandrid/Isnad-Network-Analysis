/**
 * Process Hadith CSV Data for Web Deployment
 *
 * This script mirrors the Python export script but runs in Node.js
 * Run with: npx tsx scripts/process-csv-data.ts
 *
 * Required CSV files:
 * - all_hadiths_clean.csv
 * - all_rawis.csv
 */

import * as fs from "fs"
import * as path from "path"
import csv from "csv-parser"
import { createReadStream } from "fs"

interface Narrator {
  id: number
  scholar_indx: number
  name: string
  grade: string
  birth_date_place: string
  death_date_place: string
  birth_place: string
  birth_date: string
  death_date: string
  area_of_interest: string
}

interface Hadith {
  id: number
  hadith_id: number
  source: string
  chapter_no: string
  hadith_no: string
  chapter: string
  chain_indx: string
  text_ar: string
  text_en: string
}

interface GraphNode {
  id: number
  name: string
  grade: string
  pagerank: number
  in_degree: number
  out_degree: number
  betweenness: number
  group: number
}

interface GraphEdge {
  source: number
  target: number
  weight: number
}

class NetworkGraph {
  nodes: Map<number, GraphNode> = new Map()
  edges: Map<string, GraphEdge> = new Map()
  adjacency: Map<number, Set<number>> = new Map()
  reverseAdjacency: Map<number, Set<number>> = new Map()

  addNode(id: number, data: Partial<GraphNode>) {
    if (!this.nodes.has(id)) {
      this.nodes.set(id, {
        id,
        name: data.name || `Unknown (${id})`,
        grade: data.grade || "Unknown",
        pagerank: 0,
        in_degree: 0,
        out_degree: 0,
        betweenness: 0,
        group: data.group || 3,
      })
    }
  }

  addEdge(from: number, to: number) {
    const key = `${from}-${to}`
    if (this.edges.has(key)) {
      this.edges.get(key)!.weight++
    } else {
      this.edges.set(key, { source: from, target: to, weight: 1 })
    }

    // Update adjacency
    if (!this.adjacency.has(from)) this.adjacency.set(from, new Set())
    if (!this.reverseAdjacency.has(to)) this.reverseAdjacency.set(to, new Set())

    this.adjacency.get(from)!.add(to)
    this.reverseAdjacency.get(to)!.add(from)
  }

  calculateDegrees() {
    this.nodes.forEach((node) => {
      node.in_degree = this.reverseAdjacency.get(node.id)?.size || 0
      node.out_degree = this.adjacency.get(node.id)?.size || 0
    })
  }

  calculatePageRank(iterations = 100, damping = 0.85) {
    const numNodes = this.nodes.size
    const initialRank = 1.0 / numNodes

    // Initialize PageRank
    const ranks = new Map<number, number>()
    this.nodes.forEach((_, id) => ranks.set(id, initialRank))

    // Iterate
    for (let i = 0; i < iterations; i++) {
      const newRanks = new Map<number, number>()

      this.nodes.forEach((_, nodeId) => {
        let rank = (1 - damping) / numNodes

        // Add contributions from incoming neighbors
        const incomingNeighbors = this.reverseAdjacency.get(nodeId) || new Set()
        incomingNeighbors.forEach((neighbor) => {
          const neighborOutDegree = this.adjacency.get(neighbor)?.size || 1
          rank += damping * (ranks.get(neighbor)! / neighborOutDegree)
        })

        newRanks.set(nodeId, rank)
      })

      // Update ranks
      newRanks.forEach((rank, id) => ranks.set(id, rank))
    }

    // Store in nodes
    ranks.forEach((rank, id) => {
      const node = this.nodes.get(id)
      if (node) node.pagerank = rank
    })
  }

  // Simplified betweenness calculation (approximate)
  calculateBetweenness(sampleSize = 1000) {
    const betweenness = new Map<number, number>()
    this.nodes.forEach((_, id) => betweenness.set(id, 0))

    // Sample nodes for BFS
    const nodeIds = Array.from(this.nodes.keys())
    const sampled = nodeIds.slice(0, Math.min(sampleSize, nodeIds.length))

    sampled.forEach((source) => {
      const distances = new Map<number, number>()
      const paths = new Map<number, number>()
      const predecessors = new Map<number, Set<number>>()

      distances.set(source, 0)
      paths.set(source, 1)

      const queue = [source]
      const visited = new Set<number>([source])

      while (queue.length > 0) {
        const current = queue.shift()!
        const currentDist = distances.get(current)!

        const neighbors = this.adjacency.get(current) || new Set()
        neighbors.forEach((neighbor) => {
          if (!visited.has(neighbor)) {
            visited.add(neighbor)
            queue.push(neighbor)
            distances.set(neighbor, currentDist + 1)
          }

          if (distances.get(neighbor) === currentDist + 1) {
            paths.set(neighbor, (paths.get(neighbor) || 0) + paths.get(current)!)
            if (!predecessors.has(neighbor)) predecessors.set(neighbor, new Set())
            predecessors.get(neighbor)!.add(current)
          }
        })
      }

      // Accumulate betweenness
      const delta = new Map<number, number>()
      visited.forEach((v) => delta.set(v, 0))

      const sorted = Array.from(visited).sort((a, b) => (distances.get(b) || 0) - (distances.get(a) || 0))

      sorted.forEach((w) => {
        const preds = predecessors.get(w) || new Set()
        preds.forEach((v) => {
          const c = (paths.get(v)! / paths.get(w)!) * (1 + delta.get(w)!)
          delta.set(v, delta.get(v)! + c)
        })

        if (w !== source) {
          betweenness.set(w, betweenness.get(w)! + delta.get(w)!)
        }
      })
    })

    // Normalize
    const factor = sampled.length < nodeIds.length ? nodeIds.length / sampled.length : 1
    betweenness.forEach((value, id) => {
      const node = this.nodes.get(id)
      if (node) node.betweenness = value * factor
    })
  }
}

async function loadCSV<T>(filePath: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = []
    createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error))
  })
}

function parseChain(chainStr: string): number[] {
  if (!chainStr || chainStr === "") return []
  try {
    return chainStr
      .split(",")
      .map((x) => Number.parseInt(x.trim()))
      .filter((x) => !isNaN(x))
  } catch {
    return []
  }
}

async function main() {
  console.log("=".repeat(60))
  console.log("PROCESSING ISNAD NETWORK DATA FOR WEB DEPLOYMENT")
  console.log("=".repeat(60))

  // Create output directory
  const outputDir = path.join(process.cwd(), "public", "data")
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // Load datasets
  console.log("\n1. Loading datasets...")
  const hadiths: Hadith[] = await loadCSV("all_hadiths_clean.csv")
  const narrators: Narrator[] = await loadCSV("all_rawis.csv")
  console.log(`   Loaded ${hadiths.length} hadiths and ${narrators.length} narrators`)

  // Build narrator lookup
  console.log("\n2. Building narrator lookup...")
  const narratorLookup = new Map<number, Narrator>()
  narrators.forEach((n) => {
    const scholarId = Number(n.scholar_indx)
    if (!isNaN(scholarId)) {
      narratorLookup.set(scholarId, n)
    }
  })

  // Build graph
  console.log("\n3. Building network graph...")
  const graph = new NetworkGraph()

  const maxHadiths = 15000
  const processedHadiths = hadiths.slice(0, Math.min(maxHadiths, hadiths.length))

  processedHadiths.forEach((hadith, idx) => {
    if (idx % 1000 === 0) {
      console.log(`   Processing hadith ${idx}/${processedHadiths.length}...`)
    }

    const chain = parseChain(hadith.chain_indx)
    if (chain.length < 2) return

    // Add nodes
    chain.forEach((narratorId) => {
      const info = narratorLookup.get(narratorId)
      let group = 3
      if (info?.grade) {
        const grade = info.grade.toLowerCase()
        if (grade.includes("thiqah") || grade.includes("comp")) group = 2
        else if (grade.includes("hasan")) group = 1
        else if (grade.includes("rasool") || grade.includes("prophet")) group = 0
      }

      graph.addNode(narratorId, {
        name: info?.name || `Unknown (${narratorId})`,
        grade: info?.grade || "Unknown",
        group,
      })
    })

    // Add edges
    for (let i = 0; i < chain.length - 1; i++) {
      graph.addEdge(chain[i], chain[i + 1])
    }
  })

  console.log(`\n   Graph built: ${graph.nodes.size} nodes, ${graph.edges.size} edges`)

  // Calculate metrics
  console.log("\n4. Calculating network metrics...")
  graph.calculateDegrees()
  console.log("   Computing PageRank...")
  graph.calculatePageRank()
  console.log("   Computing betweenness centrality...")
  graph.calculateBetweenness()

  // Export graph data (top 500 nodes)
  console.log("\n5. Exporting graph data...")
  const sortedByPageRank = Array.from(graph.nodes.values()).sort((a, b) => b.pagerank - a.pagerank)
  const topNodes = sortedByPageRank.slice(0, 500)
  const topNodeIds = new Set(topNodes.map((n) => n.id))

  const graphNodes = topNodes.map((node) => ({
    id: node.id,
    name: node.name,
    grade: node.grade,
    pagerank: node.pagerank,
    in_degree: node.in_degree,
    group: node.group,
  }))

  const graphEdges = Array.from(graph.edges.values())
    .filter((edge) => topNodeIds.has(edge.source) && topNodeIds.has(edge.target))
    .map((edge) => ({
      source: edge.source,
      target: edge.target,
      weight: edge.weight,
    }))

  fs.writeFileSync(
    path.join(outputDir, "graph.json"),
    JSON.stringify({ nodes: graphNodes, edges: graphEdges }, null, 2),
  )
  console.log(`   Exported graph: ${graphNodes.length} nodes, ${graphEdges.length} edges`)

  // Export narrator details
  console.log("\n6. Exporting narrator details...")
  const narratorsExport: any = {}
  graph.nodes.forEach((node) => {
    const info = narratorLookup.get(node.id)
    narratorsExport[node.id] = {
      id: node.id,
      name: node.name,
      name_arabic: info?.name || node.name,
      grade: node.grade,
      birth: info?.birth_date || info?.birth_date_place || "Unknown",
      death: info?.death_date || info?.death_date_place || "Unknown",
      birth_place: info?.birth_place || "Unknown",
      areas: info?.area_of_interest || "Unknown",
      pagerank: node.pagerank,
      in_degree: node.in_degree,
      out_degree: node.out_degree,
      betweenness: node.betweenness,
    }
  })

  fs.writeFileSync(path.join(outputDir, "narrators.json"), JSON.stringify(narratorsExport, null, 2))
  console.log(`   Exported ${Object.keys(narratorsExport).length} narrator details`)

  // Export hadiths
  console.log("\n7. Exporting hadith search index...")
  const hadithsExport = processedHadiths.map((hadith) => {
    const chain = parseChain(hadith.chain_indx)
    const narratorNames = chain.map((id) => {
      const info = narratorLookup.get(id)
      return info?.name || `Unknown (${id})`
    })

    return {
      id: hadith.id,
      hadith_id: hadith.hadith_id,
      source: hadith.source,
      chapter: hadith.chapter,
      chapter_no: hadith.chapter_no,
      hadith_no: hadith.hadith_no,
      text_ar: hadith.text_ar,
      text_en: hadith.text_en,
      chain: chain,
      narrator_names: narratorNames,
    }
  })

  fs.writeFileSync(path.join(outputDir, "hadiths.json"), JSON.stringify(hadithsExport, null, 2))
  console.log(`   Exported ${hadithsExport.length} hadiths`)

  // Export statistics
  console.log("\n8. Exporting statistics...")
  const topPageRank = sortedByPageRank.slice(0, 20).map((n) => ({
    id: n.id,
    name: n.name,
    grade: n.grade,
    pagerank: n.pagerank,
  }))

  const topBetweenness = Array.from(graph.nodes.values())
    .sort((a, b) => b.betweenness - a.betweenness)
    .slice(0, 20)
    .map((n) => ({
      id: n.id,
      name: n.name,
      grade: n.grade,
      betweenness: n.betweenness,
    }))

  const topCitations = Array.from(graph.nodes.values())
    .sort((a, b) => b.in_degree - a.in_degree)
    .slice(0, 20)
    .map((n) => ({
      id: n.id,
      name: n.name,
      grade: n.grade,
      citations: n.in_degree,
    }))

  const stats = {
    graph: {
      nodes: graph.nodes.size,
      edges: graph.edges.size,
      density: graph.edges.size / (graph.nodes.size * (graph.nodes.size - 1)),
    },
    top_pagerank: topPageRank,
    top_betweenness: topBetweenness,
    top_citations: topCitations,
  }

  fs.writeFileSync(path.join(outputDir, "stats.json"), JSON.stringify(stats, null, 2))
  console.log("   Exported statistics")

  console.log("\n" + "=".repeat(60))
  console.log("DATA EXPORT COMPLETE!")
  console.log("=".repeat(60))
  console.log(`\nGenerated files in ${outputDir}:`)
  console.log("  - graph.json (network visualization data)")
  console.log("  - narrators.json (detailed narrator information)")
  console.log("  - hadiths.json (hadith search index)")
  console.log("  - stats.json (network statistics)")
}

main().catch(console.error)
