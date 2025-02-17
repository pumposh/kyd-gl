import { EventsTable } from "@/components/events-table";
import { GuestList } from "@/utils/db";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Group, Plus } from "lucide-react";

const CreateEventButton = ({ className }: { className?: string }) => {
  return (
    <Link href="/events/upload-guest-list">
      <Button className={className}>
        <Plus className="mr-2 h-4 w-4" />
        New event guest list
      </Button>
    </Link>
  );
};

export default async function Home() {
  const supabase = await createClient();
  let guestLists: GuestList[] = [];
  
  try {
    const { data, error } = await supabase
      .from('guest_lists')
      .select()
      .order('created_at', { ascending: false });
      
    if (!error) {
      guestLists = data;
    }
  } catch (error) {
    console.error(error);
  }

  return (
    <div className="container flex flex-col flex-grow gap-2">
      <div className="flex flex-col gap-2 max-w-5xl px-5 pb-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">All guest lists</h1>
          <CreateEventButton />
        </div>
        <div className="flex flex-col gap-2 text-sm text-gray-500">
          Select an event to manage or view artists' guest lists for that event.
        </div>
      </div>
      <div className="flex flex-grow flex-col gap-2 max-w-5xl px-5 pb-2">
        {guestLists.length > 0 ? (
          <EventsTable guestLists={guestLists} />
        ) : (
          <div className="flex flex-grow flex-col items-center justify-center gap-2 border rounded-lg p-8">
            <Group className="h-16 w-16 text-gray-400 opacity-70" />
            <p className="text-md text-gray-400 opacity-70 font-semibold max-w-[200px] text-center">
              Create a new event guest list to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
