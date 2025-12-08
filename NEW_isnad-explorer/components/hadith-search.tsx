"use client"

import { useState, useEffect } from "react"
import type { Hadith } from "@/types/network"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface HadithSearchProps {
  hadiths: Hadith[]
  onSelectHadith: (hadith: Hadith) => void
}

export function HadithSearch({ hadiths, onSelectHadith }: HadithSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredHadiths, setFilteredHadiths] = useState<Hadith[]>([])

  useEffect(() => {
    if (!searchQuery) {
      // Show first 10 hadiths as samples
      setFilteredHadiths(hadiths.slice(0, 10))
    }
  }, [hadiths, searchQuery])

  const handleSearch = () => {
    const query = searchQuery.toLowerCase()
    const results = hadiths.filter(
      (h) =>
        h.text_en?.toLowerCase().includes(query) ||
        h.text_ar?.includes(searchQuery) ||
        h.source.toLowerCase().includes(query),
    )
    setFilteredHadiths(results.slice(0, 50)) // Limit results for performance
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Search Hadith</CardTitle>
        {!searchQuery && filteredHadiths.length > 0 && (
          <p className="text-sm text-muted-foreground mt-1">Browse sample hadiths or search by text</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search by text or collection..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {filteredHadiths.map((hadith) => (
            <div
              key={hadith.id}
              className="p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => onSelectHadith(hadith)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-medium line-clamp-2">{hadith.text_en || "No English translation"}</p>
                  {hadith.text_ar && (
                    <p className="text-sm text-muted-foreground font-arabic text-right line-clamp-2">
                      {hadith.text_ar}
                    </p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {hadith.source}
                    </Badge>
                    {hadith.hadith_no && <span className="text-xs text-muted-foreground">#{hadith.hadith_no}</span>}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
              </div>
            </div>
          ))}
        </div>

        {searchQuery && filteredHadiths.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hadiths found. Try a different search term.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
