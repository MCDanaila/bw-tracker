-- P2-T03: Add created_by and updated_at columns to foods

ALTER TABLE foods
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Coach-specific RLS policy: coaches can manage foods
-- (existing "Foods are viewable by everyone" SELECT policy remains)
CREATE POLICY "Coaches can manage foods"
  ON foods FOR ALL
  USING (public.get_my_role() = 'coach')
  WITH CHECK (public.get_my_role() = 'coach');
