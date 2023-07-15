import * as React from "react"
import Layout from "./layout"
import { DataTable } from "~/components/ui/data-table"
import type { NextPageWithLayout } from "../_app"
import type { UserColumn } from "~/components/columns/users"
import { columns } from "~/components/columns/users"
import { useSession } from "next-auth/react"
import { api } from "~/utils/api";
import { naturalTime } from "~/utils/helper"
import { Button } from "~/components/ui/button"
import { RefreshCw } from "lucide-react"

const UserManagement: NextPageWithLayout = () => {
  const [rowSelection, setRowSelection] = React.useState({})
  const { data: session } = useSession();
  const { data: users, isFetching, isLoading, isPreviousData, refetch } = api.user.getAll.useQuery(
    undefined, // no input
    {
      enabled: session?.user !== undefined,
      refetchOnWindowFocus: false
    },
  );

  let usersData: UserColumn[] = []

  if (users) {
    usersData = users.map((user) => {
      const u: UserColumn = {
        id: user.id,
        name: user.name ? user.name : "",
        role: user.role === "ADMIN" ? "admin" : "editor",
        email: user.email ? user.email : "",
        image: user.image ? user.image : "",
        created: user.createdAt.toLocaleString(),
        lastLogin: naturalTime(user.lastLogin)
      }

      return u
    })
  }

  const handleRefetch = async () => {
    await refetch()
  }
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">All users</h2>
        <div className="flex space-x-2">
          <Button disabled={isFetching} size="sm" variant="outline" onClick={handleRefetch}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            {(isFetching) ? "Loading" : "Refresh"}
          </Button>
        </div>

      </div>
      <div>
        <DataTable
          disabled={isLoading || isPreviousData}
          columns={columns}
          data={usersData}
          rowSelection={rowSelection}
          setRowSelection={setRowSelection}
          manualPagination={false}
        />
      </div>
    </div>
  )
}

UserManagement.getTitle = () => "Users - Transvid.io"
UserManagement.getLayout = (page) => {
  return (
    <Layout>
      {page}
    </Layout>
  )
}


export default UserManagement
