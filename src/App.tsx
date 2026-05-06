import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import PublicLayout from "./components/PublicLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";
import Index from "./pages/Index";
import Services from "./pages/Services";
import ServiceDetailPage from "./pages/services/ServiceDetailPage";
import ComingSoon from "./pages/services/ComingSoon";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Education from "./pages/Education";
import HdiAlign from "./pages/HdiAlign";
import HdiOs from "./pages/HdiOs";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Disclaimer from "./pages/Disclaimer";
import Register from "./pages/Register";
import Login from "./pages/Login";
import VerifyEmail from "./pages/VerifyEmail";
import AuthCallback from "./pages/AuthCallback";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import SubmitCase from "./pages/SubmitCase";
import CasesList from "./pages/CasesList";
import CaseDetail from "./pages/CaseDetail";
import Profile from "./pages/Profile";
import ClientConsultations from "./pages/ClientConsultations";
import Feedback from "./pages/Feedback";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminCases from "./pages/admin/AdminCases";
import AdminCaseDetail from "./pages/admin/AdminCaseDetail";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminDesigners from "./pages/admin/AdminDesigners";
import AdminServices from "./pages/admin/AdminServices";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminSetup from "./pages/admin/AdminSetup";
import AdminConsultations from "./pages/admin/AdminConsultations";
import AdminAlignRequests from "./pages/admin/AdminAlignRequests";
import AdminOsEnquiries from "./pages/admin/AdminOsEnquiries";
import AdminFeedback from "./pages/admin/AdminFeedback";
import AdminFeedbackDetail from "./pages/admin/AdminFeedbackDetail";
import DesignerHome from "./pages/designer/DesignerHome";
import DesignerCaseWorkspace from "./pages/designer/DesignerCaseWorkspace";
import DesignerConsultations from "./pages/designer/DesignerConsultations";
import DesignerSignup from "./pages/DesignerSignup";
import AccountManagerOverview from "./pages/account-manager/AccountManagerOverview";
import AccountManagerClients from "./pages/account-manager/AccountManagerClients";
import AccountManagerCases from "./pages/account-manager/AccountManagerCases";
import AccountManagerConsultations from "./pages/account-manager/AccountManagerConsultations";
import AccountManagerPayments from "./pages/account-manager/AccountManagerPayments";
import SelectWorkspace from "./pages/SelectWorkspace";
import NoRole from "./pages/NoRole";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/services" element={<Services />} />
              <Route path="/services/aligner-design" element={<ServiceDetailPage slug="aligner-design" />} />
              <Route path="/services/surgical-guide" element={<ServiceDetailPage slug="surgical-guide" />} />
              <Route path="/services/crown-bridge" element={<ServiceDetailPage slug="crown-bridge" />} />
              <Route path="/services/cbct-reporting" element={<ServiceDetailPage slug="cbct-reporting" />} />
              <Route path="/services/medical-radiology" element={<ServiceDetailPage slug="medical-radiology" />} />
              <Route path="/services/coming-soon" element={<ComingSoon />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/education" element={<Education />} />
              <Route path="/hdi-align" element={<HdiAlign />} />
              <Route path="/hdi-os" element={<HdiOs />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/disclaimer" element={<Disclaimer />} />
            </Route>

            {/* Protected: require auth (client) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/submit" element={<SubmitCase />} />
              <Route path="/dashboard/cases" element={<CasesList />} />
              <Route path="/dashboard/cases/:id" element={<CaseDetail />} />
              <Route path="/dashboard/profile" element={<Profile />} />
              <Route path="/dashboard/consultations" element={<ClientConsultations />} />
            </Route>

            {/* Feedback page (any logged-in user; redirects to login if not) */}
            <Route path="/feedback" element={<Feedback />} />

            {/* Admin routes (admin + super_admin + account_manager) */}
            <Route element={<ProtectedRoute requiredRole="admin" />}>
              <Route path="/admin" element={<AdminOverview />} />
              <Route path="/admin/cases" element={<AdminCases />} />
              <Route path="/admin/cases/:id" element={<AdminCaseDetail />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/designers" element={<AdminDesigners />} />
              <Route path="/admin/services" element={<AdminServices />} />
              <Route path="/admin/payments" element={<AdminPayments />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/setup" element={<AdminSetup />} />
              <Route path="/admin/consultations" element={<AdminConsultations />} />
              <Route path="/admin/align-requests" element={<AdminAlignRequests />} />
              <Route path="/admin/os-enquiries" element={<AdminOsEnquiries />} />
              <Route path="/admin/feedback" element={<AdminFeedback />} />
              <Route path="/admin/feedback/:id" element={<AdminFeedbackDetail />} />
            </Route>

            {/* Account Manager routes */}
            <Route element={<ProtectedRoute requiredRole="account_manager" />}>
              <Route path="/account-manager" element={<AccountManagerOverview />} />
              <Route path="/account-manager/clients" element={<AccountManagerClients />} />
              <Route path="/account-manager/cases" element={<AccountManagerCases />} />
              <Route path="/account-manager/consultations" element={<AccountManagerConsultations />} />
              <Route path="/account-manager/payments" element={<AccountManagerPayments />} />
            </Route>

            {/* Designer routes */}
            <Route element={<ProtectedRoute requiredRole="designer" />}>
              <Route path="/designer" element={<DesignerHome />} />
              <Route path="/designer/cases/:id" element={<DesignerCaseWorkspace />} />
              <Route path="/designer/consultations" element={<DesignerConsultations />} />
            </Route>

            {/* Guest-only */}
            <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />

            {/* Public auth pages */}
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/designer-signup" element={<DesignerSignup />} />

            <Route path="/select-workspace" element={<SelectWorkspace />} />
            <Route path="/no-role" element={<NoRole />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
