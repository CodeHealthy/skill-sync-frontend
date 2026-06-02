import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { authApi } from "../api/authApi";
import { useAuth } from "../auth/AuthContext";
import { getApiErrorMessage } from "../utils/errorUtils";
import {
    getDashboardPathForRole,
    requiresOrganizationSetup,
} from "../utils/roleUtils";
import { showError, showSuccess, showWarning } from "../utils/toastUtils";

function OrganizationSetupPage() {
    const { user, updateAuthData } = useAuth();
    const navigate = useNavigate();
    const [organizationName, setOrganizationName] = useState("");
    const [submitting, setSubmitting] = useState(false);

    if (!requiresOrganizationSetup(user)) {
        return <Navigate to={getDashboardPathForRole(user?.role)} replace />;
    }

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (submitting) {
            return;
        }

        const normalizedName = organizationName.trim().replace(/\s+/g, " ");

        if (!normalizedName) {
            showWarning("Organization name is required.");
            return;
        }

        if (normalizedName.length > 120) {
            showWarning("Organization name must be 120 characters or fewer.");
            return;
        }

        setSubmitting(true);

        try {
            const response = await authApi.completeOrganizationSetup({
                organizationName: normalizedName,
            });
            const authData = response.data;

            updateAuthData(authData);
            showSuccess("Organization setup completed.");
            navigate(getDashboardPathForRole(authData.role), { replace: true });
        } catch (err) {
            showError(getApiErrorMessage(err, "Failed to set up organization."));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page-container">
            <div className="form-card">
                <h2>Set Up Your Organization</h2>
                <p>Add the organization your recruiting workspace belongs to.</p>

                <form onSubmit={handleSubmit}>
                    <label htmlFor="organization-setup-name">Organization Name</label>
                    <input
                        id="organization-setup-name"
                        name="organizationName"
                        type="text"
                        value={organizationName}
                        onChange={(event) => setOrganizationName(event.target.value)}
                        placeholder="Your organization name"
                        autoComplete="organization"
                        maxLength={120}
                        required
                    />

                    <button
                        type="submit"
                        className="primary-button"
                        disabled={submitting}
                    >
                        {submitting ? "Setting up..." : "Create Organization"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default OrganizationSetupPage;
