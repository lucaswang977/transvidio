import { type NextPage } from "next"
import { useSession } from "next-auth/react"
import { Button } from "~/components/ui/button"
import { PlusCircle } from "lucide-react"
import { ProjectColumn, columns } from "~/components/columns/projects"
import { DataTable } from "~/components/ui/data-table"
import Layout from "./layout"
import { api } from "~/utils/api";

const getData = () => {
  const { data: sessionData } = useSession();
  const { data: projects } = api.project.getAll.useQuery(
    undefined, // no input
    { enabled: sessionData?.user !== undefined },
  );

  if (projects === undefined) return []

  const projectsData: ProjectColumn[] = projects.map((project) => {
    const p: ProjectColumn = {
      id: project.id,
      name: project.name ? project.name : "",
      srcLang: project.srcLang,
      dstLang: project.dstLang,
      users: project.users,
      documents: project.documents.length
    }

    return p
  })

  return projectsData
}


const ProjectManagement: NextPage = () => {
  const { data: session } = useSession()
  const data = getData()

  return (
    <Layout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">All projects</h2>
          {
            session?.user.role === "ADMIN" ?
              <Button size="sm" variant="outline">
                <PlusCircle className="mr-2 h-4 w-4" />
                New project
              </Button>
              : <></>
          }
        </div>

        <DataTable columns={columns} data={data} />
      </div>
    </Layout>

  )
}

export default ProjectManagement
