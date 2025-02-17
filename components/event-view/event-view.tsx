'use client'

import { GuestListProcessor } from "@/components/upload-guest-list/processor"
import { DataTable } from "@/components/ui/data-table"
import { Header } from "@/components/upload-guest-list/header"
import { useState, useMemo } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "../ui/button"
import { ListCheck, Loader2, TicketCheck } from "lucide-react"
import { Check } from "lucide-react"
import { Guest, GuestList } from "@/utils/db"
import { GuestListApi } from '@/utils/api'

interface EventContentProps {
  isUploadPage: boolean
  guestList: GuestList | null
  guests: Guest[]
}

const ALL_COLUMNS: ColumnDef<Guest>[] = [
  {
    accessorKey: 'first_name',
    header: 'First Name',
  },
  {
    accessorKey: 'last_name',
    header: 'Last Name',
  },
  {
    accessorKey: 'num_tickets',
    header: 'Tickets',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'notes',
    header: 'Notes',
  },
]

export function EventContent({ isUploadPage, guestList, guests }: EventContentProps) {
  const [isMappingComplete, setIsMappingComplete] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedGuests, setProcessedGuests] = useState<Guest[]>(guests)
  const [currentGuestList, setCurrentGuestList] = useState<GuestList | null>(guestList)
  const [processingError, setProcessingError] = useState<string | null>(null)

  // Filter out columns that are empty across all entries
  const visibleColumns = useMemo(() => {
    if (!processedGuests.length) return ALL_COLUMNS

    return ALL_COLUMNS.filter(column => {
      const key = (column as any).accessorKey as keyof Guest
      // Always show first_name and num_tickets
      if (key === 'first_name' || key === 'num_tickets') return true
      
      // Check if any guest has a non-empty value for this column
      return processedGuests.some(guest => {
        const value = guest[key]
        return value !== null && value !== '' && value !== undefined
      })
    })
  }, [processedGuests])

  const handleConfirm = async (columnPositions: Record<string, number>) => {
    if (!currentGuestList) return

    setIsProcessing(true)
    setProcessingError(null)
    try {
      await GuestListApi.processGuestList(currentGuestList.id, columnPositions)
      
      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error('Failed to process guest list:', error)
      setProcessingError(error instanceof Error ? error.message : 'Failed to process guest list')
    } finally {
      setIsProcessing(false)
    }
  }

  if (isUploadPage) {
    return (
      <div className="space-y-6">
        <GuestListProcessor />
      </div>
    )
  }

  if (!currentGuestList) {
    return null
  }

  if (currentGuestList.status === 'draft') {
    let processorRef: { columnPositions: Record<string, number> } | null = null;

    return (
      <div className="space-y-6">
        <Header 
          guestList={currentGuestList}
          isMappingComplete={isMappingComplete}
          isProcessing={isProcessing}
          actionButton={
            <div className="flex flex-col items-end gap-2">
              {processingError && (
                <p className="text-sm text-destructive">{processingError}</p>
              )}
              <Button 
                onClick={() => processorRef && handleConfirm(processorRef.columnPositions)} 
                disabled={!isMappingComplete || isProcessing}
                className="gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Confirm
                    <ListCheck className="h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          }
        />
        <GuestListProcessor 
          existingGuestList={currentGuestList}
          onMappingComplete={setIsMappingComplete}
          onConfirm={handleConfirm}
          ref={(ref) => { processorRef = ref }}
        />
      </div>
    )
  }

  // Show the guest list table when status is 'ready'
  return (
    <div className="space-y-6">
      <Header 
        guestList={currentGuestList}
        isMappingComplete={true}
        isProcessing={false}
        actionButton={null}
      />
      <DataTable
        columns={visibleColumns}
        data={processedGuests}
        showPagination={true}
      />
    </div>
  )
}