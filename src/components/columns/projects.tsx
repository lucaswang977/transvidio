"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar"
import type { ProjectRelatedUser } from "~/server/api/routers/project"
import { AssignProjectToUserDialog } from "~/components/dialogs/assign-project-to-user-dialog"
import { AiParamsDialog } from "~/components/dialogs/ai-params-dialog"
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

import { extractLetters } from "~/utils/helper"
import Link from "next/link"
import { Badge } from "../ui/badge"
import type { ProjectAiParamters } from "~/types"

export type ProjectColumn = {
  id: string
  name: string
  srcLang: string
  dstLang: string
  memo: string
  users: ProjectRelatedUser[]
  aiParameter: ProjectAiParamters
  documentCount: Record<string, number>
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
        <div className="flex space-x-1">
          <Badge variant="outline">{data.srcLang}</Badge>
          <span>-</span>
          <Badge variant="outline">{data.dstLang}</Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "memo",
    header: "Memo"
  },
  {
    accessorKey: "aiParameter",
    header: "AI Param",
    cell: ({ row, table }) => {
      const myself = table.options.meta?.user
      const projectId = row.original.id
      const aiParameter = row.original.aiParameter

      return (
        <div className="flex space-x-1 items-center" >
          {aiParameter ?
            <span>Filled</span> :
            <span className="text-gray-300">Empty</span>}
          {(myself && myself.role === "ADMIN") ?
            <>
              <AiParamsDialog
                projectId={projectId}
                currentValue={aiParameter}
                refetch={table.options.meta?.refetchData}
              />
            </> : <></>}
        </div >
      )
    }
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
        <div className="flex space-x-1 items-center" >
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
    header: "Word Count",
    cell: ({ row }) => {
      const data = row.original
      return (
        <span>{data.documentCount.WORD_COUNT ? data.documentCount.WORD_COUNT : 0}</span>
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
          <span>{data.documentCount.OPEN ? data.documentCount.OPEN : 0}/
            {data.documentCount.ALL ? data.documentCount.ALL : 0}</span>
          <Link href={`/admin/documents?p=${data.id}`}>
            <ArrowRightCircle className="h-4 w-4" />
          </Link>
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ table }) => {
      const myself = table.options.meta?.user

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
            <DropdownMenuItem disabled={myself && myself.role === "EDITOR"}>
              <Edit className="mr-2 h-4 w-4" />
              <span>Edit</span>
            </DropdownMenuItem>
            <DropdownMenuItem disabled={myself && myself.role === "EDITOR"}>
              <Trash className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
