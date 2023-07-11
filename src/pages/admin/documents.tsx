import * as React from "react"
import { useSession } from "next-auth/react"
import {
  type DocumentColumn,
  columns,
  getDocStateBadges,
  getDocTypeBadges
} from "~/components/columns/documents"
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
import type { DocumentState, DocumentType } from "@prisma/client"
import type { PaginationState } from "@tanstack/react-table"

const DocumentManagement: NextPageWithLayout = () => {
  const { data: session } = useSession()
  const router = useRouter();
  const { p } = router.query;
  const [docProjectFilter, setDocProjectFilter] = React.useState<string | undefined>(undefined)
  const [docStateFilter, setDocStateFilter] = React.useState<DocumentState | undefined>(undefined)
  const [docTypeFilter, setDocTypeFilter] = React.useState<DocumentType | undefined>(undefined)
  const [rowSelection, setRowSelection] = React.useState({})

  const [{ pageIndex, pageSize }, setPagination] =
    React.useState<PaginationState>({
      pageIndex: 0,
      pageSize: 10,
    })

  const pagination = React.useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize]
  )

  React.useEffect(() => {
    if (p) {
      setDocProjectFilter(p as string)
    }
  }, [p])

  const { data: result, isFetching, refetch, isPreviousData } = api.document.getAll.useQuery(
    {
      pageSize: pageSize,
      pageIndex: pageIndex,
      filterByProject: docProjectFilter,
      filterByType: docTypeFilter,
      filterByState: docStateFilter,
    },
    {
      enabled: session?.user !== undefined,
      refetchOnWindowFocus: false,
      keepPreviousData: true,
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
  let total = 0
  if (result !== undefined) {
    total = result.pagination.total
    data = result.data.map((document) => {
      const d: DocumentColumn = {
        id: document.id,
        title: document.title,
        type: document.type,
        state: document.state,
        seq: document.seq,
        memo: document.memo,
        project: { id: document.project.id, name: document.project.name },
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
        <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-4">
          <h2 className="text-xl md:text-3xl font-bold">All documents</h2>
          <div className="flex flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0">
            <Select onValueChange={(v) => {
              if (v === "") setDocTypeFilter(undefined)
              else setDocTypeFilter(v as DocumentType)
            }}>
              <SelectTrigger className="text-xs h-9 w-40">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Type</SelectLabel>
                  <SelectItem value="">All types</SelectItem>
                  {
                    Object.keys(getDocTypeBadges()).map(ds => {
                      return <SelectItem
                        key={ds}
                        value={ds}>{getDocTypeBadges(ds as DocumentType) as JSX.Element}</SelectItem>
                    })
                  }
                </SelectGroup>
              </SelectContent>
            </Select>


            <Select onValueChange={(v) => {
              if (v === "") setDocStateFilter(undefined)
              else setDocStateFilter(v as DocumentState)
            }}>
              <SelectTrigger className="text-xs h-9 w-40">
                <SelectValue placeholder="Filter by state" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>State</SelectLabel>
                  <SelectItem value="">All states</SelectItem>
                  {
                    Object.keys(getDocStateBadges()).map(ds => {
                      return <SelectItem
                        key={ds}
                        value={ds}>{getDocStateBadges(ds as DocumentState) as JSX.Element}</SelectItem>
                    })
                  }
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select onValueChange={(v) => {
              if (v === "") setDocProjectFilter(undefined)
              else setDocProjectFilter(v)
            }}>
              <SelectTrigger className="text-xs h-9 w-40">
                <SelectValue placeholder="Filter by project" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Projects</SelectLabel>
                  <SelectItem value="">All projects</SelectItem>
                  {projects ? projects.map((p) =>
                    <SelectItem key={p.id} value={p.id}>{truncateString(p.name, 26)}</SelectItem>
                  ) : <>Loading</>}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
          <Button className="w-28" disabled={isFetching} variant="outline" onClick={() => refetch()}>
            <RefreshCcw className={`mr-2 h-4 w-4 ${(isFetching) ? "animate-spin" : ""}`} />
            {(isFetching) ? "Loading" : "Refresh"}
          </Button>
          {
            session?.user.role === "ADMIN" ?
              <DocumentCreateDialog />
              : <></>
          }
        </div>
      </div>

      <DataTable
        disabled={isPreviousData}
        columns={columns}
        data={data}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        user={session?.user}
        handleRefetch={() => refetch()}
        pagination={pagination}
        setPagination={setPagination}
        total={total}
      />
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
