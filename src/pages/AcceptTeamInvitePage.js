import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../api/authApi";
import { useAuth } from "../auth/AuthContext";
import { getApiErrorMessage } from "../utils/errorUtils";
import { getPasswordChecks, isStrongPassword } from "../utils/passwordUtils";
import { showError, showSuccess, showWarning } from "../utils/toastUtils";
import { getDashboardPathForRole, getPostAuthPathForUser } from "../utils/roleUtils";
import { buildGoogleOAuthUrl, OAUTH_FLOWS } from "../utils/oauthUtils";

function AcceptTeamInvitePage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { isAuthenticated, updateAuthData, user } = useAuth();

    const token = searchParams.get("token");
    const name = searchParams.get("name") || "";
    const googleOAuthEnabled =
        process.env.REACT_APP_GOOGLE_OAUTH_ENABLED === "true";

    const [invite, setInvite] = useState(null);
    const [loadingInvite, setLoadingInvite] = useState(Boolean(token));
    const [inviteError, setInviteError] = useState(!token ? "Invite token is missing." : "");
    const [formData, setFormData] = useState({
        fullName: name,
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
                    flow: OAUTH_FLOWS.TEAM_INVITE,
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
                const response = await authApi.getTeamInvite({ token, name });

                if (!isMounted) {
                    return;
                }

                setInvite(response.data);
                setFormData((current) => ({
                    ...current,
                    fullName: response.data?.fullName || name || "",
                }));
            } catch (err) {
                if (!isMounted) {
                    return;
                }

                setInviteError(
                    getApiErrorMessage(err, "Team invite link is invalid or expired.")
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
    }, [token, name]);

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
            const response = await authApi.acceptTeamInvite({
                token,
                fullName: formData.fullName.trim(),
                password: formData.password,
            });

            updateAuthData(response.data);
            showSuccess("Team invite accepted. Welcome to SkillSync.");
            navigate(getDashboardPathForRole(response.data?.role), { replace: true });
        } catch (err) {
            showError(getApiErrorMessage(err, "Failed to accept team invite."));
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
        <div className="invite-page">
            <section className="invite-shell" aria-labelledby="team-invite-title">
                <div className="invite-context-panel">
                    <p className="eyebrow">Team workspace</p>
                    <h1>Join your hiring team.</h1>
                    <p>
                        Create your SkillSync account with the invited email address.
                        Your workspace role and organization access will be applied automatically.
                    </p>

                    <div className="invite-context-list" aria-label="Team invite benefits">
                        <span>Organization access included</span>
                        <span>Role-based workspace permissions</span>
                        <span>Secure team collaboration</span>
                    </div>
                </div>

                <div className="form-card invite-card">
                    <div className="invite-card-header">
                        <p className="eyebrow">SkillSync team invite</p>
                        <h2 id="team-invite-title">Accept your team invite</h2>
                        <p>Create your account to join your organization workspace.</p>
                    </div>

                {loadingInvite && <div className="info-box">Loading invite...</div>}

                {inviteError && (
                    <div className="error-box">
                        {inviteError} <Link to="/login">Go to login</Link>
                    </div>
                )}

                {invite && !inviteError && (
                    <>
                        <div className="invite-summary-card">
                            <span className="invite-summary-avatar" aria-hidden="true">
                                {(invite.organizationName || "SS").slice(0, 2).toUpperCase()}
                            </span>

                            <div className="invite-summary-content">
                                <span>Organization</span>
                                <strong>{invite.organizationName || "SkillSync"}</strong>
                                <p>{invite.email}</p>
                            </div>

                            <span className="invite-summary-status">
                                {invite.role || "Team"}
                            </span>
                        </div>

                        <div className="invite-auth-options">
                        {googleOAuthEnabled && (
                            <>
                                <button
                                    type="button"
                                    className="google-auth-button invite-google-button"
                                    onClick={handleGoogleInvite}
                                    disabled={loadingInvite || submitting}
                                >
                                    <span className="google-auth-icon" aria-hidden="true">
                                        <svg viewBox="0 0 24 24" width="20" height="20">
                                            <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.6-.2-2.3H12v4.4h5.9c-.3 1.4-1 2.5-2.1 3.3v2.7h3.4c2-1.8 3.4-4.5 3.4-8.1Z" />
                                            <path fill="#34A853" d="M12 23c2.9 0 5.3-1 7.1-2.7l-3.4-2.7c-.9.6-2.1 1-3.7 1-2.8 0-5.1-1.9-6-4.4H2.5V17c1.8 3.6 5.4 6 9.5 6Z" />
                                            <path fill="#FBBC05" d="M6 14.2c-.2-.6-.3-1.3-.3-2.2s.1-1.5.3-2.2V7H2.5C1.8 8.5 1.4 10.2 1.4 12s.4 3.5 1.1 5L6 14.2Z" />
                                            <path fill="#EA4335" d="M12 5.4c1.6 0 3 .5 4.1 1.6l3.1-3.1C17.3 2.1 14.9 1 12 1 7.9 1 4.3 3.4 2.5 7L6 9.8c.9-2.5 3.2-4.4 6-4.4Z" />
                                        </svg>
                                    </span>
                                    Continue with Google
                                </button>

                                <div className="auth-divider invite-divider">
                                    <span>or create a password</span>
                                </div>
                            </>
                        )}
                        </div>

                        <form className="invite-form" onSubmit={handleSubmit}>
                            <div className="invite-form-grid">
                                <div className="form-field">
                                    <label htmlFor="team-invite-organization">Organization</label>
                                    <input
                                        id="team-invite-organization"
                                        type="text"
                                        value={invite.organizationName || ""}
                                        readOnly
                                        aria-readonly="true"
                                    />
                                </div>

                                <div className="form-field">
                                    <label htmlFor="team-invite-role">Role</label>
                                    <input
                                        id="team-invite-role"
                                        type="text"
                                        value={invite.role || "Team member"}
                                        readOnly
                                        aria-readonly="true"
                                    />
                                </div>
                            </div>

                            <div className="invite-form-grid">
                                <div className="form-field">
                                    <label htmlFor="team-invite-full-name">Full Name</label>
                                    <input
                                        id="team-invite-full-name"
                                        name="fullName"
                                        type="text"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        placeholder="Your full name"
                                        autoComplete="name"
                                        required
                                    />
                                </div>

                                <div className="form-field">
                                    <label htmlFor="team-invite-email">Email</label>
                                    <input
                                        id="team-invite-email"
                                        type="email"
                                        value={invite.email || ""}
                                        readOnly
                                        aria-readonly="true"
                                    />
                                </div>
                            </div>

                            <div className="form-field">
                                <label htmlFor="team-invite-password">Password</label>
                                <input
                                    id="team-invite-password"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Create a strong password"
                                    autoComplete="new-password"
                                    required
                                />
                            </div>

                            <div className="password-checklist invite-password-checklist">
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

                            <div className="form-field">
                                <label htmlFor="team-invite-confirm-password">Confirm Password</label>
                                <input
                                    id="team-invite-confirm-password"
                                    name="confirmPassword"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Re-enter your password"
                                    autoComplete="new-password"
                                    required
                                />
                            </div>

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
                                className="primary-button invite-submit-button"
                                disabled={submitting}
                            >
                                {submitting ? "Accepting..." : "Accept Team Invite"}
                            </button>
                        </form>
                    </>
                )}
                </div>
            </section>
        </div>
    );
}

export default AcceptTeamInvitePage;
