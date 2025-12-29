-- Add job_start_date to position_candidates table
ALTER TABLE public.position_candidates 
ADD COLUMN IF NOT EXISTS job_start_date DATE;

-- Verify it was added
-- SELECT job_start_date FROM public.position_candidates LIMIT 1;
