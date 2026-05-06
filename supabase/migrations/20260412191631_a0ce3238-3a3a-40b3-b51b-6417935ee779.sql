
-- Create account_manager_assignments table
CREATE TABLE public.account_manager_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_manager_id uuid NOT NULL,
  client_id uuid NOT NULL UNIQUE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by uuid NOT NULL
);

ALTER TABLE public.account_manager_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and super_admins full access on assignments"
  ON public.account_manager_assignments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Account managers read own assignments"
  ON public.account_manager_assignments FOR SELECT TO authenticated
  USING (account_manager_id = auth.uid());

-- Create designer_invitations table
CREATE TABLE public.designer_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text NOT NULL,
  invited_by uuid NOT NULL,
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz
);

ALTER TABLE public.designer_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and super_admins full access on invitations"
  ON public.designer_invitations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Anyone can read invitations by token for signup"
  ON public.designer_invitations FOR SELECT TO anon, authenticated
  USING (true);

-- Helper function: check if user is account manager for a client
CREATE OR REPLACE FUNCTION public.is_account_manager_for(_user_id uuid, _client_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.account_manager_assignments
    WHERE account_manager_id = _user_id AND client_id = _client_id
  )
$$;

-- Helper function: get all managed client IDs
CREATE OR REPLACE FUNCTION public.get_managed_client_ids(_manager_id uuid)
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT client_id FROM public.account_manager_assignments
  WHERE account_manager_id = _manager_id
$$;

-- Update RLS on cases for account managers
CREATE POLICY "Account managers can read managed client cases"
  ON public.cases FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'account_manager') AND user_id IN (SELECT public.get_managed_client_ids(auth.uid())));

CREATE POLICY "Account managers can update managed client cases"
  ON public.cases FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'account_manager') AND user_id IN (SELECT public.get_managed_client_ids(auth.uid())));

-- Account manager RLS on case_messages
CREATE POLICY "Account managers can read managed case messages"
  ON public.case_messages FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'account_manager') AND EXISTS (
    SELECT 1 FROM cases WHERE cases.id = case_messages.case_id
    AND cases.user_id IN (SELECT public.get_managed_client_ids(auth.uid()))
  ));

CREATE POLICY "Account managers can send messages on managed cases"
  ON public.case_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND public.has_role(auth.uid(), 'account_manager') AND EXISTS (
    SELECT 1 FROM cases WHERE cases.id = case_messages.case_id
    AND cases.user_id IN (SELECT public.get_managed_client_ids(auth.uid()))
  ));

-- Account manager RLS on case_files
CREATE POLICY "Account managers can read managed case files"
  ON public.case_files FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'account_manager') AND EXISTS (
    SELECT 1 FROM cases WHERE cases.id = case_files.case_id
    AND cases.user_id IN (SELECT public.get_managed_client_ids(auth.uid()))
  ));

-- Account manager RLS on payments
CREATE POLICY "Account managers can read managed client payments"
  ON public.payments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'account_manager') AND user_id IN (SELECT public.get_managed_client_ids(auth.uid())));

CREATE POLICY "Account managers can update managed client payments"
  ON public.payments FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'account_manager') AND user_id IN (SELECT public.get_managed_client_ids(auth.uid())));

-- Account manager RLS on consultations
CREATE POLICY "Account managers can read managed client consultations"
  ON public.consultations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'account_manager') AND user_id IN (SELECT public.get_managed_client_ids(auth.uid())));

CREATE POLICY "Account managers can update managed client consultations"
  ON public.consultations FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'account_manager') AND user_id IN (SELECT public.get_managed_client_ids(auth.uid())));

-- Account manager RLS on profiles (read managed clients)
CREATE POLICY "Account managers can read managed client profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'account_manager') AND id IN (SELECT public.get_managed_client_ids(auth.uid())));

-- Account manager RLS on additional_data_requests
CREATE POLICY "Account managers can manage additional data for managed cases"
  ON public.additional_data_requests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'account_manager') AND EXISTS (
    SELECT 1 FROM cases WHERE cases.id = additional_data_requests.case_id
    AND cases.user_id IN (SELECT public.get_managed_client_ids(auth.uid()))
  ));

-- Account manager RLS on case_designs
CREATE POLICY "Account managers can read managed case designs"
  ON public.case_designs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'account_manager') AND EXISTS (
    SELECT 1 FROM cases WHERE cases.id = case_designs.case_id
    AND cases.user_id IN (SELECT public.get_managed_client_ids(auth.uid()))
  ));

-- Account manager RLS on case_status_history
CREATE POLICY "Account managers can read managed case history"
  ON public.case_status_history FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'account_manager') AND EXISTS (
    SELECT 1 FROM cases WHERE cases.id = case_status_history.case_id
    AND cases.user_id IN (SELECT public.get_managed_client_ids(auth.uid()))
  ));

-- Super admin full access (same as admin) on all relevant tables
CREATE POLICY "Super admins full access cases" ON public.cases FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins full access case_messages" ON public.case_messages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins full access case_files" ON public.case_files FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins full access payments" ON public.payments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins full access consultations" ON public.consultations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins full access profiles" ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins full access additional_data" ON public.additional_data_requests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins full access case_designs" ON public.case_designs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins full access case_status_history" ON public.case_status_history FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins full access bank_settings" ON public.bank_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins manage categories" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins manage services" ON public.services FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins manage user_roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
