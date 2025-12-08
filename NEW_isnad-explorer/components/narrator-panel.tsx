"use client"

import type { Narrator } from "@/types/network"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, BookOpen, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NarratorPanelProps {
  narrator: Narrator
  onClose: () => void
}

export function NarratorPanel({ narrator, onClose }: NarratorPanelProps) {
  const getGradeColor = (grade?: string) => {
    if (!grade) return "bg-muted text-muted-foreground"
    const lower = grade.toLowerCase()

    if (lower.includes("thiqah") || lower.includes("comp")) {
      return "bg-primary text-primary-foreground"
    }
    if (lower.includes("hasan")) {
      return "bg-secondary text-secondary-foreground"
    }
    return "bg-muted text-muted-foreground"
  }

  return (
    <Card className="w-full h-full flex flex-col overflow-hidden">
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="text-lg leading-relaxed">{narrator.name}</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <div className="flex-1 overflow-y-auto px-6">
        <div className="space-y-4 pb-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Grade / Reliability</p>
          <Badge className={getGradeColor(narrator.grade)}>{narrator.grade || "Unknown"}</Badge>
        </div>

        {(narrator.in_degree !== undefined || narrator.out_degree !== undefined) && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Citations</p>
              </div>
              <p className="text-2xl font-semibold">{narrator.in_degree || 0}</p>
              <p className="text-xs text-muted-foreground">Times cited</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Sources</p>
              </div>
              <p className="text-2xl font-semibold">{narrator.out_degree || 0}</p>
              <p className="text-xs text-muted-foreground">Teachers cited</p>
            </div>
          </div>
        )}

        {narrator.pagerank && (
          <div className="pt-2 border-t">
            <p className="text-sm font-medium text-muted-foreground">Network Influence (PageRank)</p>
            <p className="text-lg font-semibold">{(narrator.pagerank * 1000).toFixed(4)}</p>
            <p className="text-xs text-muted-foreground">
              Measures importance based on citation patterns
            </p>
          </div>
        )}

        {narrator.betweenness !== undefined && narrator.betweenness > 0 && (
          <div className="pt-2 border-t">
            <p className="text-sm font-medium text-muted-foreground">Bridge Score (Betweenness)</p>
            <p className="text-lg font-semibold">{narrator.betweenness.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">
              Measures role in connecting different narrator groups
            </p>
          </div>
        )}

        {(narrator.birth_date_place || narrator.death_date_place) && (
          <div className="space-y-3 pt-2 border-t">
            {narrator.birth_date_place && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Birth</p>
                <p className="text-sm leading-relaxed">{narrator.birth_date_place}</p>
              </div>
            )}
            {narrator.death_date_place && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Death</p>
                <p className="text-sm leading-relaxed">{narrator.death_date_place}</p>
              </div>
            )}
          </div>
        )}

        {narrator.area_of_interest && narrator.area_of_interest !== "Unknown" && (
          <div className="pt-2 border-t">
            <p className="text-sm font-medium text-muted-foreground">Areas of Expertise</p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {narrator.area_of_interest.split(",").map((area, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {area.trim()}
                </Badge>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>
    </Card>
  )
}
