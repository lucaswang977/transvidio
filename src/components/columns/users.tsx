"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "~/components/ui/checkbox"
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar"
import { extractLetters } from "~/utils/helper"

export type UserColumn = {
  id: string
  name: string
  role: string
  email: string
  image: string
  created: string
  paymentMethod?: string
  paymentTarget?: string
  paymentMemo?: string
  lastLogin: string
}

export const columns: ColumnDef<UserColumn>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "image",
    header: "Avatar",
    cell: ({ row }) => {
      const url: string = row.getValue("image")
      return (<Avatar className="h-8 w-8">
        <AvatarImage src={url} alt="avatar" />
        <AvatarFallback>{extractLetters(row.getValue("name"))}</AvatarFallback>
      </Avatar>)

    }
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const name: string = row.getValue("name")
      const id: string = row.original.id
      return (<div className="space-y-1"><p>{name}</p><p className="text-gray-400 text-xs">{id}</p></div>)
    }
  },
  {
    accessorKey: "email",
    header: "Email"
  },
  {
    accessorKey: "role",
    header: "Role"
  },
  {
    id: "paymentMethod",
    accessorKey: "paymentMethod",
    header: "Payment method"
  },
  {
    id: "paymentTarget",
    accessorKey: "paymentTarget",
    header: "Payment target"
  },

  {
    id: "paymentMemo",
    accessorKey: "paymentMemo",
    header: "Payment memo"
  },
  {
    id: "lastLogin",
    accessorKey: "lastLogin",
    header: "Last active"
  },
  {
    id: "created",
    accessorKey: "created",
    header: "Created time"
  }
]
