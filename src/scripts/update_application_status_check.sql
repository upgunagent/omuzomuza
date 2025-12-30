-- Drop the existing constraint (name might vary, but usually it's applications_status_check)
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check;

-- Add the new constraint with updated status values
ALTER TABLE applications 
ADD CONSTRAINT applications_status_check 
CHECK (status IN (
    'pending', 
    'reviewed', 
    'consultant_interview', 
    'company_interview', 
    'offered', 
    'accepted', 
    'started', 
    'rejected'
));

-- Optional: If there's a comment on the column/table, update it
COMMENT ON COLUMN applications.status IS 'Application status: pending, reviewed, consultant_interview, company_interview, offered, accepted, started, rejected';
