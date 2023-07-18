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
  working: boolean,
  open: boolean,
  setOpen: (open: boolean) => void,
  handleConfirm: () => void
}

const ConfirmDialog = (props: ConfirmDialogProps) => {
  return (
    <Dialog open={props.open} onOpenChange={props.setOpen}>
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
          <Button
            disabled={props.working}
            onClick={() => { props.handleConfirm() }}>
            {props.working ? "Waiting" : "OK"}
          </Button>
          <Button variant="secondary" onClick={() => props.setOpen(false)}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// https://codesandbox.io/embed/r9sq1q
const ConfirmDialogInDropdown = (props: ConfirmDialogProps) => {
  return (
    <DropdownMenuDialogItem
      onOpenChange={props.setOpen}
      open={props.open}
      disabled={props.disabled}
      triggerChildren={props.trigger}>
      <DialogHeader>
        <DialogTitle>{props.title}</DialogTitle>
        <DialogDescription>
          {props.description}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button
          disabled={props.working}
          onClick={() => { props.handleConfirm() }}>
          {props.working ? "Waiting" : "OK"}
        </Button>
        <Button variant="secondary" onClick={() => props.setOpen(false)}>Cancel</Button>
      </DialogFooter>
    </DropdownMenuDialogItem>
  )
}

export { ConfirmDialog, ConfirmDialogInDropdown }
