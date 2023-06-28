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
import { DropdownMenuDialogItem } from "~/components/ui/dropdown-dialog-item"

export type ConfirmDialogProps = {
  trigger: JSX.Element,
  title: string,
  description: string,
  disabled?: boolean,
  handleConfirm: () => void
}

const ConfirmDialog = (props: ConfirmDialogProps) => {
  const [open, setOpen] = React.useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild className="w-20">
        {props.trigger}
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

const ConfirmDialogInDropdown = (props: ConfirmDialogProps) => {
  const [open, setOpen] = React.useState(false)
  return (
    <DropdownMenuDialogItem
      onOpenChange={setOpen}
      open={open}
      disabled={props.disabled}
      triggerChildren={props.trigger}>
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
    </DropdownMenuDialogItem>
  )
}



export { ConfirmDialog, ConfirmDialogInDropdown }
