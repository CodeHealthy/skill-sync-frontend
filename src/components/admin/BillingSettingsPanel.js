import { useState } from "react";
import { billingApi } from "../../api/billingApi";
import PlanCards from "../billing/PlanCards";
import UsageLimitBanner from "../billing/UsageLimitBanner";
import { getApiErrorMessage } from "../../utils/errorUtils";
import { showError } from "../../utils/toastUtils";
import "../../css/DashboardPanels.css";

function BillingSettingsPanel({
    plan,
    subscription,
    assessmentUsage,
    inviteUsage,
    teamUsage,
    loading,
    onRefresh,
}) {
    const [openingPortal, setOpeningPortal] = useState(false);

    const openCustomerPortal = async () => {
        setOpeningPortal(true);

        try {
            const response = await billingApi.createCustomerPortalSession();

            if (response.data?.url) {
                window.location.href = response.data.url;
                return;
            }

            showError("Billing portal did not return a redirect URL.");
        } catch (err) {
            showError(getApiErrorMessage(err, "Unable to open billing portal"));
        } finally {
            setOpeningPortal(false);
        }
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
                        onClick={openCustomerPortal}
                        disabled={openingPortal}
                    >
                        {openingPortal ? "Opening..." : "Manage Billing"}
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

                <PlanCards currentPlanId={subscription.planId} authenticated />
            </section>
        </div>
    );
}

export default BillingSettingsPanel;
