"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import type { PaginationMeta } from "@/types/api"

interface PaginationProps {
  meta: PaginationMeta
  onPageChange: (page: number) => void
}

/**
 * Pagination component for patient lists
 */
export function Pagination({ meta, onPageChange }: PaginationProps) {
  const { page, totalPages, hasNextPage, hasPreviousPage } = meta

  if (totalPages <= 1) {
    return null
  }

  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={!hasPreviousPage}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPreviousPage}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={!hasNextPage}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

