import type { NetworkData, Hadith } from "@/types/network"

// Get the base path for GitHub Pages deployment
function getBasePath(): string {
  if (typeof window !== 'undefined') {
    // In browser, check if we're on GitHub Pages
    const path = window.location.pathname
    if (path.startsWith('/Isnad-Network-Analysis')) {
      return '/Isnad-Network-Analysis'
    }
  }
  return ''
}

/**
 * Load pre-computed network data from JSON files (graph + narrators only)
 * Hadiths are loaded separately on demand for better performance
 */
export async function loadNetworkData(): Promise<NetworkData | null> {
  try {
    const basePath = getBasePath()
    console.log("[v0] Starting to load network data...", { basePath })

    // Load graph and narrator data (small files ~1.7MB total)
    const [graphResponse, narratorsResponse] = await Promise.all([
      fetch(`${basePath}/data/graph.json`),
      fetch(`${basePath}/data/narrators.json`),
    ])

    console.log("[v0] Fetch responses:", {
      graph: graphResponse.ok,
      narrators: narratorsResponse.ok,
    })

    if (!graphResponse.ok || !narratorsResponse.ok) {
      console.error("[v0] Failed to load graph or narrator data")
      return null
    }

    const [graphData, narratorsData] = await Promise.all([
      graphResponse.json(),
      narratorsResponse.json(),
    ])

    console.log("[v0] Loaded data:", {
      nodes: graphData.nodes?.length,
      edges: graphData.edges?.length,
    })

    // Transform the data to match our interface
    const nodes = graphData.nodes.map((node: any) => {
      const narratorDetails = narratorsData[node.id] || {}
      return {
        id: String(node.id),
        name: node.name || narratorDetails.name,
        grade: node.grade || narratorDetails.grade,
        degree: node.in_degree || narratorDetails.in_degree || 0,
        pagerank: node.pagerank || narratorDetails.pagerank || 0,
        betweenness: narratorDetails.betweenness || 0,
        in_degree: narratorDetails.in_degree || node.in_degree || 0,
        out_degree: narratorDetails.out_degree || 0,
        birth_date_place: narratorDetails.birth,
        death_date_place: narratorDetails.death,
        area_of_interest: narratorDetails.areas,
      }
    })

    const links = graphData.edges.map((edge: any) => ({
      source: String(edge.source),
      target: String(edge.target),
      weight: edge.weight || 1,
    }))

    console.log("[v0] Graph data transformation complete")

    // Return with empty hadiths - will be loaded on demand
    return { nodes, links, hadiths: [] }
  } catch (error) {
    console.error("[v0] Error loading network data:", error)
    return null
  }
}

/**
 * Load hadiths data separately (large file ~28MB)
 * Called only when user accesses the search feature
 */
export async function loadHadithsData(): Promise<Hadith[]> {
  try {
    const basePath = getBasePath()
    console.log("[v0] Loading hadiths data...")

    const response = await fetch(`${basePath}/data/hadiths.json`)
    if (!response.ok) {
      console.error("[v0] Failed to load hadiths data")
      return []
    }

    const hadithsData = await response.json()
    console.log("[v0] Loaded hadiths:", hadithsData?.length)

    const hadiths = hadithsData.map((hadith: any) => ({
      id: String(hadith.id),
      hadith_id: String(hadith.hadith_id),
      source: hadith.source,
      chapter: hadith.chapter,
      hadith_no: hadith.hadith_no,
      text_en: hadith.text_en || "",
      text_ar: hadith.text_ar || "",
      chain: hadith.chain.map(String),
      narrator_names: hadith.narrator_names,
    }))

    return hadiths
  } catch (error) {
    console.error("[v0] Error loading hadiths:", error)
    return []
  }
}

/**
 * Load statistics data
 */
export async function loadStatistics() {
  try {
    const basePath = getBasePath()
    const response = await fetch(`${basePath}/data/stats.json`)
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error("Error loading statistics:", error)
    return null
  }
}

/**
 * Map grade strings to standard format
 */
function mapGrade(grade: string): "sahih" | "hasan" | "daif" | "unknown" {
  if (!grade) return "unknown"
  const lower = grade.toLowerCase()

  if (lower.includes("thiqah") || lower.includes("trustworthy") || lower.includes("comp")) {
    return "sahih"
  }
  if (lower.includes("hasan")) {
    return "hasan"
  }
  if (lower.includes("daif") || lower.includes("weak")) {
    return "daif"
  }
  return "unknown"
}
