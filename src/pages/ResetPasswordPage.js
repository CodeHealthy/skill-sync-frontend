import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../api/authApi";
import { getApiErrorMessage } from "../utils/errorUtils";
import { getPasswordChecks, isStrongPassword } from "../utils/passwordUtils";
import { showError, showSuccess, showWarning } from "../utils/toastUtils";

function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token = searchParams.get("token");

    const [formData, setFormData] = useState({
        newPassword: "",
        confirmNewPassword: "",
    });

    const [submitting, setSubmitting] = useState(false);

    const passwordChecks = useMemo(
        () => getPasswordChecks(formData.newPassword),
        [formData.newPassword]
    );

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
            showError("Reset token is missing.");
            return;
        }

        if (!isStrongPassword(formData.newPassword)) {
            showWarning(
                "New password must include 10+ characters, uppercase, lowercase, number, and special character."
            );
            return;
        }

        if (formData.newPassword !== formData.confirmNewPassword) {
            showWarning("New passwords do not match.");
            return;
        }

        setSubmitting(true);

        try {
            const response = await authApi.resetPassword({
                token,
                newPassword: formData.newPassword,
            });

            showSuccess(
                response.data?.message ||
                "Password reset successfully. You can now log in."
            );

            navigate("/login", { replace: true });
        } catch (err) {
            showError(getApiErrorMessage(err, "Failed to reset password"));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page-container">
            <div className="form-card">
                <h2>Reset Password</h2>
                <p>Choose a new strong password for your SkillSync account.</p>

                {!token && (
                    <div className="error-box">
                        Reset token is missing. Please request a new reset link.
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <label>New Password</label>
                    <input
                        name="newPassword"
                        type="password"
                        value={formData.newPassword}
                        onChange={handleChange}
                        placeholder="Create a new strong password"
                        autoComplete="new-password"
                        required
                        disabled={!token}
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
                                <span>{check.passed ? "✓" : "•"}</span>
                                {check.label}
                            </div>
                        ))}
                    </div>

                    <label>Confirm New Password</label>
                    <input
                        name="confirmNewPassword"
                        type="password"
                        value={formData.confirmNewPassword}
                        onChange={handleChange}
                        placeholder="Re-enter your new password"
                        autoComplete="new-password"
                        required
                        disabled={!token}
                    />

                    {formData.confirmNewPassword && (
                        <p
                            className={
                                formData.newPassword === formData.confirmNewPassword
                                    ? "field-hint success-hint"
                                    : "field-hint error-hint"
                            }
                        >
                            {formData.newPassword === formData.confirmNewPassword
                                ? "Passwords match."
                                : "Passwords do not match."}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="primary-button"
                        disabled={submitting || !token}
                    >
                        {submitting ? "Resetting..." : "Reset Password"}
                    </button>
                </form>

                <p className="small-text">
                    Need a new link? <Link to="/forgot-password">Request reset link</Link>
                </p>
            </div>
        </div>
    );
}

export default ResetPasswordPage;