import PlanCards from "../billing/PlanCards";
import UsageLimitBanner from "../billing/UsageLimitBanner";
import { showInfo } from "../../utils/toastUtils";
import "../../css/DashboardPanels.css";

const SUBSCRIPTIONS_UNAVAILABLE_MESSAGE =
    "Subscriptions are currently unavailable. You can continue using the free workspace while billing is being prepared.";

function BillingSettingsPanel({
    plan,
    subscription,
    assessmentUsage,
    inviteUsage,
    teamUsage,
    loading,
    onRefresh,
}) {
    const showSubscriptionsUnavailable = () => {
        showInfo(SUBSCRIPTIONS_UNAVAILABLE_MESSAGE);
    };

    return (
        <div className="dashboard-panel-stack">
            <section className="billing-summary-card">
                <div>
                    <p className="eyebrow">Billing</p>
                    <h2>{plan.name} plan</h2>
                    <p>
                        Status: <strong>{subscription.status || "FREE"}</strong>
                        {subscription.billingPeriodEndsAt &&
                            ` - Renews ${new Date(
                                subscription.billingPeriodEndsAt
                            ).toLocaleDateString()}`}
                    </p>
                </div>

                <div className="billing-actions">
                    <button
                        type="button"
                        className="secondary-button"
                        onClick={onRefresh}
                        disabled={loading}
                    >
                        {loading ? "Refreshing..." : "Refresh"}
                    </button>
                    <button
                        type="button"
                        className="primary-button"
                        onClick={showSubscriptionsUnavailable}
                    >
                        Manage Billing
                    </button>
                </div>
            </section>

            <div className="dashboard-panel-grid dashboard-panel-grid-equal">
                <UsageLimitBanner label="Active assessments" usage={assessmentUsage} />
                <UsageLimitBanner label="Candidate invites this month" usage={inviteUsage} />
                <UsageLimitBanner label="Team members" usage={teamUsage} />
            </div>

            <section className="billing-plan-section">
                <div className="panel-heading-row">
                    <div>
                        <h2>Available Plans</h2>
                    </div>
                </div>

                <PlanCards currentPlanId={subscription.planId} />
            </section>
        </div>
    );
}

export default BillingSettingsPanel;
