"use client"

import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "../ui/data-table"
import { Button } from "../ui/button"
import { AlertCircle, Check, FileSpreadsheet, RotateCw } from "lucide-react"
import { Progress } from "../ui/progress"
import { useRouter } from "next/navigation"
import { useEffect, useState, useMemo, forwardRef, useImperativeHandle } from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { GuestListApi } from '@/utils/api'

interface PreviewData {
  [key: number]: string | number
}

const COLUMN_TYPES = [
  { label: "First Name", value: "firstName", required: true },
  { label: "Last Name", value: "lastName", required: false },
  { label: "Number of tickets", value: "tickets", required: false, default: 1 },
  { label: "Email", value: "email", required: false },
  { label: "Notes", value: "notes", required: false },
] as const

type ColumnType = typeof COLUMN_TYPES[number]["value"]

interface ColumnHeaderProps {
  column: any
  index: number
  selectedType: ColumnType | null
  onTypeSelect: (type: ColumnType) => void
  isNumericColumn: boolean
}

function DefaultColumnHeader() {
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-2">
        <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
        <div>
          <p className="text-lg font-medium">Drop your CSV file here</p>
          <p className="text-sm text-muted-foreground">or click to browse</p>
        </div>
      </div>

      <div className="w-full max-w-sm border rounded-lg p-4 bg-card">
        <h2 className="mb-2 text-semibold">Supported fields</h2>
        <div className="space-y-1.5 text-sm text-muted-foreground">
          {COLUMN_TYPES.map(type => (
            <div key={type.value} className="flex items-center gap-2">
              <span>{type.label}</span>
              {type.required && (
                <span className="text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">Required</span>
              )}
              {('default' in type && type.default !== undefined) && (
                <span className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500 px-1.5 py-0.5 rounded">Defaults to {type.default}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ColumnHeader({ selectedType, onTypeSelect, isNumericColumn }: ColumnHeaderProps) {
  const selectedLabel = COLUMN_TYPES.find(type => type.value === selectedType)?.label || `Select`
  const isUnset = !selectedType
  
  return (
    <div className="flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={isUnset ? "outline" : "ghost"}
            size="sm"
            className={cn(
              "gap-2 font-normal w-full justify-start",
              isUnset && "text-destructive border-destructive hover:bg-destructive/10"
            )}
          >
            {isUnset && <AlertCircle className="h-4 w-4 shrink-0" />}
            {selectedLabel}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[150px]">
          {COLUMN_TYPES.map((type) => (
            <DropdownMenuItem
              key={type.value}
              onClick={() => onTypeSelect(type.value)}
              className="flex items-center justify-between"
            >
              {type.label}
              {selectedType === type.value && (
                <Check className="h-4 w-4 text-muted-foreground" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

interface GuestListProcessorProps {
  existingGuestList?: {
    id: string
    s3_key: string
    original_filename: string
    status: 'draft' | 'ready'
  }
  onMappingComplete?: (isComplete: boolean) => void
  onConfirm?: (positions: Record<string, number>) => Promise<void>
}

interface ColumnPositions {
  [key: string]: number  // columnType -> csvIndex
}

export const GuestListProcessor = forwardRef<{ columnPositions: ColumnPositions }, GuestListProcessorProps>(({ 
  existingGuestList, 
  onMappingComplete,
  onConfirm 
}, ref) => {
  const router = useRouter()
  const [rawData, setRawData] = useState<PreviewData[]>([])
  const [columnOrder, setColumnOrder] = useState<string[]>([])
  const [columnTypes, setColumnTypes] = useState<Record<number, ColumnType | null>>({})
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<{ message: string, file: File } | null>(null)
  const [columnPositions, setColumnPositions] = useState<ColumnPositions>({})

  useImperativeHandle(ref, () => ({
    columnPositions
  }), [columnPositions])

  // Load CSV data for existing draft guest list
  useEffect(() => {
    if (existingGuestList?.status === 'draft') {
      console.log('Loading draft guest list:', existingGuestList.id)
      const fetchAndParseCSV = async () => {
        try {
          // Get presigned URL for reading
          console.log('Requesting presigned URL for:', existingGuestList.s3_key)
          const { url } = await GuestListApi.getPresignedUrl(existingGuestList.s3_key, 'read')
          console.log('Got presigned URL for reading')
          
          // Fetch CSV preview
          console.log('Fetching CSV preview')
          const csvResponse = await fetch(url, {
            headers: {
              'Range': 'bytes=0-8191' // Same 8KB preview size
            }
          });
          if (!csvResponse.ok) throw new Error('Failed to fetch CSV');
          const csvText = await csvResponse.text();
          console.log('Successfully fetched CSV preview')
          
          // Parse preview
          const lines = csvText.split('\n');
          const headers = lines[0].split(',');
          console.log('CSV headers:', headers.length)
          
          // Initialize column structure
          const newColumnTypes: Record<number, ColumnType | null> = {};
          const newColumnOrder: string[] = [];
          
          headers.forEach((_, index) => {
            newColumnTypes[index] = null;
            newColumnOrder.push(index.toString());
          });
          console.log('Initialized column structure:', { 
            types: newColumnTypes, 
            order: newColumnOrder 
          })
          
          // Parse preview data
          const data = lines.slice(1, 7).map(row => {
            const values = row.split(',');
            const rowData: PreviewData = {};
            headers.forEach((_, index) => {
              rowData[index] = values[index]?.trim() || '';
            });
            return rowData;
          });
          console.log(`Parsed ${data.length} preview rows`)
          
          setColumnTypes(newColumnTypes);
          setColumnOrder(newColumnOrder);
          setRawData(data);
          console.log('Updated component state with preview data')
        } catch (error) {
          console.error('Error loading CSV:', error);
        }
      };
      
      fetchAndParseCSV();
    }
  }, [existingGuestList]);

  // Detect numeric columns once during data load
  const numericColumns = useMemo(() => {
    if (rawData.length === 0) return new Set<number>()

    const numericCols = new Set<number>()
    Object.keys(columnTypes).forEach(colKey => {
      const index = parseInt(colKey)
      const isNumeric = rawData.every(row => {
        const value = row[index]
        if (value === '' || value === undefined) return true
        return !isNaN(Number(value)) && value.toString().trim() !== ''
      })
      if (isNumeric) numericCols.add(index)
    })

    return numericCols
  }, [rawData, columnTypes])

  // Check if all required columns are mapped
  const isMappingComplete = useMemo(() => {
    const requiredTypes = COLUMN_TYPES.filter(type => type.required).map(type => type.value);
    return requiredTypes.every(type => 
      Object.values(columnTypes).includes(type)
    );
  }, [columnTypes]);

  // Notify parent of mapping completion status
  useEffect(() => {
    onMappingComplete?.(isMappingComplete);
  }, [isMappingComplete, onMappingComplete]);

  const handleTypeSelect = (columnIndex: number, type: ColumnType) => {
    console.log('Column type selection:', { columnIndex, type })

    setColumnTypes(prev => {
      const newTypes = { ...prev }
      if (type !== 'firstName') {
        // Remove the type from any other column that had it
        Object.entries(newTypes).forEach(([k, v]) => {
          if (v === type) {
            console.log('Unmapping type from column:', k)
            newTypes[parseInt(k)] = null
            // Also remove from positions if we're unmapping
            setColumnPositions(prev => {
              const next = { ...prev }
              delete next[type]
              return next
            })
          }
        })
      }
      newTypes[columnIndex] = type
      
      // Update positions
      if (type) {
        setColumnPositions(prev => {
          const next = { ...prev, [type]: columnIndex }
          console.log('Updated column positions:', next)
          return next
        })
      }
      
      console.log('New column types:', newTypes)
      return newTypes
    })

    // Reorder columns based on COLUMN_TYPES order
    const newOrder = [...columnOrder]
    const currentIndex = newOrder.indexOf(columnIndex.toString())
    newOrder.splice(currentIndex, 1)

    // Find where to insert based on COLUMN_TYPES order
    const orderedColumns = COLUMN_TYPES.map(t => {
      const col = Object.entries(columnTypes).find(([_, type]) => type === t.value)?.[0]
      return col !== undefined ? col.toString() : null
    }).filter((col): col is string => col !== null)

    // Find the first mapped column that comes after this type in COLUMN_TYPES
    const typeIndex = COLUMN_TYPES.findIndex(t => t.value === type)
    let insertIndex = newOrder.length
    for (let i = typeIndex + 1; i < COLUMN_TYPES.length; i++) {
      const laterType = COLUMN_TYPES[i].value
      const colWithLaterType = Object.entries(columnTypes)
        .find(([_, t]) => t === laterType)?.[0]
      if (colWithLaterType) {
        const idx = newOrder.indexOf(colWithLaterType.toString())
        if (idx !== -1) {
          insertIndex = idx
          break
        }
      }
    }

    newOrder.splice(insertIndex, 0, columnIndex.toString())
    setColumnOrder(newOrder)
  }

  const uploadFile = async (file: File) => {
    setUploadError(null);
    try {
      // Get presigned URL
      const response = await fetch('/api/presign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename: file.name }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get upload URL');
      }
      
      const { url, key } = await response.json();
      
      // Upload to S3 using fetch with progress tracking
      const uploadResponse = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'text/csv',
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      setUploadProgress(100);
      setTimeout(() => {
        setUploadProgress(null);
        setIsUploading(false);
      }, 500);
      
      return key;
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress(null);
      setIsUploading(false);
      setUploadError({ message: error instanceof Error ? error.message : 'Upload failed', file });
      throw error;
    }
  };
  
  const handleRetry = async () => {
    if (uploadError) {
      setIsUploading(true);
      try {
        await handleFileDrop([uploadError.file] as unknown as FileList);
      } catch (error) {
        console.error('Retry failed:', error);
      }
    }
  };
  
  const createGuestList = async (s3Key: string, file: File) => {
    try {
      const response = await fetch('/api/guest-lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          original_filename: file.name,
          s3_key: s3Key,
          status: 'draft',
          event_date: new Date().toISOString(), // You might want to add a date picker later
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create guest list');
      }

      const { id } = await response.json();
      router.replace(`/events/${id}`);
    } catch (error) {
      console.error('Failed to create guest list:', error);
      setUploadError({ message: 'Failed to create guest list', file });
    }
  };

  const handleFileDrop = async (files: FileList) => {
    if (!files.length) return;
    
    const file = files[0];
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setUploadError({ 
        message: 'Please upload a CSV file', 
        file 
      });
      return;
    }

    // Check if file is empty
    if (file.size === 0) {
      setUploadError({ 
        message: 'The file is empty. Please upload a valid CSV file with data.', 
        file 
      });
      return;
    }

    // Read just enough of the file to validate format and show preview
    const reader = new FileReader();
    const PREVIEW_CHUNK_SIZE = 8192; // 8KB should be enough for header + few rows
    const chunk = file.slice(0, PREVIEW_CHUNK_SIZE);
    
    try {
      const previewText = await new Promise<string>((resolve, reject) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(chunk);
      });

      const lines = previewText.split('\n');
      if (!lines[0].includes(',')) {
        setUploadError({ 
          message: 'Invalid CSV format. Please ensure your file contains comma-separated values.', 
          file 
        });
        return;
      }

      // Parse preview data for the table
      const headers = lines[0].split(',');
      const previewData = lines.slice(1, 7).map(row => {
        const values = row.split(',');
        const rowData: Record<number, string> = {};
        headers.forEach((_, index) => {
          rowData[index] = values[index]?.trim() || '';
        });
        return rowData;
      });

      // Initialize column structure
      const newColumnTypes: Record<number, ColumnType | null> = {};
      const newColumnOrder: string[] = [];
      
      headers.forEach((_, index) => {
        newColumnTypes[index] = null;
        newColumnOrder.push(index.toString());
      });

      setColumnTypes(newColumnTypes);
      setColumnOrder(newColumnOrder);
      setRawData(previewData);

      // Start upload process
      setIsUploading(true);
      try {
        const s3Key = await GuestListApi.uploadFile(file, setUploadProgress);
        
        if (!existingGuestList) {
          const { id } = await GuestListApi.createGuestList({
            original_filename: file.name,
            s3_key: s3Key,
            status: 'draft',
            event_date: new Date().toISOString(),
          });
          
          // Route to the new guest list page
          router.push(`/events/${id}`);
        }
      } catch (error) {
        console.error('Upload error:', error);
        setUploadError({ 
          message: error instanceof Error ? error.message : 'Upload failed', 
          file 
        });
        setIsUploading(false);
      }
    } catch (error) {
      console.error('File processing error:', error);
      setUploadError({ 
        message: 'Failed to process file. Please try again.', 
        file 
      });
    }
  };
  
  const columns: ColumnDef<PreviewData>[] = useMemo(() => 
    Object.keys(columnTypes).map((key) => {
      const index = parseInt(key)
      return {
        accessorKey: index.toString(),
        header: ({ column }) => (
          rawData.length > 0 ? (
            <ColumnHeader
              column={column}
              index={index}
              selectedType={columnTypes[index]}
              onTypeSelect={(type) => handleTypeSelect(index, type)}
              isNumericColumn={numericColumns.has(index)}
            />
          ) : null
        ),
        enableSorting: false,
      }
    })
  , [columnTypes, columnOrder, rawData.length, numericColumns])
  
  // Update the summary row to be dynamic
  const tableData = useMemo(() => {
    if (rawData.length <= 5) return rawData
    
    const summaryRow: PreviewData = {}
    columnOrder.forEach(col => {
      const colIndex = parseInt(col)
      summaryRow[colIndex] = colIndex === parseInt(columnOrder[0]) 
        ? "More entries..." 
        : ""
    })
    
    return [...rawData.slice(0, 5), summaryRow]
  }, [rawData, columnOrder])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex-1" />
        {uploadError && (
          <div className="flex items-center gap-4">
            <p className="text-sm font-medium text-destructive">
              {uploadError.message}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRetry}
              className="gap-2"
              disabled={isUploading}
            >
              <RotateCw className="h-4 w-4" />
              Try again
            </Button>
          </div>
        )}
      </div>
      {uploadProgress !== null && (
        <div className="w-full">
          <Progress value={uploadProgress} className="w-full" />
          <p className="text-sm text-muted-foreground mt-2">
            {uploadProgress < 100 ? 'Uploading...' : 'Upload complete!'}
          </p>
        </div>
      )}
      {rawData.length > 0 && (
        <div className="flex items-center gap-2 p-3 text-sm bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-md border border-blue-200 dark:border-blue-800">
          <p>
            <strong>Preview Mode:</strong> Showing first {Math.min(rawData.length, 5)} rows of your data to help match columns. The full data will be processed after confirming the mapping.
          </p>
        </div>
      )}
      <DataTable
        columns={columns}
        data={tableData}
        onFileDrop={handleFileDrop}
        showPagination={false}
        columnOrder={columnOrder}
        onColumnOrderChange={setColumnOrder}
        displayWhenEmpty={<DefaultColumnHeader />}
      />
    </div>
  )
})
