"use client"

import * as React from "react"

import {
  type ColumnDef,
  type RowSelectionState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  useReactTable,
  type OnChangeFn,
  type RowData,
  type ColumnFiltersState,
  type PaginationState,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"

import type { UserRole } from "@prisma/client"
import { Button } from "~/components/ui/button"

declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    nouse?: TData,
    user?: { id: string, role: UserRole },
    refetchData?: () => void
  }
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[],
  rowSelection: RowSelectionState | undefined,
  setRowSelection: OnChangeFn<RowSelectionState> | undefined,
  handleRefetch?: () => void,
  user?: { id: string, role: UserRole },
  filter?: { column: string, value: string },
}

export function DataTable<TData, TValue>({
  columns,
  data,
  rowSelection,
  setRowSelection,
  handleRefetch,
  user,
  filter,
}: DataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageSize: 10,
    pageIndex: 0
  })
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getPaginationRowModel: getPaginationRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      rowSelection,
      columnFilters,
      pagination
    },
    meta: {
      refetchData: handleRefetch,
      user: user
    }
  })

  React.useEffect(() => {
    if (filter) {
      table.getColumn(filter.column)?.setFilterValue(filter.value)
    }
  }, [filter])

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between">
        <p className="p-4 text-sm text-gray-400">Total {table.getFilteredRowModel().rows.length} items</p>
        {
          (table.getPageCount() > 1) ?
            <div className="flex space-x-2 py-4 pr-4 items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <p className="text-sm px-2">{pagination.pageIndex + 1} / {table.getPageCount()}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
            : <></>
        }
      </div>
    </div>
  )
}
