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

// Get guest list and its guests
export async function GET(req: Request) {
  const id = new URL(req.url).pathname.split('/').pop()
  if (!id) {
    return NextResponse.json(
      { error: 'Guest list ID is required' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  try {
    const { data: guestList, error: guestListError } = await supabase
      .from('guest_lists')
      .select()
      .eq('id', id)
      .single()

    if (guestListError) throw guestListError

    if (guestList.status === 'ready') {
      const { data: guests, error: guestsError } = await supabase
        .from('guests')
        .select()
        .eq('guest_list_id', id)

      if (guestsError) throw guestsError
      return NextResponse.json({ guestList, guests })
    }

    return NextResponse.json({ guestList, guests: [] })
  } catch (error) {
    console.error('Error fetching guest list:', error)
    return NextResponse.json(
      { error: 'Failed to fetch guest list' },
      { status: 500 }
    )
  }
}

// Process guest list
export async function POST(req: Request) {
  const id = new URL(req.url).pathname.split('/').pop()
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
    const supabase = await createClient(true)

    // Get the guest list
    const { data: guestList, error: guestListError } = await supabase
      .from('guest_lists')
      .select('s3_key')
      .eq('id', id)
      .single()

    if (guestListError) throw guestListError

    // Get and parse CSV
    const { url } = await S3Service.getSignedUrl(guestList.s3_key, 'read')
    const csvResponse = await fetch(url)
    if (!csvResponse.ok) throw new Error('Failed to fetch CSV')
    
    const csvText = await csvResponse.text()
    const rows = csvText.split('\n')

    // Map columns
    const columnMapping = Object.entries(positions).reduce((acc, [columnType, csvIndex]) => {
      const dbColumn = COLUMN_MAP[columnType as keyof typeof COLUMN_MAP]
      if (dbColumn) {
        acc[dbColumn] = parseInt(csvIndex.toString(), 10)
      }
      return acc
    }, {} as Record<string, number>)

    // Process rows
    const processedRows = rows
      .slice(1)
      .filter(row => row.trim() !== '') // Skip empty lines
      .map(row => {
        const cells = row.split(',')
        const rowData: Record<string, string | number> = {
          guest_list_id: id,
          num_tickets: 1 // Default value
        }

        // Map each column according to the mapping
        Object.entries(columnMapping).forEach(([dbColumn, csvIndex]) => {
          const value = cells[csvIndex]?.trim() || ''
          if (dbColumn === 'num_tickets') {
            const numValue = parseInt(value, 10)
            rowData[dbColumn] = !isNaN(numValue) && numValue > 0 ? numValue : 1
          } else {
            rowData[dbColumn] = value
          }
        })

        return rowData
      })
      .filter(row => {
        const firstName = row.first_name
        return typeof firstName === 'string' && firstName.trim() !== ''
      }) // Skip rows without first name

    console.log(`Processing ${processedRows.length} valid rows`)

    // Insert in chunks
    const chunkSize = 1000
    for (let i = 0; i < processedRows.length; i += chunkSize) {
      const chunk = processedRows.slice(i, i + chunkSize)
      const { error: insertError } = await supabase
        .from('guests')
        .insert(chunk)

      if (insertError) throw insertError
    }

    // Update status and get guests
    const { data: updatedGuestList, error: updateError } = await supabase
      .from('guest_lists')
      .update({ status: 'ready' })
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    const { data: guests, error: guestsError } = await supabase
      .from('guests')
      .select()
      .eq('guest_list_id', id)

    if (guestsError) throw guestsError

    return NextResponse.json({ 
      success: true, 
      guests,
      guestList: updatedGuestList
    })
  } catch (error) {
    console.error('Process error:', error)
    return NextResponse.json(
      { error: 'Failed to process guest list' },
      { status: 500 }
    )
  }
}