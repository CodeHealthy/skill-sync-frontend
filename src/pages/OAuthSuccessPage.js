import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { showError, showSuccess } from "../utils/toastUtils";

function OAuthSuccessPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get("token");
        const userId = searchParams.get("userId");
        const fullName = searchParams.get("fullName");
        const email = searchParams.get("email");
        const role = searchParams.get("role");

        if (!token || !userId || !email || !role) {
            showError("Google login failed. Please try again.");
            navigate("/login", { replace: true });
            return;
        }

        const user = {
            userId,
            fullName: fullName || email,
            email,
            role,
        };

        localStorage.setItem("skillsync_token", token);
        localStorage.setItem("skillsync_user", JSON.stringify(user));

        showSuccess("Logged in with Google.");

        if (role === "ADMIN") {
            navigate("/admin", { replace: true });
        } else {
            navigate("/candidate", { replace: true });
        }
    }, [searchParams, navigate]);

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