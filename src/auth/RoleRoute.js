import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { ORG_STAFF_ROLES, requiresOrganizationSetup } from "../utils/roleUtils";

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

    if (
        ORG_STAFF_ROLES.includes(user.role) &&
        requiresOrganizationSetup(user)
    ) {
        return <Navigate to="/organization-setup" replace />;
    }

    return <Outlet />;
}

export default RoleRoute;
