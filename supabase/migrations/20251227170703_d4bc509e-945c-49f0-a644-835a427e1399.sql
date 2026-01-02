-- Allow approved users to read basic info (full_name, email) of all profiles for display purposes
DROP POLICY IF EXISTS "Approved users can read all profiles names" ON public.profiles;
CREATE POLICY "Approved users can read all profiles names" 
ON public.profiles 
FOR SELECT 
USING (is_user_approved(auth.uid()));