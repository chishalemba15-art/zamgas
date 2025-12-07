-- Add courier_status column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_status VARCHAR(50);

-- Comment: courier_status tracks the acceptance state of the assigned courier
-- Values: 'pending' (assigned, waiting for acceptance), 'accepted', 'rejected'
