"use client"

import { type ColumnDef } from "@tanstack/react-table"
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
    header: "Name"
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
    accessorKey: "lastLogin",
    header: "Last active"
  },
  {
    accessorKey: "created",
    header: "Created time"
  }
]
