import { useEffect, useState } from "react";
import { billingApi } from "../../api/billingApi";
import { PLAN_IDS } from "../../constants/plans";
import { getApiErrorMessage } from "../../utils/errorUtils";
import { formatBillingCycle, formatPlanPrice, getPlanId, normalizePlan } from "../../utils/planUtils";
import { showError } from "../../utils/toastUtils";

const billingEnabled = process.env.REACT_APP_BILLING_ENABLED === "true";

function PlanCards({ currentPlanId = PLAN_IDS.FREE, authenticated = false, plans: providedPlans }) {
    const [plans, setPlans] = useState(providedPlans || []);
    const [loadingPlans, setLoadingPlans] = useState(!providedPlans);
    const [loadingPlanId, setLoadingPlanId] = useState(null);

    useEffect(() => {
        if (providedPlans) {
            setPlans(providedPlans);
            setLoadingPlans(false);
            return;
        }

        let isMounted = true;

        const loadPlans = async () => {
            setLoadingPlans(true);

            try {
                const response = await billingApi.getPlans();

                if (isMounted) {
                    setPlans(Array.isArray(response.data) ? response.data : []);
                }
            } catch (err) {
                if (isMounted) {
                    showError(getApiErrorMessage(err, "Unable to load plans"));
                }
            } finally {
                if (isMounted) {
                    setLoadingPlans(false);
                }
            }
        };

        loadPlans();

        return () => {
            isMounted = false;
        };
    }, [providedPlans]);

    const handlePlanAction = async (rawPlan) => {
        const plan = normalizePlan(rawPlan);
        const planId = getPlanId(plan);

        if (plan.isFree || planId === PLAN_IDS.FREE) {
            return;
        }

        if (!authenticated) {
            window.location.href = "/register";
            return;
        }

        if (!billingEnabled) {
            showError("Billing is not enabled yet. Configure Stripe keys and enable billing in the backend.");
            return;
        }

        setLoadingPlanId(planId);

        try {
            const response = await billingApi.createCheckoutSession({
                planId,
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

    if (loadingPlans) {
        return <div className="info-box">Loading plans...</div>;
    }

    if (plans.length === 0) {
        return (
            <div className="empty-state">
                <h3>No plans configured</h3>
                <p>Add subscription plan documents in MongoDB to publish pricing.</p>
            </div>
        );
    }

    return (
        <div className="pricing-grid">
            {plans.map((rawPlan) => {
                const plan = normalizePlan(rawPlan);
                const planId = getPlanId(plan);
                const current = currentPlanId === planId;
                const isLoading = loadingPlanId === planId;

                return (
                    <article
                        className={`pricing-card ${plan.recommended ? "recommended" : ""}`}
                        key={planId}
                    >
                        {plan.recommended && (
                            <span className="pricing-recommended">Recommended</span>
                        )}
                        <div className="pricing-card-header">
                            <h2>{plan.name}</h2>
                            <p>{plan.description}</p>
                        </div>
                        <div className="pricing-price">
                            <strong>{formatPlanPrice(plan)}</strong>
                            <span>{formatBillingCycle(plan)}</span>
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
                                  : "Choose Plan"}
                        </button>
                    </article>
                );
            })}
        </div>
    );
}

export default PlanCards;
