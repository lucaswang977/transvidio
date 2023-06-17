"use client"

// Trigger dialog as DropdownMenuItem
// https://codesandbox.io/embed/r9sq1q

import { Import } from "lucide-react";
import * as React from "react"
import { Button } from "~/components/ui/button"
import { Label } from "~/components/ui/label"
import {
  Dialog,
  DialogHeader,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog"
import { DropdownMenuItem } from "~/components/ui/dropdown-menu";
import { api } from "~/utils/api";

export const ProjectImportDialog = React.forwardRef<
  React.ElementRef<typeof DropdownMenuItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuItem> &
  {
    projectId: string,
    refetch?: () => void
  }
>(({ onSelect, projectId, refetch, ...props }, ref) => {
  const mutation = api.project.import.useMutation()
  const [open, setOpen] = React.useState(false)

  const handleImport = (id: string) => {
    mutation.mutate({
      id: id,
    }, {
      onError: (err) => {
        console.log(err.message)
      },
      onSuccess: (data) => {
        console.log(data)
        if (refetch) refetch()
      }
    })
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
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
        <>
          <DialogHeader>
            <DialogTitle>Import project data</DialogTitle>
          </DialogHeader>
          <Label>Make sure you have all the data uploaded to the storage.</Label>
          <DialogFooter>
            <Button
              onClick={() => {
                if (mutation.status === "success") {
                  setOpen(false)
                } else {
                  handleImport(projectId)
                }
              }}
              disabled={mutation.status == "loading"}>
              {mutation.status === "loading" ? "Waiting..." : mutation.status === "success" ? "Close" : "Yes, just do it!"}
            </Button>
          </DialogFooter>
        </>
      </DialogContent>
    </Dialog>
  )
})

ProjectImportDialog.displayName = "ProjectImportDialog"
