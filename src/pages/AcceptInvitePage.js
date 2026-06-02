import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../api/authApi";
import { useAuth } from "../auth/AuthContext";
import { getApiErrorMessage } from "../utils/errorUtils";
import { getPasswordChecks, isStrongPassword } from "../utils/passwordUtils";
import { showError, showSuccess, showWarning } from "../utils/toastUtils";
import { getPostAuthPathForUser } from "../utils/roleUtils";
import { buildGoogleOAuthUrl, OAUTH_FLOWS } from "../utils/oauthUtils";

function AcceptInvitePage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { isAuthenticated, updateAuthData, user } = useAuth();

    const token = searchParams.get("token");
    const googleOAuthEnabled =
        process.env.REACT_APP_GOOGLE_OAUTH_ENABLED === "true";

    const [invite, setInvite] = useState(null);
    const [loadingInvite, setLoadingInvite] = useState(Boolean(token));
    const [inviteError, setInviteError] = useState(!token ? "Invite token is missing." : "");
    const [formData, setFormData] = useState({
        fullName: "",
        password: "",
        confirmPassword: "",
    });
    const [submitting, setSubmitting] = useState(false);

    const passwordChecks = useMemo(
        () => getPasswordChecks(formData.password),
        [formData.password]
    );
    const googleOAuthUrl = useMemo(
        () =>
            token
                ? buildGoogleOAuthUrl({
                    flow: OAUTH_FLOWS.CANDIDATE_INVITE,
                    inviteToken: token,
                })
                : "",
        [token]
    );

    useEffect(() => {
        if (!token) {
            return;
        }

        let isMounted = true;

        const loadInvite = async () => {
            setLoadingInvite(true);
            setInviteError("");

            try {
                const response = await authApi.getInvite(token);

                if (!isMounted) {
                    return;
                }

                setInvite(response.data);
                setFormData((current) => ({
                    ...current,
                    fullName: response.data?.fullName || "",
                }));
            } catch (err) {
                if (!isMounted) {
                    return;
                }

                setInviteError(
                    getApiErrorMessage(err, "Invite link is invalid or expired.")
                );
            } finally {
                if (isMounted) {
                    setLoadingInvite(false);
                }
            }
        };

        loadInvite();

        return () => {
            isMounted = false;
        };
    }, [token]);

    if (isAuthenticated) {
        return <Navigate to={getPostAuthPathForUser(user)} replace />;
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

        if (!token) {
            showError("Invite token is missing.");
            return;
        }

        if (!formData.fullName.trim()) {
            showWarning("Enter your full name.");
            return;
        }

        if (!isStrongPassword(formData.password)) {
            showWarning(
                "Password must include 10+ characters, uppercase, lowercase, number, and special character."
            );
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            showWarning("Passwords do not match.");
            return;
        }

        setSubmitting(true);

        try {
            const response = await authApi.acceptInvite({
                token,
                fullName: formData.fullName.trim(),
                password: formData.password,
            });

            updateAuthData(response.data);
            showSuccess("Invite accepted. Welcome to SkillSync.");
            navigate("/candidate", { replace: true });
        } catch (err) {
            showError(getApiErrorMessage(err, "Failed to accept invite."));
        } finally {
            setSubmitting(false);
        }
    };

    const handleGoogleInvite = () => {
        if (!googleOAuthUrl) {
            showError("Invite token is missing.");
            return;
        }

        window.location.href = googleOAuthUrl;
    };

    return (
        <div className="page-container">
            <div className="form-card">
                <h2>Accept Invite</h2>
                <p>Create your candidate account to continue to your assessment.</p>

                {loadingInvite && <div className="info-box">Loading invite...</div>}

                {inviteError && (
                    <div className="error-box">
                        {inviteError} <Link to="/login">Go to login</Link>
                    </div>
                )}

                {invite && !inviteError && (
                    <>
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
                                    <p>{invite.organizationName || "SkillSync"} invite</p>
                                    <span>{invite.email}</span>
                                </div>
                            </div>
                        </div>

                        {googleOAuthEnabled && (
                            <>
                                <button
                                    type="button"
                                    className="google-auth-button"
                                    onClick={handleGoogleInvite}
                                    disabled={loadingInvite || submitting}
                                >
                                    Continue with Google
                                </button>

                                <div className="auth-divider">
                                    <span>or use email</span>
                                </div>
                            </>
                        )}

                        <form onSubmit={handleSubmit}>
                            <label htmlFor="candidate-invite-full-name">Full Name</label>
                            <input
                                id="candidate-invite-full-name"
                                name="fullName"
                                type="text"
                                value={formData.fullName}
                                onChange={handleChange}
                                placeholder="Your full name"
                                autoComplete="name"
                                required
                            />

                            <label htmlFor="candidate-invite-email">Email</label>
                            <input
                                id="candidate-invite-email"
                                type="email"
                                value={invite.email || ""}
                                readOnly
                                aria-readonly="true"
                            />

                            <label htmlFor="candidate-invite-password">Password</label>
                            <input
                                id="candidate-invite-password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Create a strong password"
                                autoComplete="new-password"
                                required
                            />

                            <div className="password-checklist">
                                {passwordChecks.map((check) => (
                                    <div
                                        key={check.key}
                                        className={
                                            check.passed
                                                ? "password-check passed"
                                                : "password-check"
                                        }
                                    >
                                        <span>{check.passed ? "OK" : "-"}</span>
                                        {check.label}
                                    </div>
                                ))}
                            </div>

                            <label htmlFor="candidate-invite-confirm-password">Confirm Password</label>
                            <input
                                id="candidate-invite-confirm-password"
                                name="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Re-enter your password"
                                autoComplete="new-password"
                                required
                            />

                            {formData.confirmPassword && (
                                <p
                                    className={
                                        formData.password === formData.confirmPassword
                                            ? "field-hint success-hint"
                                            : "field-hint error-hint"
                                    }
                                >
                                    {formData.password === formData.confirmPassword
                                        ? "Passwords match."
                                        : "Passwords do not match."}
                                </p>
                            )}

                            <button
                                type="submit"
                                className="primary-button"
                                disabled={submitting}
                            >
                                {submitting ? "Accepting..." : "Accept Invite"}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

export default AcceptInvitePage;
