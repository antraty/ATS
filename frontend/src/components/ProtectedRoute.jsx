import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function ProtectedRoute({ role, children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/connexion" state={{ from: location.pathname }} replace />;
  if (role && user.role !== role) return <Navigate to={user.role === "recruiter" ? "/recrutement" : "/mes-candidatures"} replace />;
  return children;
}