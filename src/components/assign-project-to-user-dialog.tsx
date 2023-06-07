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
import { UserColumn, columns } from "./columns/users"
import { useSession } from "next-auth/react"
import { api } from "~/utils/api";

const getData = () => {
  const { data: sessionData } = useSession();
  const { data: users } = api.user.getAll.useQuery(
    undefined, // no input
    { enabled: sessionData?.user !== undefined },
  );

  if (users === undefined) return null

  const usersData: UserColumn[] = users.map((user) => {
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

  return usersData
}


export function AssignProjectToUserDialog(props: { selectedUserIds: string[], projectId: string }) {
  const [open, setIsOpen] = React.useState(false)
  const [rowSelection, setRowSelection] = React.useState({})
  const [selectionInitiated, setSelectionInitiated] = React.useState(false)
  const mutation = api.project.assignUsers.useMutation()

  const allUsers = getData()

  function onSubmit() {
    console.log(rowSelection)
    const data: string[] = []
    if (allUsers && rowSelection) {
      Object.keys(rowSelection).forEach((index) => {
        const i: number = +index
        if (allUsers[i]) {
          const userId = allUsers[i].id
          data.push(userId)
        }
      })

      mutation.mutate({
        id: props.projectId,
        users: data as [string, ...string[]]
      })
    }

    setIsOpen(false)
  }

  if (allUsers && !selectionInitiated) {
    const result: any = {}
    allUsers.forEach((item, index) => {
      if (props.selectedUserIds.find((i) => i === item.id))
        result[index] = true
    })
    setRowSelection(result)
    console.log("initialied ", allUsers, result, props.projectId)
    setSelectionInitiated(true)
  }

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


