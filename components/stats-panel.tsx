"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { NetworkData } from "@/types/network"

interface StatsPanelProps {
  data: NetworkData
}

export function StatsPanel({ data }: StatsPanelProps) {
  const totalNarrators = data.nodes.length
  const totalConnections = data.links.length
  const totalHadiths = data.hadiths.length

  const sahihCount = data.nodes.filter((n) => n.grade === "sahih").length
  const hasanCount = data.nodes.filter((n) => n.grade === "hasan").length
  const daifCount = data.nodes.filter((n) => n.grade === "daif").length

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Narrators</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{totalNarrators}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Connections</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{totalConnections}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Hadiths</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{totalHadiths}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Grades</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-sm">
            <span className="font-semibold text-primary">{sahihCount}</span> Sahih
          </p>
          <p className="text-sm">
            <span className="font-semibold text-secondary">{hasanCount}</span> Hasan
          </p>
          <p className="text-sm">
            <span className="font-semibold text-muted-foreground">{daifCount}</span> Daif
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
