import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

function Navbar() {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    const dashboardPath = user?.role === "ADMIN" ? "/admin" : "/candidate";
    const dashboardLabel =
        user?.role === "ADMIN" ? "Admin Dashboard" : "Candidate Portal";

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <nav className="navbar">
            <Link to="/" className="navbar-brand">
                <span className="navbar-logo-mark">S</span>
                <span>SkillSync</span>
            </Link>

            <div className="navbar-center">
                <NavLink to="/" className="navbar-link">
                    Home
                </NavLink>

                {!isAuthenticated && (
                    <>
                        <a href="/#features" className="navbar-link">
                            Features
                        </a>
                        <a href="/#recruiters" className="navbar-link">
                            Recruiters
                        </a>
                        <a href="/#candidates" className="navbar-link">
                            Candidates
                        </a>
                    </>
                )}

                {isAuthenticated && (
                    <NavLink to={dashboardPath} className="navbar-link">
                        {dashboardLabel}
                    </NavLink>
                )}
            </div>

            <div className="navbar-actions">
                {!isAuthenticated && (
                    <>
                        <Link to="/login" className="navbar-login-link">
                            Login
                        </Link>
                        <Link to="/register" className="navbar-cta">
                            Get Started
                        </Link>
                    </>
                )}

                {isAuthenticated && (
                    <>
                        <div className="navbar-user-pill">
                            <span className="navbar-avatar">
                                {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
                            </span>
                            <span>
                                {user?.fullName}
                                <small>{user?.role}</small>
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="navbar-logout-button"
                        >
                            Logout
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
}

export default Navbar;