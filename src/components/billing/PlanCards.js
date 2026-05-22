import { useState } from "react";
import { billingApi } from "../../api/billingApi";
import { PLAN_DEFINITIONS, PLAN_IDS } from "../../constants/plans";
import { getApiErrorMessage } from "../../utils/errorUtils";
import { showError } from "../../utils/toastUtils";

const billingEnabled = process.env.REACT_APP_BILLING_ENABLED === "true";

function PlanCards({ currentPlanId = PLAN_IDS.FREE, authenticated = false }) {
    const [loadingPlanId, setLoadingPlanId] = useState(null);

    const handlePlanAction = async (plan) => {
        if (plan.id === PLAN_IDS.FREE) {
            return;
        }

        if (!authenticated) {
            window.location.href = "/register";
            return;
        }

        if (!billingEnabled) {
            showError("Billing is not enabled yet. Add Stripe keys and backend endpoints to activate checkout.");
            return;
        }

        setLoadingPlanId(plan.id);

        try {
            const response = await billingApi.createCheckoutSession({
                planId: plan.id,
                priceId: process.env[plan.stripePriceEnvKey],
                successUrl: `${window.location.origin}/admin?billing=success`,
                cancelUrl: `${window.location.origin}/pricing`,
            });

            if (response.data?.url) {
                window.location.href = response.data.url;
                return;
            }

            showError("Checkout session did not return a redirect URL.");
        } catch (err) {
            showError(getApiErrorMessage(err, "Unable to start checkout"));
        } finally {
            setLoadingPlanId(null);
        }
    };

    return (
        <div className="pricing-grid">
            {PLAN_DEFINITIONS.map((plan) => {
                const current = currentPlanId === plan.id;
                const isLoading = loadingPlanId === plan.id;

                return (
                    <article
                        className={`pricing-card ${plan.recommended ? "recommended" : ""}`}
                        key={plan.id}
                    >
                        {plan.recommended && (
                            <span className="pricing-recommended">Recommended</span>
                        )}
                        <div className="pricing-card-header">
                            <h2>{plan.name}</h2>
                            <p>{plan.description}</p>
                        </div>
                        <div className="pricing-price">
                            <strong>{plan.priceLabel}</strong>
                            <span>{plan.cadence}</span>
                        </div>
                        <ul className="pricing-feature-list">
                            {plan.highlights.map((feature) => (
                                <li key={feature}>{feature}</li>
                            ))}
                        </ul>
                        <button
                            type="button"
                            className={current ? "secondary-button" : "primary-button"}
                            onClick={() => handlePlanAction(plan)}
                            disabled={current || isLoading}
                        >
                            {current
                                ? "Current Plan"
                                : isLoading
                                  ? "Opening..."
                                  : plan.id === PLAN_IDS.BUSINESS
                                    ? "Contact Sales"
                                    : "Choose Plan"}
                        </button>
                    </article>
                );
            })}
        </div>
    );
}

export default PlanCards;
