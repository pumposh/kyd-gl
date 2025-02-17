import { createClient } from '@/utils/supabase/server';
import { Database } from '@/types/database';

export type GuestList = Database['public']['Tables']['guest_lists']['Row'];
export type Guest = Database['public']['Tables']['guests']['Row'];

export type NewGuestList = Omit<GuestList, 'id' | 'created_at'>;
export type NewGuest = Omit<Guest, 'id'>;

export async function createGuestList(guestList: NewGuestList) {
  const supabase = await createClient(true);
  const { data, error } = await supabase
    .from('guest_lists')
    .insert(guestList)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createGuests(guests: NewGuest[]) {
  const supabase = await createClient(true);
  const { data, error } = await supabase
    .from('guests')
    .insert(guests)
    .select();

  if (error) throw error;
  return data;
}

export async function getGuestLists() {
  const supabase = await createClient();
  const { data: guestList, error: guestListError } = await supabase
    .from('guest_lists')
    .select()
    .order('created_at', { ascending: false });

  if (guestListError) throw guestListError;
  return guestList;
}

export async function getGuestListByToken(token: string) {
  const supabase = await createClient();
  const { data: guestList, error: guestListError } = await supabase
    .from('guest_lists')
    .select()
    .eq('share_token', token)
    .single();

  if (guestListError) throw guestListError;

  const { data: guests, error: guestsError } = await supabase
    .from('guests')
    .select()
    .eq('guest_list_id', guestList.id);

  if (guestsError) throw guestsError;

  return {
    ...guestList,
    guests: guests || []
  };
}

export async function generateShareToken(): Promise<string> {
  const supabase = await createClient(true);
  const { data, error } = await supabase
    .rpc('generate_share_token');

  if (error) throw error;
  return data;
} 