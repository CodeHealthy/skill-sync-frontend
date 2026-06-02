import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import RoleRoute from "./auth/RoleRoute";
import { ORG_STAFF_ROLES, PLATFORM_ADMIN_ROLES } from "./utils/roleUtils";

import Navbar from "./components/layout/Navbar";

import HomePage from "./pages/HomePage";
import PricingPage from "./pages/PricingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminDashboard from "./pages/AdminDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import CandidateDashboard from "./pages/CandidateDashboard";
import CandidateAssessmentSessionPage from "./pages/CandidateAssessmentSessionPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import NotFoundPage from "./pages/NotFoundPage";
import ProfilePage from "./pages/ProfilePage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AcceptInvitePage from "./pages/AcceptInvitePage";
import AcceptTeamInvitePage from "./pages/AcceptTeamInvitePage";
import OrganizationSetupPage from "./pages/OrganizationSetupPage";

import OAuthSuccessPage from "./pages/OAuthSuccessPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/accept-invite" element={<AcceptInvitePage />} />
          <Route path="/accept-team-invite" element={<AcceptTeamInvitePage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/organization-setup" element={<OrganizationSetupPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route element={<RoleRoute allowedRoles={PLATFORM_ADMIN_ROLES} />}>
              <Route path="/super-admin" element={<SuperAdminDashboard />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={ORG_STAFF_ROLES} />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={["CANDIDATE"]} />}>
              <Route path="/candidate" element={<CandidateDashboard />} />
              <Route path="/candidate/assessments/:assignmentId" element={<CandidateAssessmentSessionPage />} />
            </Route>
          </Route>

          <Route path="/oauth-success" element={<OAuthSuccessPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={3500}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
