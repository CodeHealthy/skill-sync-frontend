import { Link } from "react-router-dom";

function NotFoundPage() {
    return (
        <div className="page-container">
            <div className="form-card">
                <h2>404 - Page Not Found</h2>
                <p>The page you are looking for does not exist.</p>
                <Link to="/" className="primary-link">
                    Go Home
                </Link>
            </div>
        </div>
    );
}

export default NotFoundPage;