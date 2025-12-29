
-- Policy: Consultant can delete position candidates
-- Only for positions they are assigned to.

DROP POLICY IF EXISTS "Consultant can delete position candidates" ON public.position_candidates;

CREATE POLICY "Consultant can delete position candidates" ON public.position_candidates
    FOR DELETE
    USING (
        public.get_my_role() = 'consultant' AND
        EXISTS (
            SELECT 1 FROM public.job_positions jp
            WHERE jp.id = position_candidates.position_id
            AND jp.assigned_consultant_id = auth.uid()
        )
    );
