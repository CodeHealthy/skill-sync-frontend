import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import {
    getPostAuthPathForUser,
    isOrgStaffRole,
    isPlatformAdminRole,
} from "../../utils/roleUtils";

function Navbar() {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);

    const dashboardPath = getPostAuthPathForUser(user);
    const dashboardLabel = isPlatformAdminRole(user?.role)
        ? "Super Admin"
        : isOrgStaffRole(user?.role)
            ? "Admin Dashboard"
            : "Candidate Portal";

    const closeMenu = () => {
        setMenuOpen(false);
        setUserMenuOpen(false);
    };

    const handleLogout = async () => {
        await logout();
        closeMenu();
        navigate("/login");
    };

    useEffect(() => {
        const handleDocumentClick = (event) => {
            if (
                userMenuRef.current &&
                !userMenuRef.current.contains(event.target)
            ) {
                setUserMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleDocumentClick);
        return () => document.removeEventListener("mousedown", handleDocumentClick);
    }, []);

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
                            <NavLink to="/about" className="navbar-link" onClick={closeMenu}>
                                About
                            </NavLink>
                            <NavLink to="/pricing" className="navbar-link" onClick={closeMenu}>
                                Pricing
                            </NavLink>
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
                        <div className="navbar-user-menu" ref={userMenuRef}>
                            <button
                                type="button"
                                className="navbar-user-pill"
                                onClick={() => setUserMenuOpen((current) => !current)}
                                aria-haspopup="menu"
                                aria-expanded={userMenuOpen}
                            >
                                <span className="navbar-avatar">
                                    {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
                                </span>
                                <span className="navbar-user-text">
                                    {user?.fullName}
                                    <small>{user?.role}</small>
                                </span>
                                <span className="navbar-user-caret" aria-hidden="true">
                                    v
                                </span>
                            </button>

                            {userMenuOpen && (
                                <div className="navbar-user-dropdown" role="menu">
                                    <Link
                                        to="/profile"
                                        className="navbar-user-dropdown-item"
                                        onClick={closeMenu}
                                        role="menuitem"
                                    >
                                        Settings
                                    </Link>
                                    {isOrgStaffRole(user?.role) && (
                                        <Link
                                            to="/pricing"
                                            className="navbar-user-dropdown-item"
                                            onClick={closeMenu}
                                            role="menuitem"
                                        >
                                            Plans
                                        </Link>
                                    )}
                                    <button
                                        type="button"
                                        className="navbar-user-dropdown-item danger"
                                        onClick={handleLogout}
                                        role="menuitem"
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
