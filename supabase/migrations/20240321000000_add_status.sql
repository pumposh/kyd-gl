-- Add status column to guest_lists table
ALTER TABLE guest_lists ADD COLUMN status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready'));

-- Update existing records to have 'ready' status
UPDATE guest_lists SET status = 'ready' WHERE status = 'draft'; 