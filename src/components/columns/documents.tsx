"use client"

import * as React from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar"
import { CheckCircle, ChevronRight, MoreHorizontal } from "lucide-react"

import { Button } from "~/components/ui/button"
import { Checkbox } from "~/components/ui/checkbox"
import { Edit, Trash, Eraser } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { extractLetters, naturalTime, truncateString } from "~/utils/helper"
import type { DocumentState, DocumentType } from "@prisma/client"
import { Badge } from "~/components/ui/badge"
import { api } from "~/utils/api"
import { useToast } from "~/components/ui/use-toast"
import { ConfirmDialog, ConfirmDialogInDropdown } from "~/components/confirm-dialog"
import Link from "next/link"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip"

const CloseDialog = (props: { documentId: string, refetch?: () => void }) => {
  const mutation = api.document.closeByAdmin.useMutation()
  const { toast } = useToast()
  const [open, setOpen] = React.useState(false)
  const [working, setWorking] = React.useState(false)

  return (
    <ConfirmDialog
      trigger={
        <>
          <CheckCircle className="mr-2 h-4 w-4" />
          <span>Close</span>
        </>
      }
      open={open}
      setOpen={setOpen}
      working={working}
      title="Are you sure to close the document?"
      description="Once the document is closed, other people cannot modify it anymore."
      handleConfirm={() => {
        setWorking(true)
        mutation.mutate({ documentId: props.documentId }, {
          onSuccess: () => {
            if (props.refetch) props.refetch()
            setWorking(false)
            setOpen(false)
          },
          onError: (err) => {
            toast({ title: "Close failed.", description: err.message })
            setWorking(false)
            setOpen(false)
          }
        })
      }}
    />
  )
}
const SubmitDialog = (props: { documentId: string, refetch?: () => void }) => {
  const mutation = api.document.submitByUser.useMutation()
  const { toast } = useToast()
  const [open, setOpen] = React.useState(false)
  const [working, setWorking] = React.useState(false)

  return (
    <ConfirmDialogInDropdown
      trigger={
        <>
          <CheckCircle className="mr-2 h-4 w-4" />
          <span>Submit</span>
        </>
      }
      open={open}
      setOpen={setOpen}
      working={working}
      title="Are you sure to submit the document?"
      description="Once you submit this document, others will come to review it."
      handleConfirm={() => {
        setWorking(true)
        return mutation.mutateAsync({ documentId: props.documentId }, {
          onSuccess: () => {
            if (props.refetch) props.refetch()
            setWorking(false)
            setOpen(false)
          },
          onError: (err) => {
            toast({ title: "Submit failed.", description: err.message })
            setWorking(false)
            setOpen(false)
          }
        })
      }}
    />
  )
}

const ClaimDialog = (props: { documentId: string, refetch?: () => void }) => {
  const mutation = api.document.claimByUser.useMutation()
  const [open, setOpen] = React.useState(false)
  const [working, setWorking] = React.useState(false)
  const { toast } = useToast()

  return (
    <ConfirmDialogInDropdown
      trigger={
        <>
          <CheckCircle className="mr-2 h-4 w-4" />
          <span>Claim</span>
        </>
      }
      open={open}
      setOpen={setOpen}
      working={working}
      title="Are you sure to claim the document?"
      description="Claiming the document to let others know you are working on it."
      handleConfirm={() => {
        setWorking(true)
        mutation.mutate({ documentId: props.documentId }, {
          onSuccess: () => {
            if (props.refetch) props.refetch()
            setWorking(false)
            setOpen(false)
          },
          onError: (err) => {
            toast({ title: "Claim failed.", description: err.message })
            setWorking(false)
            setOpen(false)
          }
        })
      }}
    />
  )
}

const ResetDocumentDialog = (
  { disabled,
    documentId,
    refetch }:
    {
      disabled?: boolean,
      documentId: string,
      refetch?: () => void
    }) => {
  const mutation = api.document.resetByAdmin.useMutation()
  const { toast } = useToast()
  const [open, setOpen] = React.useState(false)
  const [working, setWorking] = React.useState(false)

  return (
    <ConfirmDialogInDropdown
      disabled={disabled}
      open={open}
      setOpen={setOpen}
      working={working}
      trigger={<><Eraser className="mr-2 h-4 w-4" /><span>Reset</span></>}
      title="Reset the document"
      description="This operation is dangerous! The translated part of this document will be erased. Do you confirm to do so?"
      handleConfirm={() => {
        setWorking(true)
        mutation.mutate({ documentId: documentId }, {
          onSuccess: () => {
            if (refetch) refetch()
            setWorking(false)
            setOpen(false)
          },
          onError: (err) => {
            toast({ title: "Claim failed.", description: err.message })
            setWorking(false)
            setOpen(false)
          }
        })
      }
      }
    />
  )
}

export type DocumentColumn = {
  id: string
  title: string
  type: DocumentType
  state: DocumentState
  memo: string | null
  project: string
  user: { id: string, name: string, image: string } | null
  updated: Date
}

export const getDocStateBadges = (state?: DocumentState) => {
  const stateBadges = {
    OPEN: <Badge className="bg-sky-500">OPEN</Badge>,
    WORKING: <Badge className="bg-red-500">WORKING</Badge>,
    REVIEW: <Badge className="bg-teal-500">REVIEW</Badge>,
    CLOSED: <Badge className="bg-gray-500">CLOSED</Badge>,
  }

  if (state) {
    return stateBadges[state]
  } else {
    return stateBadges
  }
}

export const getDocTypeBadges = (type?: DocumentType) => {
  const typeBadges = {
    INTRODUCTION: <Badge variant="secondary">INTRO</Badge>,
    CURRICULUM: <Badge variant="secondary">CURRICULUM</Badge>,
    SUBTITLE: <Badge variant="secondary">VIDEO</Badge>,
    ARTICLE: <Badge variant="secondary">ARTICLE</Badge>,
    ATTACHMENT: <Badge variant="secondary">ATTACHMENT</Badge>,
    QUIZ: <Badge variant="secondary">QUIZ</Badge>,
  }

  if (type) {
    return typeBadges[type]
  } else {
    return typeBadges
  }
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
      const typeName: DocumentType = row.getValue("type")
      return getDocTypeBadges(typeName)
    }
  },
  {
    accessorKey: "state",
    header: "State",
    cell: ({ row }) => {
      const stateName: DocumentState = row.getValue("state")
      return getDocStateBadges(stateName)
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
      return naturalTime(row.getValue("updated"))
    }
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const data = row.original
      const myself = table.options.meta?.user
      const refetch = table.options.meta?.refetchData
      const isEditable = (data.state !== "OPEN" && data.state !== "CLOSED") &&
        (myself && data.user && data.user.id === myself.id) ||
        (myself && myself.role === "ADMIN")
      let editorUrl = "/"
      if (data.type === "INTRODUCTION") {
        editorUrl = "/editor/introduction/" + data.id
      } else if (data.type === "CURRICULUM") {
        editorUrl = "/editor/curriculum/" + data.id
      } else if (data.type === "SUBTITLE") {
        editorUrl = "/editor/subtitle/" + data.id
      } else if (data.type === "ARTICLE") {
        editorUrl = "/editor/article/" + data.id
      } else if (data.type === "QUIZ") {
        editorUrl = "/editor/quiz/" + data.id
      } else if (data.type === "ATTACHMENT") {
        editorUrl = "/editor/attachment/" + data.id
      }

      return (
        <div className="flex space-x-1 place-items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                {
                  isEditable ?
                    <Link href={editorUrl} target="_blank">
                      <ChevronRight className="mr-2 h-4 w-4" />
                    </Link> :
                    <ChevronRight className="mr-2 h-4 w-4 text-gray-300" />
                }
              </TooltipTrigger>
              <TooltipContent>
                <p>{
                  isEditable ? "Open the document" : "Document is not claimed by you"
                }</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
              {
                (data.state === "OPEN") ?
                  <ClaimDialog refetch={refetch} documentId={data.id} /> :
                  (data.state === "WORKING") ?
                    <SubmitDialog refetch={refetch} documentId={data.id} /> :
                    (data.state === "REVIEW" && myself && myself.role === "ADMIN") ?
                      <CloseDialog refetch={refetch} documentId={data.id} /> :
                      <></>
              }
              <DropdownMenuItem disabled={myself && myself.role === "EDITOR"}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>

              <DropdownMenuItem disabled={myself && myself.role === "EDITOR"}>
                <Trash className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>

              <ResetDocumentDialog
                disabled={myself && myself.role === "EDITOR"}
                documentId={data.id}
                refetch={() => { if (refetch) refetch() }}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  }
]
