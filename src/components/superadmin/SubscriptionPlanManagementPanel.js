import { useEffect, useMemo, useState } from "react";
import { platformAdminApi } from "../../api/platformAdminApi";
import { getApiErrorMessage } from "../../utils/errorUtils";
import { formatBillingCycle, formatPlanPrice } from "../../utils/planUtils";
import { showError, showSuccess } from "../../utils/toastUtils";

const initialForm = {
    id: "",
    code: "",
    name: "",
    description: "",
    pricing: "0",
    currency: "AED",
    billingCycle: "month",
    stripePriceId: "",
    featuresJson: "{}",
    highlightsText: "",
    recommended: false,
    active: true,
    isFree: false,
    displayOrder: "",
};

function SubscriptionPlanManagementPanel() {
    const [plans, setPlans] = useState([]);
    const [form, setForm] = useState(initialForm);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deactivatingPlanId, setDeactivatingPlanId] = useState(null);

    const editing = Boolean(form.id);

    const sortedPlans = useMemo(
        () => [...plans].sort((left, right) => {
            const leftOrder = left.displayOrder ?? Number.MAX_SAFE_INTEGER;
            const rightOrder = right.displayOrder ?? Number.MAX_SAFE_INTEGER;

            if (leftOrder !== rightOrder) {
                return leftOrder - rightOrder;
            }

            return (left.code || "").localeCompare(right.code || "");
        }),
        [plans]
    );

    const loadPlans = async () => {
        setLoading(true);

        try {
            const response = await platformAdminApi.getSubscriptionPlans();
            setPlans(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            showError(getApiErrorMessage(err, "Failed to load subscription plans"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPlans();
    }, []);

    const updateField = (event) => {
        const { checked, name, type, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const submitPlan = async (event) => {
        event.preventDefault();

        let features;
        try {
            features = JSON.parse(form.featuresJson || "{}");
        } catch (err) {
            showError("Features must be valid JSON.");
            return;
        }

        if (!features || Array.isArray(features) || typeof features !== "object") {
            showError("Features must be a JSON object.");
            return;
        }

        const payload = {
            code: form.code,
            name: form.name,
            description: form.description,
            pricing: Number(form.pricing || 0),
            currency: form.currency,
            billingCycle: form.billingCycle,
            stripePriceId: form.stripePriceId || null,
            features,
            highlights: form.highlightsText
                .split("\n")
                .map((item) => item.trim())
                .filter(Boolean),
            recommended: form.recommended,
            active: form.active,
            isFree: form.isFree,
            displayOrder: form.displayOrder === "" ? null : Number(form.displayOrder),
        };

        setSaving(true);

        try {
            if (editing) {
                await platformAdminApi.updateSubscriptionPlan(form.id, payload);
                showSuccess("Subscription plan updated.");
            } else {
                await platformAdminApi.createSubscriptionPlan(payload);
                showSuccess("Subscription plan created.");
            }

            setForm(initialForm);
            await loadPlans();
        } catch (err) {
            showError(getApiErrorMessage(err, "Failed to save subscription plan"));
        } finally {
            setSaving(false);
        }
    };

    const editPlan = (plan) => {
        setForm({
            id: plan.id || plan.code,
            code: plan.code || "",
            name: plan.name || "",
            description: plan.description || "",
            pricing: String(plan.pricing ?? 0),
            currency: plan.currency || "AED",
            billingCycle: plan.billingCycle || "month",
            stripePriceId: plan.stripePriceId || "",
            featuresJson: JSON.stringify(plan.features || {}, null, 2),
            highlightsText: (plan.highlights || []).join("\n"),
            recommended: Boolean(plan.recommended),
            active: plan.active !== false,
            isFree: Boolean(plan.isFree),
            displayOrder: plan.displayOrder ?? "",
        });
    };

    const deactivatePlan = async (plan) => {
        const planId = plan.id || plan.code;
        setDeactivatingPlanId(planId);

        try {
            await platformAdminApi.deactivateSubscriptionPlan(planId);
            showSuccess("Subscription plan deactivated.");
            await loadPlans();
        } catch (err) {
            showError(getApiErrorMessage(err, "Failed to deactivate subscription plan"));
        } finally {
            setDeactivatingPlanId(null);
        }
    };

    return (
        <div className="dashboard-panel-stack">
            <section className="result-card">
                <div className="panel-heading-row">
                    <div>
                        <p className="eyebrow">Super Admin</p>
                        <h2>Subscription Plans</h2>
                    </div>
                    <button
                        type="button"
                        className="secondary-button"
                        onClick={loadPlans}
                        disabled={loading}
                    >
                        {loading ? "Refreshing..." : "Refresh"}
                    </button>
                </div>

                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Plan</th>
                                <th>Price</th>
                                <th>Status</th>
                                <th>Features</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedPlans.map((plan) => (
                                <tr key={plan.id || plan.code}>
                                    <td data-label="Plan">
                                        <div className="primary-cell">{plan.name}</div>
                                        <div className="muted-cell">{plan.code}</div>
                                    </td>
                                    <td data-label="Price">
                                        {formatPlanPrice(plan)} {formatBillingCycle(plan)}
                                    </td>
                                    <td data-label="Status">
                                        {plan.active === false ? "Inactive" : "Active"}
                                        {plan.isFree ? " / Free" : ""}
                                    </td>
                                    <td data-label="Features" className="muted-cell">
                                        {Object.keys(plan.features || {}).join(", ") || "-"}
                                    </td>
                                    <td data-label="Actions">
                                        <div className="table-actions">
                                            <button
                                                type="button"
                                                className="secondary-button small-button"
                                                onClick={() => editPlan(plan)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                className="danger-button small-button"
                                                onClick={() => deactivatePlan(plan)}
                                                disabled={
                                                    plan.isFree ||
                                                    plan.active === false ||
                                                    deactivatingPlanId === (plan.id || plan.code)
                                                }
                                            >
                                                {deactivatingPlanId === (plan.id || plan.code)
                                                    ? "Deactivating..."
                                                    : "Deactivate"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {sortedPlans.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="empty-table-cell">
                                        No subscription plans found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="result-card">
                <div className="panel-heading-row">
                    <div>
                        <h2>{editing ? "Edit Plan" : "Create Plan"}</h2>
                    </div>
                    {editing && (
                        <button
                            type="button"
                            className="secondary-button small-button"
                            onClick={() => setForm(initialForm)}
                        >
                            New Plan
                        </button>
                    )}
                </div>

                <form className="dashboard-panel-stack" onSubmit={submitPlan}>
                    <div className="two-column-form">
                        <label>
                            Code
                            <input
                                name="code"
                                value={form.code}
                                onChange={updateField}
                                required
                                maxLength={80}
                            />
                        </label>
                        <label>
                            Name
                            <input
                                name="name"
                                value={form.name}
                                onChange={updateField}
                                required
                                maxLength={120}
                            />
                        </label>
                        <label>
                            Price
                            <input
                                name="pricing"
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.pricing}
                                onChange={updateField}
                            />
                        </label>
                        <label>
                            Currency
                            <input
                                name="currency"
                                value={form.currency}
                                onChange={updateField}
                                maxLength={10}
                            />
                        </label>
                        <label>
                            Billing Cycle
                            <input
                                name="billingCycle"
                                value={form.billingCycle}
                                onChange={updateField}
                                maxLength={40}
                            />
                        </label>
                        <label>
                            Display Order
                            <input
                                name="displayOrder"
                                type="number"
                                value={form.displayOrder}
                                onChange={updateField}
                            />
                        </label>
                        <label className="form-field-full">
                            Stripe Price ID
                            <input
                                name="stripePriceId"
                                value={form.stripePriceId}
                                onChange={updateField}
                                maxLength={255}
                            />
                        </label>
                        <label className="form-field-full">
                            Description
                            <textarea
                                name="description"
                                rows="3"
                                value={form.description}
                                onChange={updateField}
                                maxLength={500}
                            />
                        </label>
                        <label className="form-field-full">
                            Features JSON
                            <textarea
                                name="featuresJson"
                                rows="8"
                                value={form.featuresJson}
                                onChange={updateField}
                                className="code-textarea"
                            />
                        </label>
                        <label className="form-field-full">
                            Highlights
                            <textarea
                                name="highlightsText"
                                rows="5"
                                value={form.highlightsText}
                                onChange={updateField}
                            />
                        </label>
                    </div>

                    <div className="dashboard-panel-grid dashboard-panel-grid-equal">
                        <label className="checkbox-field">
                            <input
                                name="active"
                                type="checkbox"
                                checked={form.active}
                                onChange={updateField}
                            />
                            Active
                        </label>
                        <label className="checkbox-field">
                            <input
                                name="recommended"
                                type="checkbox"
                                checked={form.recommended}
                                onChange={updateField}
                            />
                            Recommended
                        </label>
                        <label className="checkbox-field">
                            <input
                                name="isFree"
                                type="checkbox"
                                checked={form.isFree}
                                onChange={updateField}
                            />
                            Free Plan
                        </label>
                    </div>

                    <div className="button-row-left">
                        <button
                            type="submit"
                            className="primary-button"
                            disabled={saving}
                        >
                            {saving
                                ? "Saving..."
                                : editing
                                    ? "Update Plan"
                                    : "Create Plan"}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}

export default SubscriptionPlanManagementPanel;
