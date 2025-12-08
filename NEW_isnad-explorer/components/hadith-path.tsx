"use client"

import type { Hadith } from "@/types/network"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface HadithPathProps {
  hadith: Hadith
  onClose: () => void
}

export function HadithPath({ hadith, onClose }: HadithPathProps) {
  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="absolute inset-0 pointer-events-auto" onClick={onClose} />
      <Card className="absolute left-0 top-0 bottom-0 w-[500px] h-full flex flex-col shadow-2xl pointer-events-auto rounded-none border-l-0">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-start justify-between">
            <CardTitle>Hadith Transmission Path</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <ScrollArea className="flex-1">
          <CardContent className="space-y-4 pb-6">
        <div className="space-y-2">
          <p className="text-base leading-relaxed">{hadith.text_en}</p>
          {hadith.text_ar && (
            <p className="text-base text-muted-foreground font-arabic text-right leading-relaxed">
              {hadith.text_ar}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline">{hadith.source}</Badge>
          {hadith.chapter && <Badge variant="secondary">{hadith.chapter}</Badge>}
          {hadith.hadith_no && <span className="text-sm text-muted-foreground">Hadith #{hadith.hadith_no}</span>}
        </div>

        <div className="pt-4 border-t border-border">
          <p className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            Chain of Transmission (Isnad) - {hadith.narrator_names?.length || 0} Narrators
          </p>
          <div className="space-y-3">
            {hadith.narrator_names?.map((narrator, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-sm font-semibold text-primary">{index + 1}</span>
                    </div>
                    <p className="text-sm font-medium leading-relaxed">{narrator}</p>
                  </div>
                </div>
                {index < hadith.narrator_names!.length - 1 && (
                  <ArrowDown className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-2" />
                )}
              </div>
            ))}
          </div>
        </div>

            <div className="pt-2 text-xs text-muted-foreground italic">
              The chain is highlighted in the graph view. Narrators in this path are shown with directional flow.
            </div>
          </CardContent>
        </ScrollArea>
      </Card>
    </div>
  )
}
