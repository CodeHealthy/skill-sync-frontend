import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "../utils/errorUtils";
import { showError, showSuccess, showWarning } from "../utils/toastUtils";

function LoginPage() {
    const { login, isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const googleOAuthEnabled =
        process.env.REACT_APP_GOOGLE_OAUTH_ENABLED === "true";

    const googleOAuthUrl = useMemo(() => {
        const apiBaseUrl =
            process.env.REACT_APP_API_BASE_URL || "http://localhost:8080/api";

        return `${apiBaseUrl.replace(/\/api\/?$/, "")}/oauth2/authorization/google`;
    }, []);

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const authMessage = sessionStorage.getItem("skillsync_auth_message");

        if (authMessage === "SESSION_EXPIRED") {
            showWarning("Session expired. Please log in again.");
            sessionStorage.removeItem("skillsync_auth_message");
        }
    }, []);

    if (isAuthenticated) {
        if (user?.role === "ADMIN") {
            return <Navigate to="/admin" replace />;
        }

        if (user?.role === "CANDIDATE") {
            return <Navigate to="/candidate" replace />;
        }

        return <Navigate to="/" replace />;
    }

    const handleChange = (event) => {
        setFormData((current) => ({
            ...current,
            [event.target.name]: event.target.value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (submitting) {
            return;
        }

        setSubmitting(true);

        try {
            const authData = await login({
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
            });

            showSuccess("Logged in successfully.");

            const redirectedFrom = location.state?.from?.pathname;

            if (redirectedFrom) {
                navigate(redirectedFrom, { replace: true });
                return;
            }

            if (authData.role === "ADMIN") {
                navigate("/admin", { replace: true });
            } else {
                navigate("/candidate", { replace: true });
            }
        } catch (err) {
            showError(getApiErrorMessage(err, "Invalid email or password"));
        } finally {
            setSubmitting(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = googleOAuthUrl;
    };

    return (
        <div className="page-container">
            <div className="form-card">
                <h2>Login</h2>
                <p>Use your SkillSync account to continue.</p>

                <form onSubmit={handleSubmit}>
                    <label>Email</label>
                    <input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="admin@skillsync.com"
                        autoComplete="email"
                        required
                    />

                    <label>Password</label>
                    <input
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        required
                    />

                    <button
                        type="submit"
                        className="primary-button"
                        disabled={submitting}
                    >
                        {submitting ? "Logging in..." : "Login"}
                    </button>

                    {googleOAuthEnabled && (
                        <>
                            <div className="auth-divider">
                                <span>or</span>
                            </div>

                            <button
                                type="button"
                                className="google-auth-button"
                                onClick={handleGoogleLogin}
                                disabled={submitting}
                            >
                                <span className="google-auth-icon">G</span>
                                Continue with Google
                            </button>
                        </>
                    )}
                </form>

                <p className="small-text">
                    No account? <Link to="/register">Register here</Link>
                </p>
            </div>
        </div>
    );
}

export default LoginPage;