import * as React from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "~/components/ui/dialog"

import { Button } from "~/components/ui/button"

export type ConfirmDialogProps = {
  trigger: string,
  title: string,
  description: string,
  handleConfirm: () => void
}

const ConfirmDialog = (props: ConfirmDialogProps) => {
  const [open, setOpen] = React.useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="text-xs">{props.trigger}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          <DialogDescription>
            {props.description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => {
            props.handleConfirm()
            setOpen(false)
          }}>OK</Button>
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ConfirmDialog
