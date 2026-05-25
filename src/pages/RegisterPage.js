import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getApiErrorMessage } from "../utils/errorUtils";
import { getPasswordChecks, isStrongPassword } from "../utils/passwordUtils";
import { showError, showWarning } from "../utils/toastUtils";
import { getDashboardPathForRole } from "../utils/roleUtils";

function RegisterPage() {
    const { register, isAuthenticated, user } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        organizationName: "",
    });

    const [submitting, setSubmitting] = useState(false);

    const passwordChecks = useMemo(
        () => getPasswordChecks(formData.password),
        [formData.password]
    );

    if (isAuthenticated) {
        return <Navigate to={getDashboardPathForRole(user?.role)} replace />;
    }

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const validateForm = () => {
        if (!formData.fullName.trim()) {
            showWarning("Full name is required.");
            return false;
        }

        if (!formData.email.trim()) {
            showWarning("Email is required.");
            return false;
        }

        if (!formData.organizationName.trim()) {
            showWarning("Organization name is required for employer registration.");
            return false;
        }

        if (!isStrongPassword(formData.password)) {
            showWarning(
                "Password must include 10+ characters, uppercase, lowercase, number, and special character."
            );
            return false;
        }

        if (formData.password !== formData.confirmPassword) {
            showWarning("Passwords do not match.");
            return false;
        }

        return true;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (submitting) {
            return;
        }

        if (!validateForm()) {
            return;
        }

        setSubmitting(true);

        const payload = {
            fullName: formData.fullName.trim(),
            email: formData.email.trim().toLowerCase(),
            password: formData.password,
            role: "ORG_ADMIN",
            organizationName: formData.organizationName.trim(),
        };

        try {
            const response = await register(payload);

            navigate("/login", {
                replace: true,
                state: {
                    registrationEmail: payload.email,
                    registrationMessage:
                        response?.message ||
                        "Account created. Please check your email to verify your account.",
                },
            });
        } catch (err) {
            showError(getApiErrorMessage(err, "Registration failed"));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page-container">
            <div className="form-card">
                <h2>Create Employer Account</h2>
                <p>Set up your organization to create assessments and invite candidates.</p>

                <form onSubmit={handleSubmit}>
                    <label>Full Name</label>
                    <input
                        name="fullName"
                        type="text"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="Your full name"
                        autoComplete="name"
                        required
                    />

                    <label>Work Email</label>
                    <input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@company.com"
                        autoComplete="email"
                        required
                    />

                    <label>Organization Name</label>
                    <input
                        name="organizationName"
                        type="text"
                        value={formData.organizationName}
                        onChange={handleChange}
                        placeholder="Your organization name"
                        autoComplete="organization"
                        required
                    />

                    <label>Password</label>
                    <input
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

                    <label>Confirm Password</label>
                    <input
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
                        {submitting ? "Creating account..." : "Create Employer Account"}
                    </button>
                </form>

                <p className="small-text">
                    Already have an account? <Link to="/login">Login here</Link>
                </p>
            </div>
        </div>
    );
}

export default RegisterPage;
