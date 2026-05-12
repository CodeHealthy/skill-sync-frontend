import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function HomePage() {
    const { user, isAuthenticated } = useAuth();

    return (
        <div className="page-container">
            <div className="hero-card">
                <h1>Automated Talent Skill-Validator</h1>
                <p>
                    Create technical assessments, invite candidates, and automatically
                    evaluate submissions.
                </p>

                {!isAuthenticated && (
                    <div className="button-row">
                        <Link to="/login" className="primary-link">
                            Login
                        </Link>
                        <Link to="/register" className="secondary-link">
                            Register
                        </Link>
                    </div>
                )}

                {isAuthenticated && user?.role === "ADMIN" && (
                    <Link to="/admin" className="primary-link">
                        Go to Admin Dashboard
                    </Link>
                )}

                {isAuthenticated && user?.role === "CANDIDATE" && (
                    <Link to="/candidate" className="primary-link">
                        Go to Candidate Portal
                    </Link>
                )}
            </div>
        </div>
    );
}

export default HomePage;