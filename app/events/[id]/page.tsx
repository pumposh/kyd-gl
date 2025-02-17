import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { createClient } from "@/utils/supabase/server"
import { EventContent } from "@/components/event-view/event-view"
import { AnimatePresence } from "framer-motion"

const breadcrumbs = (eventId: string, isUpload: boolean, isDraft: boolean) => [
  {
    label: "All guest lists",
    href: "/events"
  },
  {
    label: isUpload ? "Upload guest list" : isDraft ? "Set up guest list" : "Event details",
    href: `/events/${eventId}`
  }
]

type Props = {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function EventPage({ params, searchParams }: Props) {
  const { id } = await params
  const isUploadPage = id === 'upload-guest-list'
  const supabase = await createClient()
  
  let guestList = null
  let guests = []
  
  if (!isUploadPage) {
    const { data, error: guestListError } = await supabase
      .from('guest_lists')
      .select()
      .eq('id', id)
      .single()

    if (guestListError) {
      throw guestListError
    }
    
    guestList = data

    // Fetch guests if status is ready
    if (guestList.status === 'ready') {
      const { data: guestData, error: guestsError } = await supabase
        .from('guests')
        .select()
        .eq('guest_list_id', id)

      if (guestsError) {
        throw guestsError
      }
      guests = guestData
    }
  }

  return (
    <AnimatePresence mode="wait">
      <div className="container mx-auto py-6 space-y-6">
        <Breadcrumbs items={breadcrumbs(id, isUploadPage, guestList?.status === 'draft')} />
        <EventContent 
          isUploadPage={isUploadPage}
          guestList={guestList}
          guests={guests}
        />
      </div>
    </AnimatePresence>
  )
} 