import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../api/authApi";
import { useAuth } from "../auth/AuthContext";
import { showError, showSuccess } from "../utils/toastUtils";
import { getDashboardPathForRole } from "../utils/roleUtils";

function OAuthSuccessPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { updateAuthData } = useAuth();

    useEffect(() => {
        const exchangeCode = searchParams.get("code");
        let cancelled = false;

        if (!exchangeCode) {
            showError("Google login failed. Please try again.");
            navigate("/login", { replace: true });
            return undefined;
        }

        const completeOAuthLogin = async () => {
            try {
                const response = await authApi.exchangeOAuthCode({
                    code: exchangeCode,
                });

                if (cancelled) {
                    return;
                }

                const authData = response.data;
                updateAuthData(authData);

                showSuccess("Logged in with Google.");
                navigate(getDashboardPathForRole(authData.role), { replace: true });
            } catch {
                if (!cancelled) {
                    showError("Google login failed. Please try again.");
                    navigate("/login", { replace: true });
                }
            }
        };

        completeOAuthLogin();

        return () => {
            cancelled = true;
        };
    }, [searchParams, navigate, updateAuthData]);

    return (
        <div className="page-container">
            <div className="form-card">
                <h2>Completing Google login...</h2>
                <p>Please wait while we sign you in.</p>
            </div>
        </div>
    );
}

export default OAuthSuccessPage;
