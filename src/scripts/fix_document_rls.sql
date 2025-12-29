-- Check existing policies for resume_documents
SELECT * FROM pg_policies WHERE tablename = 'resume_documents';

-- If necessary, drop existing policy
DROP POLICY IF EXISTS "Enable read access for all users" ON resume_documents;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON resume_documents;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON resume_documents;
DROP POLICY IF EXISTS "Users can view own documents" ON resume_documents;
DROP POLICY IF EXISTS "Admins and Consultants can view all documents" ON resume_documents;

-- Create comprehensive policies

-- 1. Candidates can view their own documents
CREATE POLICY "Candidates can view own documents" 
ON resume_documents FOR SELECT 
USING (auth.uid() = candidate_id);

-- 2. Candidates can insert their own documents
CREATE POLICY "Candidates can insert own documents" 
ON resume_documents FOR INSERT 
WITH CHECK (auth.uid() = candidate_id);

-- 3. Candidates can delete their own documents
CREATE POLICY "Candidates can delete own documents" 
ON resume_documents FOR DELETE 
USING (auth.uid() = candidate_id);

-- 4. Admins and Consultants can view ALL documents
CREATE POLICY "Admins and Consultants can view all documents" 
ON resume_documents FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'consultant')
  )
);
