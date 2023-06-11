"use client"

// Trigger dialog as DropdownMenuItem
// https://codesandbox.io/embed/r9sq1q

import { Import } from "lucide-react";
import * as React from "react"
import { Button } from "~/components/ui/button"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import {
  Dialog,
  DialogHeader,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "~/components/ui/dialog"
import { DropdownMenuItem } from "~/components/ui/dropdown-menu";

export const ProjectImportDialog = React.forwardRef<
  React.ElementRef<typeof DropdownMenuItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuItem>
>(({ onSelect, ...props }, ref) => {
  const [loading, setLoading] = React.useState(false)
  const [intro, setIntro] = React.useState("")
  const [curriculum, setCurriculum] = React.useState("")
  const [supplement, setSupplement] = React.useState("")

  const handleImport = () => {
    setLoading(true)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <DropdownMenuItem
          {...props}
          ref={ref}
          onSelect={(event) => {
            event.preventDefault();
            onSelect && onSelect(event);
          }}
        >
          <Import className="mr-2 h-4 w-4" />
          Import
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        {loading ? <div>Loading</div> :
          <>
            <DialogHeader>
              <DialogTitle>Import project data</DialogTitle>
            </DialogHeader>
            <Label htmlFor="intro">Course intro JSON text</Label>
            <Textarea
              id="intro"
              value={intro}
              onChange={(event) => setIntro(event.target.value)} />
            <Label htmlFor="curriculum">Curriculum JSON text</Label>
            <Textarea
              id="curriculum"
              value={curriculum}
              onChange={(event) => setCurriculum(event.target.value)} />
            <Label htmlFor="supplement">Supplement JSON text</Label>
            <Textarea
              id="supplement"
              value={supplement}
              onChange={(event) => setSupplement(event.target.value)} />
            <Button onClick={handleImport}>Start</Button>
          </>
        }
      </DialogContent>
    </Dialog>
  )
})
