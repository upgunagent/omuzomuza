-- Allow consultants to insert new company contacts
-- First drop if exists to avoid error on retry? No, 'create policy' throws if exists.
-- Better to use IF NOT EXISTS if supported or drop first. Postgres 9.5+ supports IF NOT EXISTS for policies? No.
DROP POLICY IF EXISTS "Consultant can insert company contacts" ON public.company_contacts;

CREATE POLICY "Consultant can insert company contacts" ON public.company_contacts
    FOR INSERT
    WITH CHECK (public.get_my_role() = 'consultant');
