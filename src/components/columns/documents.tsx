"use client"

import * as React from "react"
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
import { extractLetters, truncateString } from "~/utils/helper"
import type { DocumentState, DocumentType } from "@prisma/client"
import { Badge } from "~/components/ui/badge"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime";
import { api } from "~/utils/api"
import { useToast } from "~/components/ui/use-toast"
import ConfirmDialog from "~/components/confirm-dialog"

const CloseDialog = (props: { documentId: string, refetch?: () => void }) => {
  const mutation = api.document.closeByAdmin.useMutation()
  const { toast } = useToast()

  return (
    <ConfirmDialog
      trigger="Close"
      title="Are you sure to close the document?"
      description="Once the document is closed, other people cannot modify it anymore."
      handleConfirm={() => {
        mutation.mutate({ documentId: props.documentId }, {
          onSuccess: () => {
            if (props.refetch) props.refetch()
          },
          onError: (err) => {
            toast({ title: "Close failed.", description: err.message })
          }
        })
      }}
    />
  )
}
const SubmitDialog = (props: { documentId: string, refetch?: () => void }) => {
  const mutation = api.document.submitByUser.useMutation()
  const { toast } = useToast()

  return (
    <ConfirmDialog
      trigger="Submit"
      title="Are you sure to submit the document?"
      description="Once you submit this document, others will come to review it."
      handleConfirm={() => {
        mutation.mutate({ documentId: props.documentId }, {
          onSuccess: () => {
            if (props.refetch) props.refetch()
          },
          onError: (err) => {
            toast({ title: "Submit failed.", description: err.message })
          }
        })
      }}
    />
  )
}

const ClaimDialog = (props: { documentId: string, refetch?: () => void }) => {
  const mutation = api.document.claimByUser.useMutation()
  const { toast } = useToast()

  return (
    <ConfirmDialog
      trigger="Confirm"
      title="Are you sure to claim the document?"
      description="Claiming the document to let others know you are working on it."
      handleConfirm={() => {
        mutation.mutate({ documentId: props.documentId }, {
          onSuccess: () => {
            if (props.refetch) props.refetch()
          },
          onError: (err) => {
            toast({ title: "Claim failed.", description: err.message })
          }
        })
      }}
    />
  )
}

export type DocumentColumn = {
  id: string
  title: string
  type: DocumentType
  srcJson: string | undefined
  dstJson: string | undefined
  state: DocumentState
  memo: string | null
  project: string
  user: { id: string, name: string, image: string } | null
  updated: Date
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
      const project: string = row.getValue("project")
      return (
        <div className="flex">
          <p className="text-xs text-gray-400 whitespace-nowrap">
            {truncateString(project, 20)}
          </p>
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
    header: "Type",
    cell: ({ row }) => {
      const typeName = row.getValue("type")
      if (typeName === "INTRODUCTION") {
        return <Badge variant="secondary">INTRO</Badge>
      } else if (typeName === "CURRICULUM") {
        return <Badge variant="secondary">SYLLABUS</Badge>
      } else if (typeName === "SUBTITLE") {
        return <Badge variant="secondary">VIDEO</Badge>
      } else if (typeName === "ATTACHMENT") {
        return <Badge variant="secondary">FILE</Badge>
      } else if (typeName === "ARTICLE") {
        return <Badge variant="secondary">ARTICLE</Badge>
      } else if (typeName === "QUIZ") {
        return <Badge variant="secondary">QUIZ</Badge>
      }
    }
  },
  {
    accessorKey: "state",
    header: "State",
    cell: ({ row }) => {
      const stateName = row.getValue("state")
      if (stateName === "OPEN") {
        return <Badge className="bg-sky-500">OPEN</Badge>
      } else if (stateName === "WORKING") {
        return <Badge className="bg-red-500">WORKING</Badge>
      } else if (stateName === "REVIEW") {
        return <Badge className="bg-teal-500">REVIEW</Badge>
      } else if (stateName === "CLOSED") {
        return <Badge className="bg-gray-500">CLOSED</Badge>
      }
    }
  },
  {
    accessorKey: "memo",
    header: "Memo"
  },
  {
    accessorKey: "user",
    header: "Claimed",
    cell: ({ row }) => {
      const user: { id: string, name: string, image: string } = row.getValue("user")
      let avatarUI = <></>
      if (user) {
        avatarUI = (<div className="flex">
          <Avatar key={user.id} className="h-8 w-8">
            <AvatarImage src={user.image} alt={user.name} />
            <AvatarFallback>{extractLetters(user.name)}</AvatarFallback>
          </Avatar>
        </div>)
      }
      return <>
        {avatarUI}
      </>
    },
  },
  {
    accessorKey: "updated",
    header: "Updated",
    cell: ({ row }) => {
      dayjs.extend(relativeTime)
      const time = dayjs(row.getValue("updated"))
      return time.fromNow()
    }
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const data = row.original
      const myself = table.options.meta?.user
      const refetch = table.options.meta?.refetchData
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
          {
            (data.state === "OPEN") ?
              <ClaimDialog refetch={refetch} documentId={data.id} /> :
              (data.state === "WORKING") ?
                <SubmitDialog refetch={refetch} documentId={data.id} /> :
                (data.state === "REVIEW" && myself && myself.role === "ADMIN") ?
                  <CloseDialog refetch={refetch} documentId={data.id} /> :
                  <Button className="invisible w-20">Hidden</Button>
          }

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
        </div>
      )
    },
  }
]
