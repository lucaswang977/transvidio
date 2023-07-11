"use client"

import * as React from "react"

import {
  type ColumnDef,
  type RowSelectionState,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type OnChangeFn,
  type RowData,
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
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from "lucide-react"

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
  pagination?: { pageIndex: number, pageSize: number },
  setPagination?: OnChangeFn<PaginationState>,
  total?: number,
  pageCount?: number,
  disabled?: boolean,
}

export function DataTable<TData, TValue>({
  columns,
  data,
  rowSelection,
  setRowSelection,
  handleRefetch,
  user,
  pagination,
  total,
  setPagination,
  disabled,
}: DataTableProps<TData, TValue>) {

  const table = useReactTable({
    data,
    columns,
    pageCount: (total !== undefined && pagination !== undefined) ? Math.ceil(total / pagination.pageSize) : 0,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    manualPagination: true,
    onPaginationChange: setPagination,
    state: {
      rowSelection,
      pagination
    },
    meta: {
      refetchData: handleRefetch,
      user: user
    }
  })

  return (
    <div className="w-full rounded-md border relative">
      {disabled ?
        <div className="absolute inset-0 bg-white opacity-70 z-10"></div>
        : <></>
      }
      <Table className="relative">
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
        <p className="p-4 text-sm text-gray-400">Total {total} items</p>
        {
          (table.getPageCount() > 1) ?
            <div className="flex space-x-2 py-4 pr-4 items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronFirst className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <p className="text-sm px-2">
                {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <ChevronLast className="h-4 w-4" />
              </Button>
            </div>
            : <></>
        }
      </div>
    </div>
  )
}
