import { Link } from "react-router-dom";

function UnauthorizedPage() {
    return (
        <div className="page-container">
            <div className="form-card">
                <h2>Unauthorized</h2>
                <p>You do not have permission to access this page.</p>
                <Link to="/" className="primary-link">
                    Go Home
                </Link>
            </div>
        </div>
    );
}

export default UnauthorizedPage;