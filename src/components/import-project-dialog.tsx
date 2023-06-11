"use client"

// Trigger dialog as DropdownMenuItem
// https://codesandbox.io/embed/r9sq1q

import { Import } from "lucide-react";
import * as React from "react"
import { Dialog, DialogTrigger, DialogContent } from "~/components/ui/dialog"
import { DropdownMenuItem } from "~/components/ui/dropdown-menu";

export const ProjectImportDialog = React.forwardRef<
  React.ElementRef<typeof DropdownMenuItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuItem>
>(({ onSelect, ...props }, ref) => {

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
      </DialogContent>
    </Dialog>
  )
})
