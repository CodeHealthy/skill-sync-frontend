import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

function Navbar() {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    const dashboardPath = user?.role === "ADMIN" ? "/admin" : "/candidate";
    const dashboardLabel =
        user?.role === "ADMIN" ? "Admin Dashboard" : "Candidate Portal";

    const closeMenu = () => {
        setMenuOpen(false);
    };

    const handleLogout = () => {
        logout();
        closeMenu();
        navigate("/login");
    };

    return (
        <nav className="navbar">
            <div className="navbar-top-row">
                <Link to="/" className="navbar-brand" onClick={closeMenu}>
                    <img src="/logo-white.svg" alt="SkillSync" className="navbar-logo-image" />
                </Link>

                <button
                    type="button"
                    className={menuOpen ? "navbar-menu-button active" : "navbar-menu-button"}
                    onClick={() => setMenuOpen((current) => !current)}
                    aria-label="Toggle navigation menu"
                    aria-expanded={menuOpen}
                >
                    <span />
                    <span />
                    <span />
                </button>
            </div>

            <div className={menuOpen ? "navbar-menu open" : "navbar-menu"}>
                <div className="navbar-center">
                    <NavLink to="/" className="navbar-link" onClick={closeMenu}>
                        Home
                    </NavLink>

                    {!isAuthenticated && (
                        <>
                            <a href="/#features" className="navbar-link" onClick={closeMenu}>
                                Features
                            </a>
                            <a href="/#recruiters" className="navbar-link" onClick={closeMenu}>
                                Recruiters
                            </a>
                            <a href="/#candidates" className="navbar-link" onClick={closeMenu}>
                                Candidates
                            </a>
                        </>
                    )}

                    {isAuthenticated && (
                        <>
                            <NavLink
                                to={dashboardPath}
                                className="navbar-link"
                                onClick={closeMenu}
                            >
                                {dashboardLabel}
                            </NavLink>
                            <NavLink to="/profile" className="navbar-link" onClick={closeMenu}>
                                Profile
                            </NavLink>
                        </>
                    )}
                </div>

                <div className="navbar-actions">
                    {!isAuthenticated && (
                        <>
                            <Link
                                to="/login"
                                className="navbar-login-link"
                                onClick={closeMenu}
                            >
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="navbar-cta"
                                onClick={closeMenu}
                            >
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
            </div>
        </nav>
    );
}

export default Navbar;