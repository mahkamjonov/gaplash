"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveSheet } from "@/components/ui/responsive-sheet";

export function SheetDemo() {
  return (
    <ResponsiveSheet
      title="Tayyormisan?"
      description="Bottom sheet below 768px, centered dialog above it."
      trigger={
        <Button variant="secondary" size="md">
          Open sheet
        </Button>
      }
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="sheet-name">Isming</Label>
        <Input id="sheet-name" placeholder="Masalan, Malika" />
      </div>
      <Button className="w-full">Davom etish</Button>
    </ResponsiveSheet>
  );
}
