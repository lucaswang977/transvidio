import * as React from "react"
import Layout from "./layout"
import { DataTable } from "~/components/ui/data-table"
import { type UserColumn, columns } from "~/components/columns/users"
import { useSession } from "next-auth/react"
import { api } from "~/utils/api";
import { type NextPageWithLayout } from "../_app"

const UserManagement: NextPageWithLayout = () => {
  const [rowSelection, setRowSelection] = React.useState({})
  const { data: sessionData } = useSession();
  const { data: users } = api.user.getAll.useQuery(
    undefined, // no input
    { enabled: sessionData?.user !== undefined },
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
        created: user.createdAt.toLocaleString()
      }

      return u
    })

  }
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">All users</h2>
      </div>
      <div>
        <DataTable
          columns={columns}
          data={usersData}
          rowSelection={rowSelection}
          setRowSelection={setRowSelection}
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
