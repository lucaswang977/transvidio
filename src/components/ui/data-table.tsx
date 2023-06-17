"use client"

import * as React from "react"

import {
  type ColumnDef,
  type RowSelectionState,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type OnChangeFn,
  type RowData
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
}

export function DataTable<TData, TValue>({
  columns,
  data,
  rowSelection,
  setRowSelection,
  handleRefetch,
  user
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection
    },
    meta: {
      refetchData: handleRefetch,
      user: user
    }
  })
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
    </div>
  )
}
