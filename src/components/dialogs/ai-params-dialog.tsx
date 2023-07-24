"use client"

import * as React from "react"
import { Button } from "~/components/ui/button"
import { Textarea } from "~/components/ui/textarea"
import { Edit } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog"
import { api } from "~/utils/api";
import type { ProjectAiParamters } from "~/types"

type AiParamsDialogProps = {
  projectId: string,
  currentValue?: ProjectAiParamters,
  refetch?: () => void
}

export function AiParamsDialog(props: AiParamsDialogProps) {
  const [open, setIsOpen] = React.useState(false)
  const mutation = api.project.saveAiParams.useMutation()
  const [params, setParams] = React.useState<ProjectAiParamters | undefined>(props.currentValue)

  React.useEffect(() => {
    setParams(props.currentValue)
  }, [props.currentValue])

  function onSubmit() {
    mutation.mutate({
      projectId: props.projectId,
      value: JSON.stringify(params)
    }, {
      onError: (err) => {
        console.error(err.message)
      },
      onSuccess: () => {
        if (props.refetch) props.refetch()
      }
    })

    setIsOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-1/3">
        <DialogHeader>
          <DialogTitle>Fill the parameters for AI translation</DialogTitle>
          <p className="text-xs text-gray-400">{props.projectId}</p>
        </DialogHeader>
        <p>Character</p>
        <Textarea
          value={params ? params.character : ""}
          onChange={event => {
            if (params) {
              setParams({ ...params, character: event.target.value })
            } else {
              setParams({ character: event.target.value, syllabus: "", background: "" })
            }
          }}
        />
        <p>Background</p>
        <Textarea
          value={params ? params.background : ""}
          onChange={event => {
            if (params) {
              setParams({ ...params, background: event.target.value })
            } else {
              setParams({ background: event.target.value, syllabus: "", character: "" })
            }
          }}
        />
        <p>Syllabus</p>
        <Textarea
          value={params ? params.syllabus : ""}
          onChange={event => {
            if (params) {
              setParams({ ...params, syllabus: event.target.value })
            } else {
              setParams({ syllabus: event.target.value, background: "", character: "" })
            }
          }}
        />
        <DialogFooter>
          <Button onClick={onSubmit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
