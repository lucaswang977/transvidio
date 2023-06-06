"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar"
import { type ProjectRelatedUser } from "~/server/api/routers/project"

export type ProjectColumn = {
  id: string
  name: string
  srcLang: string
  dstLang: string
  users: ProjectRelatedUser[]
  documents: number
}

export const columns: ColumnDef<ProjectColumn>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "srcLang",
    header: "Source Language"
  },
  {
    accessorKey: "dstLang",
    header: "Target Language"
  },
  {
    accessorKey: "users",
    header: "Users",
    cell: ({ row }) => {
      const users: { user: ProjectRelatedUser }[] = row.getValue("users")
      return users.map(({ user: userData }) => {
        return (<div key={userData.id}><Avatar className="h-8 w-8">
          <AvatarImage src={userData.image ? userData.image : ""} alt={userData.name ? userData.name : ""} />
          <AvatarFallback>TV</AvatarFallback>
        </Avatar></div>)
      })
    },
  },
  {
    accessorKey: "documents",
    header: "Document Count"
  }
]
