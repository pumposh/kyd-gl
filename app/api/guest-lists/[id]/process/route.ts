import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { S3Service } from '@/utils/s3'

// Map our column types to database columns
const COLUMN_MAP = {
  firstName: 'first_name',
  lastName: 'last_name',
  tickets: 'num_tickets',
  email: 'email',
  notes: 'notes'
} as const

export async function POST(req: Request) {
  const id = new URL(req.url).pathname.split('/').slice(-2)[0]
  if (!id) {
    return NextResponse.json(
      { error: 'Guest list ID is required' },
      { status: 400 }
    )
  }

  try {
    const { positions } = await req.json() as {
      positions: Record<string, number>
    }
    
    console.log('Starting guest list processing:', id)
    console.log('Received column positions:', positions)

    const supabase = await createClient(true)

    // First get the guest list to get the S3 key
    const { data: guestList, error: guestListError } = await supabase
      .from('guest_lists')
      .select('s3_key')
      .eq('id', id)
      .single()

    if (guestListError) {
      console.error('Failed to fetch guest list:', guestListError)
      throw guestListError
    }
    console.log('Found guest list with S3 key:', guestList.s3_key)

    // Get the CSV content
    const { url } = await S3Service.getSignedUrl(guestList.s3_key, 'read')
    console.log('Generated presigned URL for reading')

    const csvResponse = await fetch(url)
    if (!csvResponse.ok) {
      console.error('Failed to fetch CSV:', csvResponse.status, csvResponse.statusText)
      throw new Error('Failed to fetch CSV')
    }
    const csvText = await csvResponse.text()
    console.log('Successfully fetched CSV content')

    // Parse CSV
    const rows = csvText.split('\n')
    console.log('Total rows in CSV:', rows.length)

    // Build the column mapping for the SQL query
    const columnMapping = Object.entries(positions).reduce((acc, [columnType, csvIndex]) => {
      const dbColumn = COLUMN_MAP[columnType as keyof typeof COLUMN_MAP]
      if (dbColumn) {
        acc[dbColumn] = parseInt(csvIndex.toString(), 10)
      }
      return acc
    }, {} as Record<string, number>)

    console.log('Column mapping for SQL:', columnMapping)

    // Process rows in chunks for better performance
    const chunkSize = 10000
    const processedRows = rows.slice(1).map((row, index) => {
      const cells = row.split(',')
      const rowData: Record<string, string | number> = {
        guest_list_id: id,
        num_tickets: 1 // Default value
      }

      // Map each column according to the mapping
      Object.entries(columnMapping).forEach(([dbColumn, csvIndex]) => {
        const value = cells[csvIndex]?.trim() || ''
        if (dbColumn === 'num_tickets') {
          rowData[dbColumn] = value ? parseInt(value, 10) : 1
        } else {
          rowData[dbColumn] = value
        }
      })

      // Log sample rows for verification
      if (index === 0 || index === rows.length - 2) {
        console.log(`Sample row ${index + 1}:`, rowData)
      }

      return rowData
    })

    console.log('Starting database insertion in chunks')

    // Insert in chunks
    for (let i = 0; i < processedRows.length; i += chunkSize) {
      const chunk = processedRows.slice(i, i + chunkSize)
      console.log(`Inserting chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(processedRows.length / chunkSize)}`)
      
      const { error: insertError } = await supabase
        .from('guests')
        .insert(chunk)

      if (insertError) {
        console.error('Failed to insert chunk:', insertError)
        throw insertError
      }
    }

    console.log('All chunks inserted successfully')

    // Update guest list status to ready
    const { error: updateError } = await supabase
      .from('guest_lists')
      .update({ status: 'ready' })
      .eq('id', id)

    if (updateError) {
      console.error('Failed to update guest list status:', updateError)
      throw updateError
    }

    console.log('Guest list processing completed successfully')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Process error:', error)
    return NextResponse.json(
      { error: 'Failed to process guest list' },
      { status: 500 }
    )
  }
} 