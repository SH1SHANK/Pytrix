"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowsDownUp,
  Check,
  Minus,
  Clock,
  MagnifyingGlass,
  ArrowSquareOut,
  Copy,
  Code,
  Trash,
  Lightning,
  User,
  Sparkle,
  Barbell,
  Trophy,
} from "@phosphor-icons/react";
import {
  getHistory,
  deleteHistoryEntry,
  QuestionHistoryEntry,
} from "@/lib/historyStore";
import { toast } from "sonner";
import { useRequireApiKey } from "@/hooks/useRequireApiKey";

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
        <ArrowsDownUp className="ml-2 h-4 w-4" />
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
        <ArrowsDownUp className="ml-2 h-4 w-4" />
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
import { Skeleton } from "@/components/ui/skeleton";

// ... imports ...

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<QuestionHistoryEntry[]>([]);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "executedAt", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const { isLoading } = useRequireApiKey();
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    setHistory(getHistory());
    setIsDataLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/incompatible-library
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

  // Context menu actions (following shadcn patterns from llms.txt)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] =
    useState<QuestionHistoryEntry | null>(null);

  const handleCopyQuestion = (entry: QuestionHistoryEntry) => {
    navigator.clipboard.writeText(entry.questionText);
    toast.success("Question copied to clipboard");
  };

  const handleCopyCode = (entry: QuestionHistoryEntry) => {
    navigator.clipboard.writeText(entry.codeSnapshot);
    toast.success("Code copied to clipboard");
  };

  const handleDeleteClick = (entry: QuestionHistoryEntry) => {
    setEntryToDelete(entry);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (entryToDelete) {
      deleteHistoryEntry(entryToDelete.id);
      setHistory(getHistory());
      toast.success("Entry deleted");
    }
    setDeleteDialogOpen(false);
    setEntryToDelete(null);
  };

  if (isLoading) return null;

  return (
    <div className="p-6">
      {/* Content */}
      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
            {isDataLoading ? (
              // Loading Skeletons
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-5 w-[200px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[80px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[80px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[40px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[80px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[120px]" />
                  </TableCell>
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <ContextMenu key={row.id}>
                  <ContextMenuTrigger asChild>
                    <TableRow
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
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-48">
                    <ContextMenuItem
                      onClick={() => handleRowClick(row.original)}
                    >
                      <ArrowSquareOut className="mr-2 h-4 w-4" />
                      Open in Practice
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      onClick={() => handleCopyQuestion(row.original)}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Question Text
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={() => handleCopyCode(row.original)}
                    >
                      <Code className="mr-2 h-4 w-4" />
                      Copy Code
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDeleteClick(row.original)}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete from History
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete History Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove &quot;{entryToDelete?.questionTitle}
              &quot; from your history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
