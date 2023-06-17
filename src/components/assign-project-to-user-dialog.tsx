"use client"

import * as React from "react"
import { Button } from "~/components/ui/button"
import { DataTable } from "~/components/ui/data-table"
import { Edit } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog"
import { type UserColumn, columns } from "./columns/users"
import { useSession } from "next-auth/react"
import { api } from "~/utils/api";

type AssignProjectToUserDialogProps = {
  selectedUserIds: string[],
  projectId: string,
  refetch?: () => void
}

export function AssignProjectToUserDialog(props: AssignProjectToUserDialogProps) {
  const [open, setIsOpen] = React.useState(false)
  const [rowSelection, setRowSelection] = React.useState({})
  const mutation = api.project.assignUsers.useMutation()
  const { data: sessionData } = useSession();
  const { data: users } = api.user.getAll.useQuery(
    undefined, // no input
    { enabled: sessionData?.user !== undefined },
  );

  let allUsers: UserColumn[] = []

  if (users) {
    allUsers = users.map((user) => {
      const u: UserColumn = {
        id: user.id,
        name: user.name ? user.name : "",
        role: user.role === "ADMIN" ? "admin" : "editor",
        email: user.email ? user.email : "",
        image: user.image ? user.image : "",
        created: user.createdAt.toLocaleString()
      }

      return u
    })
  }

  function onSubmit() {
    console.log(rowSelection)
    const data: string[] = []
    if (allUsers && rowSelection) {
      Object.keys(rowSelection).forEach((index) => {
        const i: number = +index
        if (allUsers && allUsers[i]) {
          const userId = (allUsers[i] as { id: string }).id
          data.push(userId)
        }
      })

      mutation.mutate({
        id: props.projectId,
        users: data as [string, ...string[]]
      }, {
        onError: (err) => {
          console.log(err.message)
        },
        onSuccess: () => {
          if (props.refetch) props.refetch()
        }
      })
    }

    setIsOpen(false)
  }

  React.useEffect(() => {
    if (allUsers) {
      const result: { [key: number]: boolean } = {}
      allUsers.forEach((item, index) => {
        if (props.selectedUserIds.find((i) => i === item.id))
          result[index] = true
      })
      setRowSelection(result)
    }
  }, [open])

  return (
    <div>
      <Dialog open={open} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost">
            <Edit className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Who can access this project?</DialogTitle>
          </DialogHeader>
          <DataTable
            columns={columns}
            data={allUsers ? allUsers : []}
            rowSelection={rowSelection}
            setRowSelection={setRowSelection}
          />
          <DialogFooter>
            <Button onClick={onSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  )
}


