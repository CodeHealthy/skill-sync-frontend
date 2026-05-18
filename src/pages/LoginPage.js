import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useEffect, useMemo, useRef, useState } from "react";
import { authApi } from "../api/authApi";
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
    const [resendingVerification, setResendingVerification] = useState(false);
    const [showResendVerification, setShowResendVerification] = useState(false);
    const [unverifiedEmail, setUnverifiedEmail] = useState("");
    const [resendCooldownSeconds, setResendCooldownSeconds] = useState(0);

    const registrationEmail = location.state?.registrationEmail;
    const registrationMessage = location.state?.registrationMessage;
    const registrationToastShownRef = useRef(false);

    useEffect(() => {
        const authMessage = sessionStorage.getItem("skillsync_auth_message");

        if (authMessage === "SESSION_EXPIRED") {
            showWarning("Session expired. Please log in again.");
            sessionStorage.removeItem("skillsync_auth_message");
        }

        if (registrationMessage && !registrationToastShownRef.current) {
            registrationToastShownRef.current = true;
            showSuccess(registrationMessage);

            navigate("/login", {
                replace: true,
                state: {
                    registrationEmail,
                },
            });
        }

        const oauthError = new URLSearchParams(location.search).get("oauthError");
        const oauthMessage = new URLSearchParams(location.search).get("message");

        if (oauthError === "true") {
            showError(oauthMessage || "Google login failed. Please try again.");
            navigate("/login", { replace: true });
        }
    }, [location.search, navigate, registrationMessage, registrationEmail]);

    useEffect(() => {
        if (resendCooldownSeconds <= 0) {
            return undefined;
        }

        const timer = setInterval(() => {
            setResendCooldownSeconds((current) => Math.max(current - 1, 0));
        }, 1000);

        return () => clearInterval(timer);
    }, [resendCooldownSeconds]);

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

        if (event.target.name === "email") {
            setShowResendVerification(false);
            setUnverifiedEmail("");
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (submitting) {
            return;
        }

        setSubmitting(true);
        setShowResendVerification(false);
        setUnverifiedEmail("");

        const loginEmail = formData.email.trim().toLowerCase();

        try {
            const authData = await login({
                email: loginEmail,
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
            const message = getApiErrorMessage(err, "Invalid email or password");

            showError(message);

            if (message.toLowerCase().includes("verify your email")) {
                setShowResendVerification(true);
                setUnverifiedEmail(loginEmail);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = googleOAuthUrl;
    };

    const handleResendVerification = async () => {
        if (resendCooldownSeconds > 0) {
            return;
        }

        const email = unverifiedEmail || formData.email.trim().toLowerCase();

        if (!email) {
            showWarning("Enter your email first.");
            return;
        }

        setResendingVerification(true);

        try {
            const response = await authApi.resendVerification({
                email,
            });

            setResendCooldownSeconds(60);
            showSuccess(response.data?.message || "Verification email sent.");
        } catch (err) {
            const message = getApiErrorMessage(
                err,
                "Failed to resend verification email"
            );

            showError(message);

            const match = message.match(/wait\s+(\d+)\s+seconds/i);

            if (match?.[1]) {
                setResendCooldownSeconds(Number(match[1]));
            }
        } finally {
            setResendingVerification(false);
        }
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

                    <div className="auth-helper-row single-link-row">
                        <Link to="/forgot-password">Forgot password?</Link>
                    </div>

                    {showResendVerification && (
                        <div className="verification-resend-panel">
                            <div className="verification-resend-content">
                                <span className="verification-resend-icon" aria-hidden="true">
                                    <svg viewBox="0 0 20 20" width="14" height="14">
                                        <path
                                            fill="currentColor"
                                            d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 3.5c.46 0 .82.36.82.82v4.36a.82.82 0 0 1-1.64 0V6.32c0-.46.36-.82.82-.82Zm0 9.1a1.05 1.05 0 1 1 0-2.1 1.05 1.05 0 0 1 0 2.1Z"
                                        />
                                    </svg>
                                </span>

                                <div>
                                    <p>Email verification required</p>
                                    <span>Verify your email to continue signing in.</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="verification-resend-button"
                                onClick={handleResendVerification}
                                disabled={resendingVerification || resendCooldownSeconds > 0}
                            >
                                {resendingVerification
                                    ? "Sending..."
                                    : resendCooldownSeconds > 0
                                        ? `Resend in ${resendCooldownSeconds}s`
                                        : "Resend email"}
                            </button>
                        </div>
                    )}

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