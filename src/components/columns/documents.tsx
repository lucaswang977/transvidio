"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar"
import { CheckCircle, ChevronRight, CircleOff, Info, MoreHorizontal } from "lucide-react"

import { Button } from "~/components/ui/button"
import { Checkbox } from "~/components/ui/checkbox"
import { Trash, Eraser } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { extractLetters, naturalTime, truncateString } from "~/utils/helper"
import type { DocumentState, DocumentType } from "@prisma/client"
import { Badge } from "~/components/ui/badge"
import { api } from "~/utils/api"
import { useToast } from "~/components/ui/use-toast"
import { ConfirmDialogInDropdown } from "~/components/dialogs/confirm-dialog"
import Link from "next/link"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip"
import { WordCountModifyDialog } from "~/components/dialogs/wordcount-modify-dialog"

const CloseDialog = (props: { documentId: string, refetch: () => void }) => {
  const mutation = api.document.closeByAdmin.useMutation()
  const { toast } = useToast()
  const [open, setOpen] = React.useState(false)
  const [working, setWorking] = React.useState(false)

  return (
    <ConfirmDialogInDropdown
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
            props.refetch()
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
const SubmitDialog = (props: { documentId: string, refetch: () => void }) => {
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
            props.refetch()
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

const ClaimDialog = (props: { documentId: string, refetch: () => void }) => {
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
            props.refetch()
            toast({ title: "Document claimed." })
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

const UnclaimDialog = (props: { documentId: string, refetch: () => void }) => {
  const mutation = api.document.unclaimByUser.useMutation()
  const [open, setOpen] = React.useState(false)
  const [working, setWorking] = React.useState(false)
  const { toast } = useToast()

  return (
    <ConfirmDialogInDropdown
      trigger={
        <>
          <CircleOff className="mr-2 h-4 w-4" />
          <span>Unclaim</span>
        </>
      }
      open={open}
      setOpen={setOpen}
      working={working}
      title="Are you sure to UNCLAIM the document?"
      description="Unclaiming the document will not affect the content of the document, but others can claim it later on."
      handleConfirm={() => {
        setWorking(true)
        mutation.mutate({ documentId: props.documentId }, {
          onSuccess: () => {
            props.refetch()
            toast({ title: "Document unclaimed." })
            setWorking(false)
            setOpen(false)
          },
          onError: (err) => {
            toast({ title: "Unclaim failed.", description: err.message })
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
      refetch: () => void
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
            refetch()
            toast({ title: "Document reset." })
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

const DeleteDocumentDialog = (
  { disabled,
    documentId,
    refetch }:
    {
      disabled?: boolean,
      documentId: string,
      refetch: () => void
    }) => {
  const mutation = api.document.delete.useMutation()
  const { toast } = useToast()
  const [open, setOpen] = React.useState(false)
  const [working, setWorking] = React.useState(false)

  return (
    <ConfirmDialogInDropdown
      disabled={disabled}
      open={open}
      setOpen={setOpen}
      working={working}
      trigger={<><Trash className="mr-2 h-4 w-4" /><span>Delete</span></>}
      title="Delete the document"
      description="This operation is dangerous! Confirm?"
      handleConfirm={() => {
        setWorking(true)
        mutation.mutate({ documentId: documentId }, {
          onSuccess: () => {
            refetch()
            toast({ title: "Document deleted." })
            setWorking(false)
            setOpen(false)
          },
          onError: (err) => {
            toast({ title: "Delete failed.", description: err.message })
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
  seq: number
  type: DocumentType
  state: DocumentState
  memo: string | null
  wordCount: number
  project: { id: string, name: string }
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
    accessorKey: "seq",
    header: "#",
  },
  {
    accessorKey: "project",
    header: "Project",
    cell: ({ row }) => {
      const project: { id: string, name: string } = row.getValue("project")
      return (
        <div className="flex">
          <p className="text-xs text-gray-400 whitespace-nowrap">
            {truncateString(project.name, 20)}
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
    accessorKey: "user",
    header: "Claimed",
    cell: ({ row }) => {
      const user: { id: string, name: string, image: string } = row.getValue("user")
      let avatarUI = <></>
      if (user) {
        avatarUI = (<div className="flex">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar key={user.id} className="h-8 w-8">
                  <AvatarImage src={user.image} alt={user.name} />
                  <AvatarFallback>{extractLetters(user.name)}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{user.name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

        </div>)
      }
      return <>
        {avatarUI}
      </>
    },
  },
  {
    accessorKey: "wordCount",
    header: "Word Count",
    cell: ({ row, table }) => {
      const data = row.original
      const myself = table.options.meta?.user
      const refetch = table.options.meta?.refetchData
      const value: number = row.getValue("wordCount")

      return (
        <div className="flex items-center space-x-1">
          {
            (myself && myself.role === "ADMIN") ?
              <WordCountModifyDialog
                refetch={() => { if (refetch) refetch() }}
                documentId={data.id}
                currentValue={value}
                triggerChild={
                  <Button className="p-0" variant="link">{value}</Button>
                }
              />
              : <p>{row.getValue("wordCount")}</p>
          }
          {
            data.type === "ATTACHMENT" &&
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="text-gray-400 h-3 w-3" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>The word count of attachment type document is not accurate.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          }
        </div>
      )
    }
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
      const isOpenable =
        (myself && myself.role === "ADMIN") ||  // I am the admin
        (data.state === "REVIEW" || data.state === "CLOSED") ||  // Doc has been submitted
        ((data.state === "WORKING") && (myself && data.user && data.user.id === myself.id))  // I am working on it
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
                  isOpenable ?
                    <Link href={editorUrl} target="_blank">
                      <ChevronRight className="mr-2 h-4 w-4" />
                    </Link> :
                    <ChevronRight className="mr-2 h-4 w-4 text-gray-300" />
                }
              </TooltipTrigger>
              <TooltipContent>
                <p>{
                  isOpenable ? "Open the document" : "Not claimed"
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
                  <ClaimDialog refetch={() => { if (refetch) refetch() }} documentId={data.id} /> :
                  (data.state === "WORKING" && myself && myself.id === data.user?.id) ?
                    <>
                      <SubmitDialog refetch={() => { if (refetch) refetch() }} documentId={data.id} />
                      <UnclaimDialog refetch={() => { if (refetch) refetch() }} documentId={data.id} />
                    </>
                    :
                    (data.state === "REVIEW" && myself && myself.role === "ADMIN") &&
                    <CloseDialog refetch={() => { if (refetch) refetch() }} documentId={data.id} />
              }
              {
                (myself && myself.role === "ADMIN") &&
                <>
                  <ResetDocumentDialog
                    documentId={data.id}
                    refetch={() => { if (refetch) refetch() }}
                  />
                  <DeleteDocumentDialog
                    documentId={data.id}
                    refetch={() => { if (refetch) refetch() }}
                  />
                </>
              }
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  }
]
