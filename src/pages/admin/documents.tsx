import * as React from "react"
import { useSession } from "next-auth/react"
import { type DocumentColumn, columns } from "~/components/columns/documents"
import { DataTable } from "~/components/ui/data-table"
import Layout from "./layout"
import { useRouter } from 'next/router';
import { api } from "~/utils/api";
import { RefreshCcw } from "lucide-react"
import { Button } from "~/components/ui/button"
import { DocumentCreateDialog } from "~/components/create-document-dialog"
import { type NextPageWithLayout } from "../_app"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "~/components/ui/select"
import { truncateString } from "~/utils/helper"
import { TableLoading } from "~/components/ui/table-loading"

const DocumentManagement: NextPageWithLayout = () => {
  const { data: session } = useSession()
  const router = useRouter();
  const { filter } = router.query;
  const [filterProject, setFilterProject] = React.useState("")
  const [rowSelection, setRowSelection] = React.useState({})

  React.useEffect(() => {
    if (filter && typeof filter === "string") setFilterProject(filter)
  }, [filter])

  const { data: documents, status, isRefetching, refetch } = api.document.getAll.useQuery(
    undefined,
    {
      enabled: session?.user !== undefined,
      refetchOnWindowFocus: false
    },
  );
  const { data: projects } = api.project.getAll.useQuery(
    undefined,
    {
      enabled: session?.user !== undefined,
      refetchOnWindowFocus: false
    },
  );

  let data: DocumentColumn[] = []
  if (documents !== undefined) {
    data = documents.map((document) => {
      const d: DocumentColumn = {
        id: document.id,
        title: document.title,
        type: document.type,
        state: document.state,
        memo: document.memo,
        project: document.project.name,
        user: (document.user !== null) ? {
          id: document.user.id,
          name: document.user.name !== null ? document.user.name : "",
          image: document.user.image !== null ? document.user.image : ""
        } : null,
        updated: document.updatedAt
      }

      return d
    })
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">All documents</h2>
        <div className="flex space-x-2">
          <Select onValueChange={(v) => {
            setFilterProject(v)
          }}>
            <SelectTrigger className="w-[240px] text-xs h-9">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Projects</SelectLabel>
                <SelectItem value="">All projects</SelectItem>
                {projects ? projects.map((p) =>
                  <SelectItem key={p.id} value={p.name}>{truncateString(p.name, 26)}</SelectItem>
                ) : <>Loading</>}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button disabled={isRefetching} size="sm" variant="outline" onClick={() => refetch()}>
            <RefreshCcw className={`mr-2 h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {
            session?.user.role === "ADMIN" ?
              <DocumentCreateDialog />
              : <></>
          }
        </div>
      </div>

      {status === "loading" ?
        <TableLoading className="mt-6" />
        : <DataTable
          columns={columns}
          data={data}
          rowSelection={rowSelection}
          setRowSelection={setRowSelection}
          user={session?.user}
          handleRefetch={() => refetch()}
          filter={{ column: "project", value: filterProject }}
        />

      }
    </div>
  )
}

DocumentManagement.getTitle = () => "Documents - Transvid.io"
DocumentManagement.getLayout = (page) => {
  return (
    <Layout>
      {page}
    </Layout>
  )
}

export default DocumentManagement
