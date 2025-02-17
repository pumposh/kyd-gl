"use client"

import { GuestList } from "@/utils/db"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "./ui/data-table"
import { Button } from "./ui/button"
import { ArrowUpDown } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatDate } from "@/utils/date"

const columns: ColumnDef<GuestList>[] = [
  {
    accessorKey: "original_filename",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <Link href={`/events/${row.original.id}`} className="flex items-center gap-2 hover:underline">
        {row.getValue("original_filename")}
      </Link>
    ),
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Uploaded
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => formatDate(row.getValue("created_at")),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status
      return (
        <span className={cn(
          "text-xs px-1.5 py-0.5 rounded capitalize",
          status === "ready" 
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-500"
            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500"
        )}>
          {status === "ready" ? "Ready" : "Draft"}
        </span>
      )
    },
  }
]

interface EventsTableProps {
  guestLists: GuestList[]
}

export function EventsTable({ guestLists }: EventsTableProps) {
  const handleFileDrop = (files: FileList) => {
    console.log(files)
  }

  return (
    <DataTable
      columns={columns}
      data={guestLists}
      searchColumn="original_filename"
      pageSize={10}
      onFileDrop={handleFileDrop}
    />
  )
} 