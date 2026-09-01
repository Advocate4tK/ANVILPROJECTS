-- RLS Fix: public.error_log
-- Safe to run — error_log is write-only logging, not read by any app page
-- Step 1: Enable RLS on the table
ALTER TABLE public.error_log ENABLE ROW LEVEL SECURITY;

-- Step 2: Allow anon to INSERT (so the app can still log errors)
CREATE POLICY "error_log_anon_insert"
  ON public.error_log
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Step 3: Allow service_role full access (for DBeaver/admin queries)
CREATE POLICY "error_log_service_all"
  ON public.error_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Verify: run this after to confirm policies are in place
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'error_log';
-- SELECT * FROM pg_policies WHERE tablename = 'error_log';
