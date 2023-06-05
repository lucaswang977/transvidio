"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar"

export type UserColumn = {
  id: string
  name: string
  role: "admin" | "editor"
  email: string
  image: string
}

export const columns: ColumnDef<UserColumn>[] = [
  {
    accessorKey: "image",
    header: "Avatar",
    cell: ({ row }) => {
      const url: string = row.getValue("image")
      return (<Avatar className="h-8 w-8">
        <AvatarImage src={url} alt="avatar" />
        <AvatarFallback>TV</AvatarFallback>
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
]
