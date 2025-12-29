-- ==============================================================================
-- 1. COMPANIES (Firma Bilgileri)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    commercial_title TEXT,
    registration_number TEXT,
    address TEXT,
    website TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Admin: Full Access
CREATE POLICY "Admin can manage companies" ON public.companies
    FOR ALL
    USING (public.get_my_role() = 'admin');

-- Consultant: View Only
CREATE POLICY "Consultant can view companies" ON public.companies
    FOR SELECT
    USING (public.get_my_role() = 'consultant');


-- ==============================================================================
-- 2. COMPANY CONTACTS (Firma Yetkilileri)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.company_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    title TEXT,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: company_contacts
ALTER TABLE public.company_contacts ENABLE ROW LEVEL SECURITY;

-- Admin: Full Access
CREATE POLICY "Admin can manage company contacts" ON public.company_contacts
    FOR ALL
    USING (public.get_my_role() = 'admin');

-- Consultant: View Only
CREATE POLICY "Consultant can view company contacts" ON public.company_contacts
    FOR SELECT
    USING (public.get_my_role() = 'consultant');


-- ==============================================================================
-- 3. JOB POSITIONS (Açık Pozisyonlar)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.job_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) NOT NULL,
    title TEXT NOT NULL,
    requirements TEXT,
    benefits TEXT,
    assigned_consultant_id UUID REFERENCES public.profiles(id), -- The consultant responsible for this position
    status TEXT DEFAULT 'open', -- 'open', 'closed'
    created_by UUID REFERENCES public.profiles(id), -- Admin who created it
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: job_positions
ALTER TABLE public.job_positions ENABLE ROW LEVEL SECURITY;

-- Admin: Full Access
CREATE POLICY "Admin can manage job positions" ON public.job_positions
    FOR ALL
    USING (public.get_my_role() = 'admin');

-- Consultant: View Only Assigned
CREATE POLICY "Consultant can view assigned job positions" ON public.job_positions
    FOR SELECT
    USING (
        public.get_my_role() = 'consultant' 
        AND assigned_consultant_id = auth.uid()
    );


-- ==============================================================================
-- 4. POSITION CANDIDATES (Aday Takip)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.position_candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    position_id UUID REFERENCES public.job_positions(id) NOT NULL,
    candidate_id UUID REFERENCES public.candidates(id), -- Nullable for new/external candidates
    source_type TEXT NOT NULL, -- 'existing_candidate' | 'new_candidate'
    cv_file_url TEXT,
    candidate_name TEXT NOT NULL,
    position_title_snapshot TEXT,
    phone TEXT,
    email TEXT,
    interview_datetime TIMESTAMPTZ,
    consultant_evaluation TEXT,
    disability_status TEXT,
    share_date_with_client DATE,
    salary_expectation TEXT,
    city TEXT,
    district TEXT,
    company_interview_date DATE,
    company_feedback TEXT,
    result_status TEXT, -- 'BEKLEMEDE', 'INCELENDI', 'MULAKAT', 'TEKLIF', 'KABUL', 'RED'
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: position_candidates
ALTER TABLE public.position_candidates ENABLE ROW LEVEL SECURITY;

-- Admin: Full Access
CREATE POLICY "Admin can manage position candidates" ON public.position_candidates
    FOR ALL
    USING (public.get_my_role() = 'admin');

-- Consultant: Select (Own entries or entries for assigned positions)
CREATE POLICY "Consultant can view position candidates" ON public.position_candidates
    FOR SELECT
    USING (
        public.get_my_role() = 'consultant' AND (
            created_by = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.job_positions jp
                WHERE jp.id = position_candidates.position_id
                AND jp.assigned_consultant_id = auth.uid()
            )
        )
    );

-- Consultant: Insert/Update (Only for assigned positions)
CREATE POLICY "Consultant can insert position candidates" ON public.position_candidates
    FOR INSERT
    WITH CHECK (
        public.get_my_role() = 'consultant' AND
        EXISTS (
            SELECT 1 FROM public.job_positions jp
            WHERE jp.id = position_candidates.position_id
            AND jp.assigned_consultant_id = auth.uid()
        )
    );

CREATE POLICY "Consultant can update position candidates" ON public.position_candidates
    FOR UPDATE
    USING (
        public.get_my_role() = 'consultant' AND
        EXISTS (
            SELECT 1 FROM public.job_positions jp
            WHERE jp.id = position_candidates.position_id
            AND jp.assigned_consultant_id = auth.uid()
        )
    );


-- ==============================================================================
-- 5. STORAGE (CV Bucket)
-- ==============================================================================

-- Create a new bucket 'cvs' if not exists (This usually requires dashboard or API, SQL can insert to storage.buckets)
INSERT INTO storage.buckets (id, name, public)
VALUES ('cvs', 'cvs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Allow authenticated uploads
CREATE POLICY "Authenticated users can upload CVs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'cvs' );

CREATE POLICY "Authenticated users can view CVs"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'cvs' );
