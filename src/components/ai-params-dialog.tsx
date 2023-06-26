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
import { type ProjectAiParamters } from "~/types"

type AiParamsDialogProps = {
  projectId: string,
  currentValue: ProjectAiParamters,
  refetch?: () => void
}

export function AiParamsDialog(props: AiParamsDialogProps) {
  const [open, setIsOpen] = React.useState(false)
  const mutation = api.translate.saveAiParams.useMutation()
  const [params, setParams] = React.useState<ProjectAiParamters>(props.currentValue)

  function onSubmit() {
    mutation.mutate({
      projectId: props.projectId,
      value: JSON.stringify(params)
    }, {
      onError: (err) => {
        console.log(err.message)
      },
      onSuccess: () => {
        if (props.refetch) props.refetch()
      }
    })

    setIsOpen(false)
  }

  return (
    <div>
      <Dialog open={open} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost">
            <Edit className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Fill the parameters for AI translation</DialogTitle>
          </DialogHeader>
          <p>Character</p>
          <Textarea
            value={params.character}
            onChange={event => setParams({ ...params, character: event.target.value })}
          />
          <p>Background</p>
          <Textarea
            value={params.background}
            onChange={event => setParams({ ...params, background: event.target.value })}
          />
          <p>Syllabus</p>
          <Textarea
            value={params.syllabus}
            onChange={event => setParams({ ...params, syllabus: event.target.value })}
          />
          <DialogFooter>
            <Button onClick={onSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  )
}
