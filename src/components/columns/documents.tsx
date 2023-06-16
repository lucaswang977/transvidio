"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar"
import { ExternalLink, MoreHorizontal } from "lucide-react"

import { Button } from "~/components/ui/button"
import { Checkbox } from "~/components/ui/checkbox"
import { Edit, Trash } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"

export type DocumentColumn = {
  id: string
  title: string
  type: string
  srcJson: string | undefined
  dstJson: string | undefined
  state: string
  memo: string | null
  project: { id: string, name: string }
  user: { id: string, name: string, image: string } | null
  updated: string
}

export const columns: ColumnDef<DocumentColumn>[] = [
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
    accessorKey: "project",
    header: "Project",
    cell: ({ row }) => {
      const project: { id: string, name: string, image: string } = row.getValue("project")
      return (
        <div className="flex">
          <span>{project.name}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    accessorKey: "type",
    header: "Type"
  },
  {
    accessorKey: "state",
    header: "State"
  },
  {
    accessorKey: "memo",
    header: "Memo"
  },
  {
    accessorKey: "user",
    header: "Assigned",
    cell: ({ row }) => {
      const user: { id: string, name: string, image: string } = row.getValue("user")
      if (user && user.id && user.name && user.image) {
        return (
          <div className="flex">
            <Avatar key={user.id} className="h-8 w-8">
              <AvatarImage src={user.image ? user.image : ""} alt={user.name ? user.name : ""} />
              <AvatarFallback>TV</AvatarFallback>
            </Avatar>
          </div>
        )

      } else {
        return <></>
      }
    },
  },
  {
    accessorKey: "updated",
    header: "Updated time",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const data = row.original
      let editorUrl = "/"
      if (data.type === "INTRODUCTION") {
        editorUrl = "/editor/introduction/" + data.id
      } else if (data.type === "CURRICULUM") {
        editorUrl = "/editor/curriculum/" + data.id
      } else if (data.type === "SUBTITLE") {
        editorUrl = "/editor/subtitle/" + data.id
      } else if (data.type === "ARTICLE") {
        editorUrl = "/editor/doc/" + data.id
      } else if (data.type === "QUIZ") {
        editorUrl = "/editor/quiz/" + data.id
      } else if (data.type === "ATTACHMENT") {
        editorUrl = "/editor/attachment/" + data.id
      }

      return (
        <div className="flex space-x-1 place-items-center">
          <a href={editorUrl} target="_blank">
            <Button variant="ghost">
              <ExternalLink className="mr-2 h-4 w-4" />
            </Button>
          </a>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(data.id)}
              >
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Trash className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  }
]
