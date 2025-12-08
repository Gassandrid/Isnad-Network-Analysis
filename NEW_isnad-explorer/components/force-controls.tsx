"use client"

import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ForceConfig } from "@/types/network"

interface ForceControlsProps {
  config: ForceConfig
  onChange: (config: ForceConfig) => void
}

export function ForceControls({ config, onChange }: ForceControlsProps) {
  const updateConfig = (key: keyof ForceConfig, value: number) => {
    onChange({ ...config, [key]: value })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Graph Forces</CardTitle>
        <CardDescription className="text-xs">Adjust the physics simulation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Charge Strength</Label>
            <span className="text-xs text-muted-foreground">{config.charge}</span>
          </div>
          <Slider
            value={[config.charge]}
            onValueChange={([value]) => updateConfig("charge", value)}
            min={-800}
            max={-50}
            step={25}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Link Distance</Label>
            <span className="text-xs text-muted-foreground">{config.linkDistance}</span>
          </div>
          <Slider
            value={[config.linkDistance]}
            onValueChange={([value]) => updateConfig("linkDistance", value)}
            min={30}
            max={250}
            step={10}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Center Force</Label>
            <span className="text-xs text-muted-foreground">{config.centerStrength.toFixed(2)}</span>
          </div>
          <Slider
            value={[config.centerStrength * 100]}
            onValueChange={([value]) => updateConfig("centerStrength", value / 100)}
            min={0}
            max={100}
            step={5}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Collision Radius</Label>
            <span className="text-xs text-muted-foreground">{config.collisionRadius}</span>
          </div>
          <Slider
            value={[config.collisionRadius]}
            onValueChange={([value]) => updateConfig("collisionRadius", value)}
            min={5}
            max={50}
            step={1}
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>
  )
}
