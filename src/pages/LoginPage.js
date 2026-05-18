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

        const oauthError = new URLSearchParams(location.search).get("oauthError");
        const oauthMessage = new URLSearchParams(location.search).get("message");

        if (oauthError === "true") {
            showError(oauthMessage || "Google login failed. Please try again.");
            navigate("/login", { replace: true });
        }
    }, [location.search, navigate]);

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
                                <span className="google-auth-icon" aria-hidden="true">
                                    <svg viewBox="0 0 48 48" width="20" height="20">
                                        <path
                                            fill="#EA4335"
                                            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                                        />
                                        <path
                                            fill="#4285F4"
                                            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                                        />
                                        <path
                                            fill="#FBBC05"
                                            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"
                                        />
                                        <path
                                            fill="#34A853"
                                            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                                        />
                                    </svg>
                                </span>
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