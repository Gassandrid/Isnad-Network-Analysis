"use client"

import { useState, useEffect } from "react"
import { NetworkGraph } from "@/components/network-graph"
import { NarratorPanel } from "@/components/narrator-panel"
import { HadithSearch } from "@/components/hadith-search"
import { HadithPath } from "@/components/hadith-path"
import { StatsPanel } from "@/components/stats-panel"
import { ThemeToggle } from "@/components/theme-toggle"
import { ForceControls } from "@/components/force-controls"
import { mockNetworkData } from "@/lib/mock-data"
import { loadNetworkData } from "@/lib/data-loader"
import type { Narrator, Hadith, NetworkData, ForceConfig } from "@/types/network"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Network, BookOpen, BarChart3, Loader2 } from "lucide-react"

export default function Page() {
  const [selectedNarrator, setSelectedNarrator] = useState<Narrator | null>(null)
  const [selectedHadith, setSelectedHadith] = useState<Hadith | null>(null)
  const [activeView, setActiveView] = useState<"network" | "search" | "stats">("network")
  const [networkData, setNetworkData] = useState<NetworkData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [forceConfig, setForceConfig] = useState<ForceConfig>({
    charge: -500,
    linkDistance: 150,
    centerStrength: 0.1,
    collisionRadius: 20,
  })

  useEffect(() => {
    loadNetworkData()
      .then((data) => {
        if (data) {
          setNetworkData(data)
        } else {
          setNetworkData(mockNetworkData)
        }
      })
      .catch(() => {
        setNetworkData(mockNetworkData)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  const handleNarratorClick = (narrator: Narrator) => {
    setSelectedNarrator(narrator)
    setSelectedHadith(null)
  }

  const handleHadithSelect = (hadith: Hadith) => {
    setSelectedHadith(hadith)
    setSelectedNarrator(null)
  }

  if (isLoading || !networkData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading hadith network data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="border-b border-border bg-card flex-shrink-0">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Isnad Network Explorer</h1>
              <p className="text-sm text-muted-foreground">
                Exploring the chains of transmission through graph analysis
              </p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="container mx-auto px-6 py-6 flex gap-6 overflow-hidden">
          <aside className="w-80 flex-shrink-0 flex flex-col gap-4 overflow-hidden">
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant={activeView === "network" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setActiveView("network")}
              >
                <Network className="h-4 w-4 mr-2" />
                Network
              </Button>
              <Button
                variant={activeView === "search" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setActiveView("search")}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button
                variant={activeView === "stats" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setActiveView("stats")}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Stats
              </Button>
            </div>

            <div className="flex-shrink-0">
              <ForceControls config={forceConfig} onChange={setForceConfig} />
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
              {activeView === "search" && (
                <ScrollArea className="h-full">
                  <HadithSearch hadiths={networkData.hadiths} onSelectHadith={handleHadithSelect} />
                </ScrollArea>
              )}

              {activeView === "stats" && (
                <ScrollArea className="h-full">
                  <StatsPanel data={networkData} />
                </ScrollArea>
              )}

              {activeView === "network" && selectedNarrator && (
                <NarratorPanel narrator={selectedNarrator} onClose={() => setSelectedNarrator(null)} />
              )}

              {activeView === "network" && !selectedNarrator && !selectedHadith && (
                <div className="p-6 border border-border rounded-lg bg-card text-center space-y-2">
                  <Network className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click on a narrator node to view details or search for a hadith to trace its path.
                  </p>
                </div>
              )}
            </div>
          </aside>

          <main className="flex-1 overflow-hidden">
            <NetworkGraph
              nodes={networkData.nodes}
              links={networkData.links}
              selectedNarrator={selectedNarrator?.id}
              onNodeClick={handleNarratorClick}
              highlightedPath={selectedHadith?.chain || []}
              forceConfig={forceConfig}
            />
          </main>
        </div>
      </div>

      {selectedHadith && <HadithPath hadith={selectedHadith} onClose={() => setSelectedHadith(null)} />}
    </div>
  )
}
