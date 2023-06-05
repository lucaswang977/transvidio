import { NextPage } from "next"
import Layout from "./layout"
import { DataTable } from "~/components/ui/data-table"
import { UserColumn, columns } from "~/components/columns/users"
import { useSession } from "next-auth/react"
import { api } from "~/utils/api";

const getData = () => {
  const { data: sessionData } = useSession();
  const { data: users } = api.user.getAll.useQuery(
    undefined, // no input
    { enabled: sessionData?.user !== undefined },
  );

  if (users === undefined) return []

  const usersData: UserColumn[] = users.map((user) => {
    const u: UserColumn = {
      id: user.id,
      name: user.name ? user.name : "",
      role: user.role === "ADMIN" ? "admin" : "editor",
      email: user.email ? user.email : "",
      image: user.image ? user.image : ""
    }

    return u
  })

  return usersData
}

const UserManagement: NextPage = () => {
  const data = getData()

  return (
    <Layout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">User management</h2>
        </div>
        <div>
          <DataTable columns={columns} data={data} />
        </div>
      </div>
    </Layout>

  )
}

export default UserManagement
