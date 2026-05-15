import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

function Navbar() {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <nav className="navbar">
            <Link to="/" className="navbar-brand">
                SkillSync
            </Link>

            <div className="navbar-links">
                {isAuthenticated && user?.role === "ADMIN" && (
                    <Link to="/admin">Admin Dashboard</Link>
                )}

                {isAuthenticated && user?.role === "CANDIDATE" && (
                    <Link to="/candidate">Candidate Portal</Link>
                )}

                {!isAuthenticated && (
                    <>
                        <Link to="/login">Login</Link>
                        <Link to="/register">Register</Link>
                    </>
                )}

                {isAuthenticated && (
                    <>
                        <span className="navbar-user">
                            {user.fullName} ({user.role})
                        </span>
                        <button onClick={handleLogout} className="secondary-button">
                            Logout
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
}

export default Navbar;