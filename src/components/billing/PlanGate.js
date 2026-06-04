import { showInfo } from "../../utils/toastUtils";

const SUBSCRIPTIONS_UNAVAILABLE_MESSAGE =
    "Subscriptions are currently unavailable. You can continue using the free workspace while billing is being prepared.";

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
            <button
                type="button"
                className="primary-button"
                onClick={() => showInfo(SUBSCRIPTIONS_UNAVAILABLE_MESSAGE)}
            >
                View Plans
            </button>
        </div>
    );
}

export default PlanGate;
