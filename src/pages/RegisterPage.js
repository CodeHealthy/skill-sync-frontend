import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function RegisterPage() {
    const { register, isAuthenticated, user } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        role: "CANDIDATE",
    });

    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

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
        setError("");
        setSubmitting(true);

        try {
            const authData = await register(formData);

            if (authData.role === "ADMIN") {
                navigate("/admin", { replace: true });
            } else {
                navigate("/candidate", { replace: true });
            }
        } catch (err) {
            const message =
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Registration failed";

            setError(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page-container">
            <div className="form-card">
                <h2>Register</h2>
                <p>Create a recruiter or candidate account.</p>

                {error && <div className="error-box">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <label>Full Name</label>
                    <input
                        name="fullName"
                        type="text"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="Muhammad Yeshar"
                        required
                    />

                    <label>Email</label>
                    <input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="user@skillsync.com"
                        required
                    />

                    <label>Password</label>
                    <input
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Minimum 6 characters"
                        required
                    />

                    <label>Role</label>
                    <select name="role" value={formData.role} onChange={handleChange}>
                        <option value="CANDIDATE">Candidate</option>
                        <option value="ADMIN">Admin / Recruiter</option>
                    </select>

                    <button type="submit" className="primary-button" disabled={submitting}>
                        {submitting ? "Creating account..." : "Create Account"}
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