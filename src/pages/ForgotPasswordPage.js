import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../api/authApi";
import { getApiErrorMessage } from "../utils/errorUtils";
import { showError, showSuccess, showWarning } from "../utils/toastUtils";

function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (submitting) {
            return;
        }

        if (!email.trim()) {
            showWarning("Email is required.");
            return;
        }

        setSubmitting(true);

        try {
            const response = await authApi.forgotPassword({
                email: email.trim().toLowerCase(),
            });

            setSubmitted(true);
            showSuccess(
                response.data?.message ||
                "If an account exists for that email, a password reset link has been sent."
            );
        } catch (err) {
            showError(getApiErrorMessage(err, "Failed to request password reset"));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page-container">
            <div className="form-card">
                <h2>Forgot Password</h2>
                <p>
                    Enter your account email and we’ll send a password reset link if
                    the account exists.
                </p>

                <form onSubmit={handleSubmit}>
                    <label htmlFor="forgot-password-email">Email</label>
                    <input
                        id="forgot-password-email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="user@skillsync.com"
                        autoComplete="email"
                        required
                    />

                    <button
                        type="submit"
                        className="primary-button"
                        disabled={submitting}
                    >
                        {submitting ? "Sending..." : "Send Reset Link"}
                    </button>
                </form>

                {submitted && (
                    <div className="info-box auth-info-box">
                        Check your inbox for the reset link. It may take a few minutes.
                    </div>
                )}

                <p className="small-text">
                    Remember your password? <Link to="/login">Back to login</Link>
                </p>
            </div>
        </div>
    );
}

export default ForgotPasswordPage;
