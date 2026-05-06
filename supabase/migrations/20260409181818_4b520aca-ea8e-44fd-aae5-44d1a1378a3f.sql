
-- Enums
CREATE TYPE public.case_status AS ENUM (
  'draft','submitted','under_review','revision_requested',
  'in_design','design_review','awaiting_payment','paid','delivered'
);
CREATE TYPE public.delivery_type AS ENUM ('standard','rush');
CREATE TYPE public.payment_method AS ENUM ('card','bank_transfer');
CREATE TYPE public.payment_status AS ENUM ('pending','paid','refunded');
CREATE TYPE public.sender_role AS ENUM ('client','designer','admin');
CREATE TYPE public.app_role AS ENUM ('client','designer','admin');

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories readable by all" ON public.categories FOR SELECT USING (true);

-- Services
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id),
  price_usd NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Services readable by all" ON public.services FOR SELECT USING (true);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  clinic_name TEXT,
  country TEXT,
  specialty TEXT,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can read all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, clinic_name, country, specialty)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'clinic_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'country', ''),
    COALESCE(NEW.raw_user_meta_data->>'specialty', '')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'client');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Cases
CREATE TABLE public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id),
  service_code TEXT,
  patient_ref TEXT,
  clinical_notes TEXT,
  delivery_type delivery_type NOT NULL DEFAULT 'standard',
  consultation_requested BOOLEAN DEFAULT false,
  is_free_trial BOOLEAN DEFAULT false,
  status case_status NOT NULL DEFAULT 'draft',
  assigned_designer_id UUID REFERENCES auth.users(id),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ
);
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own cases" ON public.cases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own cases" ON public.cases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own draft cases" ON public.cases FOR UPDATE USING (auth.uid() = user_id AND status = 'draft');
CREATE POLICY "Admins can do anything with cases" ON public.cases FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Designers can read assigned cases" ON public.cases FOR SELECT USING (public.has_role(auth.uid(), 'designer') AND assigned_designer_id = auth.uid());
CREATE POLICY "Designers can update assigned cases" ON public.cases FOR UPDATE USING (public.has_role(auth.uid(), 'designer') AND assigned_designer_id = auth.uid());

-- Case files
CREATE TABLE public.case_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_label TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.case_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own case files" ON public.case_files FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.cases WHERE cases.id = case_files.case_id AND cases.user_id = auth.uid())
);
CREATE POLICY "Users can upload to own cases" ON public.case_files FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.cases WHERE cases.id = case_files.case_id AND cases.user_id = auth.uid())
);
CREATE POLICY "Admins can do anything with case files" ON public.case_files FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Designers can read assigned case files" ON public.case_files FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.cases WHERE cases.id = case_files.case_id AND cases.assigned_designer_id = auth.uid())
);

-- Case messages
CREATE TABLE public.case_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  sender_role sender_role NOT NULL DEFAULT 'client',
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.case_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own case messages" ON public.case_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.cases WHERE cases.id = case_messages.case_id AND cases.user_id = auth.uid())
);
CREATE POLICY "Users can send messages on own cases" ON public.case_messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.cases WHERE cases.id = case_messages.case_id AND cases.user_id = auth.uid())
);
CREATE POLICY "Admins can do anything with messages" ON public.case_messages FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Designers can read assigned case messages" ON public.case_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.cases WHERE cases.id = case_messages.case_id AND cases.assigned_designer_id = auth.uid())
);
CREATE POLICY "Designers can send messages on assigned cases" ON public.case_messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.cases WHERE cases.id = case_messages.case_id AND cases.assigned_designer_id = auth.uid())
);

-- Case designs
CREATE TABLE public.case_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.case_designs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own case designs" ON public.case_designs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.cases WHERE cases.id = case_designs.case_id AND cases.user_id = auth.uid())
);
CREATE POLICY "Admins can do anything with designs" ON public.case_designs FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Designers can manage assigned case designs" ON public.case_designs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.cases WHERE cases.id = case_designs.case_id AND cases.assigned_designer_id = auth.uid())
);

-- Payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount_usd NUMERIC(10,2) NOT NULL,
  method payment_method,
  status payment_status NOT NULL DEFAULT 'pending',
  stripe_session_id TEXT,
  paid_at TIMESTAMPTZ
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can do anything with payments" ON public.payments FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Free trials
CREATE TABLE public.free_trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_category TEXT NOT NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, service_category)
);
ALTER TABLE public.free_trials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own free trials" ON public.free_trials FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can use free trials" ON public.free_trials FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_cases_updated_at
  BEFORE UPDATE ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
