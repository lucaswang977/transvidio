"use client"

import * as React from "react"
import { Button } from "~/components/ui/button"
import { useToast } from "~/components/ui/use-toast"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog"
import { api } from "~/utils/api";
import { ProjectStatus } from "@prisma/client"
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectValue,
} from "~/components/ui/select"

export const ProjectStateModifyDialog = (props: {
  projectId: string,
  triggerChild: JSX.Element,
  currentValue: ProjectStatus,
  refetch: () => void
}) => {
  const mutation = api.project.changeStatus.useMutation()
  const { toast } = useToast()
  const [open, setOpen] = React.useState(false)
  const [working, setWorking] = React.useState(false)
  const [value, setValue] = React.useState<ProjectStatus>("PREPARING")

  React.useEffect(() => {
    setValue(props.currentValue)
  }, [props.currentValue])

  function onSubmit() {
    setWorking(true)
    mutation.mutate({
      projectId: props.projectId,
      value: value
    }, {
      onError: (err) => {
        toast({ title: "Modification failed.", description: err.message })
        setOpen(false)
        setWorking(false)
      },
      onSuccess: () => {
        if (props.refetch) props.refetch()
        setOpen(false)
        setWorking(false)
      }
    })

  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {props.triggerChild}
      </DialogTrigger>
      <DialogContent className="w-1/3">
        <DialogHeader>
          <DialogTitle>Change the project status</DialogTitle>
        </DialogHeader>
        <p>Status</p>
        <Select
          onValueChange={(v) => {
            setValue(v as ProjectStatus)
          }}
          defaultValue={value}>
          <SelectTrigger>
            <SelectValue placeholder="Select a status" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Status</SelectLabel>
              {Object.values(ProjectStatus).map((status) =>
                <SelectItem key={status} value={status}>{status}</SelectItem>)}
            </SelectGroup>
          </SelectContent>
        </Select >

        <DialogFooter>
          <Button disabled={working} onClick={onSubmit}>{working ? "Saving" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

