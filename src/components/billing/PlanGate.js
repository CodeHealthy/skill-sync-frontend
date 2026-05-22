import { Link } from "react-router-dom";

function PlanGate({ allowed, title, message, children }) {
    if (allowed) {
        return children;
    }

    return (
        <div className="plan-gate">
            <h3>{title || "Upgrade required"}</h3>
            <p>
                {message ||
                    "This workspace has reached its current plan limit. Upgrade to keep going."}
            </p>
            <Link to="/pricing" className="primary-link">
                View Plans
            </Link>
        </div>
    );
}

export default PlanGate;
