"use client"

import * as React from "react"
import type DialogPrimitive from "@radix-ui/react-dialog"
import type DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Dialog, DialogContent, DialogTrigger } from "./dialog"
import { DropdownMenuItem } from "./dropdown-menu"

const DropdownMenuDialogItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuItem>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root> &
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> &
  { triggerChildren: JSX.Element }
>(({ children, open, onSelect, onOpenChange, triggerChildren, ...props }, ref) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogTrigger asChild>
      <DropdownMenuItem
        ref={ref}
        {...props}
        onSelect={(event) => {
          event.preventDefault();
          onSelect && onSelect(event);
        }}
      >
        {triggerChildren}
      </DropdownMenuItem>
    </DialogTrigger>
    <DialogContent>
      {children}
    </DialogContent>
  </Dialog>
));

DropdownMenuDialogItem.displayName = "DropdownMenuDialogItem"

export { DropdownMenuDialogItem }
