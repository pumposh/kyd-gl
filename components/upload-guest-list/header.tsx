'use client'

import { Button } from "@/components/ui/button"
import { Check, Link2 } from "lucide-react"
import { useEffect, useState } from "react"
import { formatDate } from "@/utils/date"
import { GuestList } from "@/utils/db"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface HeaderProps {
  guestList: GuestList
  isMappingComplete: boolean
  isProcessing: boolean
  actionButton: React.ReactNode
}

export function Header({ guestList, isMappingComplete, isProcessing, actionButton }: HeaderProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    console.log('Header state:', {
      guestListId: guestList.id,
      status: guestList.status,
      isMappingComplete
    })
  }, [guestList.id, guestList.status, isMappingComplete])

  const handleCopyLink = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {guestList.original_filename}
          </h1>
          <p className="text-sm text-muted-foreground">
            {guestList.status === 'draft' 
              ? 'Map your columns to continue'
              : `Uploaded ${formatDate(guestList.created_at)}`}
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copy link</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {guestList.status === 'draft' && (
        actionButton
      )}
    </div>
  )
} 