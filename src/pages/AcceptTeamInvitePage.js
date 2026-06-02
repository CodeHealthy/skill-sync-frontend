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
        <div className="page-container">
            <div className="form-card">
                <h2>Accept Team Invite</h2>
                <p>Create your account to join your organization workspace.</p>

                {loadingInvite && <div className="info-box">Loading invite...</div>}

                {inviteError && (
                    <div className="error-box">
                        {inviteError} <Link to="/login">Go to login</Link>
                    </div>
                )}

                {invite && !inviteError && (
                    <>
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
                        <label htmlFor="team-invite-organization">Organization</label>
                        <input
                            id="team-invite-organization"
                            type="text"
                            value={invite.organizationName || ""}
                            readOnly
                            aria-readonly="true"
                        />

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

                        <label htmlFor="team-invite-email">Email</label>
                        <input
                            id="team-invite-email"
                            type="email"
                            value={invite.email || ""}
                            readOnly
                            aria-readonly="true"
                        />

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

                        <button
                            type="submit"
                            className="primary-button"
                            disabled={submitting}
                        >
                            {submitting ? "Accepting..." : "Accept Team Invite"}
                        </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

export default AcceptTeamInvitePage;
