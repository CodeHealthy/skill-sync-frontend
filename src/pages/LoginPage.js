import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function LoginPage() {
    const { login, isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [formData, setFormData] = useState({
        email: "admin@skillsync.com",
        password: "password123",
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
            const authData = await login(formData);

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
            const message =
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Invalid email or password";

            setError(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page-container">
            <div className="form-card">
                <h2>Login</h2>
                <p>Use your SkillSync account to continue.</p>

                {error && <div className="error-box">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <label>Email</label>
                    <input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="admin@skillsync.com"
                        required
                    />

                    <label>Password</label>
                    <input
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="password123"
                        required
                    />

                    <button type="submit" className="primary-button" disabled={submitting}>
                        {submitting ? "Logging in..." : "Login"}
                    </button>
                </form>

                <p className="small-text">
                    No account? <Link to="/register">Register here</Link>
                </p>
            </div>
        </div>
    );
}

export default LoginPage;