import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

function ProtectedRoute() {
    const { isAuthenticated, authLoading } = useAuth();
    const location = useLocation();

    if (authLoading) {
        return <div className="page-container">Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return <Outlet />;
}

export default ProtectedRoute;