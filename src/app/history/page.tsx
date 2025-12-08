"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowUpDown,
  Check,
  X,
  Minus,
  Clock,
  Search,
} from "lucide-react";
import {
  Lightning,
  User,
  Sparkle,
  Barbell,
  Trophy,
} from "@phosphor-icons/react";
import { getHistory, QuestionHistoryEntry } from "@/lib/historyStore";

// ============================================
// COLUMN DEFINITIONS
// ============================================

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDifficultyIcon(difficulty: string | null) {
  switch (difficulty) {
    case "beginner":
      return <Sparkle weight="duotone" className="h-4 w-4 text-green-500" />;
    case "intermediate":
      return <Barbell weight="duotone" className="h-4 w-4 text-yellow-500" />;
    case "advanced":
      return <Trophy weight="duotone" className="h-4 w-4 text-red-500" />;
    default:
      return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
}

const columns: ColumnDef<QuestionHistoryEntry>[] = [
  {
    accessorKey: "questionTitle",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4"
      >
        Question
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="max-w-[300px] truncate font-medium">
        {row.getValue("questionTitle")}
      </div>
    ),
  },
  {
    accessorKey: "topic",
    header: "Topic",
    cell: ({ row }) => (
      <Badge variant="outline" className="font-normal">
        {row.getValue("topic")}
      </Badge>
    ),
  },
  {
    accessorKey: "difficulty",
    header: "Difficulty",
    cell: ({ row }) => {
      const difficulty = row.getValue("difficulty") as string | null;
      return (
        <div className="flex items-center gap-1.5">
          {getDifficultyIcon(difficulty)}
          <span className="capitalize text-sm">{difficulty || "—"}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "mode",
    header: "Mode",
    cell: ({ row }) => {
      const mode = row.getValue("mode") as string;
      return (
        <div className="flex items-center gap-1.5">
          {mode === "auto" ? (
            <Lightning weight="duotone" className="h-4 w-4 text-primary" />
          ) : (
            <User weight="duotone" className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="capitalize text-sm">{mode}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "wasSubmitted",
    header: "Submitted",
    cell: ({ row }) => {
      const submitted = row.getValue("wasSubmitted") as boolean;
      return submitted ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Minus className="h-4 w-4 text-muted-foreground" />
      );
    },
  },
  {
    accessorKey: "wasCorrect",
    header: "Result",
    cell: ({ row }) => {
      const correct = row.getValue("wasCorrect") as boolean | null;
      if (correct === null) {
        return <Minus className="h-4 w-4 text-muted-foreground" />;
      }
      return correct ? (
        <Badge variant="default" className="bg-green-600">
          Correct
        </Badge>
      ) : (
        <Badge variant="destructive">Incorrect</Badge>
      );
    },
  },
  {
    accessorKey: "executedAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4"
      >
        Time
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        {formatDate(row.getValue("executedAt"))}
      </div>
    ),
  },
];

// ============================================
// MAIN COMPONENT
// ============================================

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<QuestionHistoryEntry[]>([]);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "executedAt", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const table = useReactTable({
    data: history,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 15,
      },
    },
  });

  const handleRowClick = (entry: QuestionHistoryEntry) => {
    router.push(`/practice?mode=review&historyId=${entry.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-xl font-semibold">Question History</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} entries
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={() => handleRowClick(row.original)}
                    className="cursor-pointer"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No history yet. Start practicing to see your attempts here!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between py-4">
          <div className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
