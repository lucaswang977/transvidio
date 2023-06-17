"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar"
import { type ProjectRelatedUser } from "~/server/api/routers/project"
import { AssignProjectToUserDialog } from "~/components/assign-project-to-user-dialog"
import { MoreHorizontal } from "lucide-react"

import { Button } from "~/components/ui/button"
import { Label } from "~/components/ui/label"
import { Checkbox } from "~/components/ui/checkbox"
import { Edit, Trash, ArrowRightCircle } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"

import { ProjectImportDialog } from "~/components/import-project-dialog"
import { extractLetters } from "~/utils/helper"

export type ProjectColumn = {
  id: string
  name: string
  srcLang: string
  dstLang: string
  memo: string
  users: ProjectRelatedUser[]
  documents: number
}

export const columns: ColumnDef<ProjectColumn>[] = [
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
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const projectId = row.original.id
      return (
        <div className="flex flex-col space-y-2">
          <Label>{row.getValue("name")}</Label>
          <Label className="text-xs text-gray-400">{projectId}</Label>
        </div >
      )
    },
  },
  {
    header: "Language",
    cell: ({ row }) => {
      const data = row.original
      return (
        <Label>{`${data.srcLang} -> ${data.dstLang}`}</Label>
      )
    },
  },
  {
    accessorKey: "memo",
    header: "Memo"
  },
  {
    accessorKey: "users",
    header: "Users",
    cell: ({ row, table }) => {
      const users: ProjectRelatedUser[] = row.getValue("users")
      const myself = table.options.meta?.user
      const projectId = row.original.id

      const avatarUI = users.map((user) => {
        return (<Avatar key={user.id} className="h-8 w-8">
          <AvatarImage src={user.image ? user.image : ""} alt={user.name ? user.name : ""} />
          <AvatarFallback>{extractLetters(user.name ? user.name : "TV")}</AvatarFallback>
        </Avatar>)
      })
      return (
        <div className="flex space-x-1" >
          {(myself && myself.role === "ADMIN") ?
            <>
              <AssignProjectToUserDialog
                projectId={projectId}
                selectedUserIds={users.map((user) => user.id)}
                refetch={table.options.meta?.refetchData}
              />
            </> : <></>}
          {avatarUI}
        </div >
      )
    },
  },
  {
    accessorKey: "documents",
    header: "Documents",
    cell: ({ row }) => {
      const data = row.original
      return (
        <div className="flex px-2 place-items-center space-x-2">
          <span>{data.documents}</span>
          <Button variant="ghost">
            <ArrowRightCircle className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const data = row.original

      return (
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
            <ProjectImportDialog projectId={data.id} />
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              <span>Edit</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Trash className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  }
]
