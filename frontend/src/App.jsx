import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import JobsPage from "./pages/JobsPage";
import JobDetailPage from "./pages/JobDetailPage";
import JobFormPage from "./pages/JobFormPage";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import AuthPage from "./pages/AuthPage";
import CandidateApplicationsPage from "./pages/CandidateApplicationsPage";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<JobsPage />} />
        <Route path="/connexion" element={<AuthPage />} />
        <Route path="/offres/nouvelle" element={<ProtectedRoute role="recruiter"><JobFormPage /></ProtectedRoute>} />
        <Route path="/offres/:id" element={<JobDetailPage />} />
        <Route path="/offres/:id/modifier" element={<ProtectedRoute role="recruiter"><JobFormPage /></ProtectedRoute>} />
        <Route path="/recrutement" element={<ProtectedRoute role="recruiter"><RecruiterDashboard /></ProtectedRoute>} />
        <Route path="/mes-candidatures" element={<ProtectedRoute role="candidate"><CandidateApplicationsPage /></ProtectedRoute>} />
      </Routes>
    </>
  );
}
