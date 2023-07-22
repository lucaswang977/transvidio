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
import { Input } from "~/components/ui/input"

export const WordCountModifyDialog = (props: {
  documentId: string,
  triggerChild: JSX.Element,
  currentValue: number,
  refetch: () => void
}) => {
  const mutation = api.document.modifyWordCount.useMutation()
  const { toast } = useToast()
  const [open, setOpen] = React.useState(false)
  const [working, setWorking] = React.useState(false)
  const [value, setValue] = React.useState(0)

  React.useEffect(() => {
    setValue(props.currentValue)
  }, [props.currentValue])

  function onSubmit() {
    setWorking(true)
    mutation.mutate({
      documentId: props.documentId,
      wordCount: value
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
          <DialogTitle>Change the word count</DialogTitle>
        </DialogHeader>
        <p>Word count</p>
        <Input
          type="number"
          value={value}
          onChange={event => {
            setValue(parseInt(event.target.value))
          }}
        />
        <DialogFooter>
          <Button disabled={working} onClick={onSubmit}>{working ? "Saving" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

