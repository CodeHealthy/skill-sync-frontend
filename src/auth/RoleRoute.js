import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

function RoleRoute({ allowedRoles }) {
    const { user, authLoading, isAuthenticated } = useAuth();

    if (authLoading) {
        return <div className="page-container">Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
}

export default RoleRoute;