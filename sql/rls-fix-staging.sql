-- Fix staging table access for PostgREST (anon + authenticated roles)
-- RLS policies alone are not enough — table-level GRANTs are also required
-- when the table was created via raw SQL instead of the Supabase dashboard.
-- Run in DBeaver

-- Step 1: Grant table-level permissions to both roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staging TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staging TO authenticated;

-- Step 2: Ensure RLS is enabled
ALTER TABLE public.staging ENABLE ROW LEVEL SECURITY;

-- Step 3: Add permissive policies for both roles
DROP POLICY IF EXISTS "staging_authenticated_all" ON public.staging;
CREATE POLICY "staging_authenticated_all"
  ON public.staging FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "staging_anon_all" ON public.staging;
CREATE POLICY "staging_anon_all"
  ON public.staging FOR ALL TO anon
  USING (true) WITH CHECK (true);

-- Also fix staging3 if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'staging3') THEN
        EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.staging3 TO anon';
        EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.staging3 TO authenticated';
        ALTER TABLE public.staging3 ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "staging3_authenticated_all" ON public.staging3;
        EXECUTE $p$CREATE POLICY staging3_authenticated_all ON public.staging3 FOR ALL TO authenticated USING (true) WITH CHECK (true)$p$;
        DROP POLICY IF EXISTS "staging3_anon_all" ON public.staging3;
        EXECUTE $p$CREATE POLICY staging3_anon_all ON public.staging3 FOR ALL TO anon USING (true) WITH CHECK (true)$p$;
    END IF;
END $$;

-- Verify grants
SELECT grantee, privilege_type FROM information_schema.role_table_grants
WHERE table_name IN ('staging','staging3') ORDER BY table_name, grantee;

-- Verify policies
SELECT tablename, policyname, cmd, roles FROM pg_policies WHERE tablename IN ('staging','staging3');
