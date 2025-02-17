-- Create guest lists table
CREATE TABLE guest_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  original_filename TEXT NOT NULL,
  s3_key TEXT NOT NULL,
  share_token TEXT UNIQUE NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT share_token_length CHECK (char_length(share_token) >= 8)
);

-- Create guests table
CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_list_id UUID NOT NULL REFERENCES guest_lists(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  num_tickets INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  CONSTRAINT num_tickets_positive CHECK (num_tickets > 0)
);

-- Create indexes
CREATE INDEX idx_guest_lists_share_token ON guest_lists(share_token);
CREATE INDEX idx_guests_guest_list_id ON guests(guest_list_id);
CREATE INDEX idx_guests_name ON guests(first_name, last_name);

-- Create RLS policies
ALTER TABLE guest_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- Allow public access to all operations
CREATE POLICY "Allow public access to guest lists" ON guest_lists
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public access to guests" ON guests
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create function to generate share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT AS $$
DECLARE
  token TEXT;
  taken BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 10-character token
    token := substr(md5(random()::text), 1, 10);
    
    -- Check if token is already taken
    SELECT EXISTS (
      SELECT 1 FROM guest_lists WHERE share_token = token
    ) INTO taken;
    
    -- Exit loop if token is unique
    EXIT WHEN NOT taken;
  END LOOP;
  
  RETURN token;
END;
$$ LANGUAGE plpgsql; 