import * as React from "react"
import { useSession } from "next-auth/react"
import { type ProjectColumn, columns } from "~/components/columns/projects"
import { DataTable } from "~/components/ui/data-table"
import { ProjectCreateDialog } from "~/components/create-project-dialog"
import Layout from "./layout"
import { api } from "~/utils/api";
import { type ProjectRelatedUser } from "~/server/api/routers/project"
import { RefreshCcw } from "lucide-react"
import { Button } from "~/components/ui/button"
import { type NextPageWithLayout } from "../_app"
import { TableLoading } from "~/components/ui/table-loading"
import { type ProjectAiParamters } from "~/types"

const ProjectManagement: NextPageWithLayout = () => {
  const { data: session } = useSession()
  const [rowSelection, setRowSelection] = React.useState({})
  const { data: projects, status, isRefetching, refetch } = api.project.getAll.useQuery(
    undefined, // no input
    {
      enabled: session?.user !== undefined,
      refetchOnWindowFocus: false,
    },
  );

  let data: ProjectColumn[] = []
  if (projects !== undefined) {
    data = projects.map((project) => {
      const p: ProjectColumn = {
        id: project.id,
        name: project.name ? project.name : "",
        srcLang: project.srcLang,
        dstLang: project.dstLang,
        memo: project.memo ? project.memo : "",
        aiParameter: project.aiParameter as ProjectAiParamters,
        users: project.users.map((user: { user: ProjectRelatedUser }) => {
          return {
            id: user.user.id,
            image: user.user.image,
            name: user.user.name
          }
        }),
        documentCount: project.documents
      }

      return p
    })
  }

  const handleRefetch = async () => {
    await refetch()
  }

  return (
    <div className="flex flex-col space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-xl md:text-3xl font-bold tracking-tight">All projects</h2>
        <div className="flex space-x-2">
          <Button size="sm" disabled={isRefetching} variant="outline" onClick={handleRefetch}>
            <RefreshCcw className={`mr-2 h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {
            session?.user.role === "ADMIN" ?
              <ProjectCreateDialog refetch={handleRefetch} />
              : <></>
          }
        </div>
      </div>

      {status === "loading" ?
        <TableLoading className="mt-6" />
        :
        <DataTable
          columns={columns}
          data={data}
          rowSelection={rowSelection}
          setRowSelection={setRowSelection}
          handleRefetch={handleRefetch}
          user={session?.user}
          total={data.length}
        />
      }
    </div>

  )
}

ProjectManagement.getTitle = () => "Projects - Transvid.io"
ProjectManagement.getLayout = (page) => {
  return (
    <Layout>
      {page}
    </Layout>
  )
}

export default ProjectManagement
