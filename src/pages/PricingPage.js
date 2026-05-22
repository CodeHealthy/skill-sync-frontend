import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import PlanCards from "../components/billing/PlanCards";

function PricingPage() {
    const { user, isAuthenticated } = useAuth();
    const currentPlanId = user?.subscription?.planId || "free";

    return (
        <main className="pricing-page">
            <section className="pricing-hero">
                <p className="eyebrow">SkillSync Plans</p>
                <h1>Start lean, then scale your assessment workflow.</h1>
                <p>
                    Plan limits are designed around the hiring actions SkillSync will
                    enforce: active assessments, monthly candidate invites, AI generation,
                    trust signals, and branding.
                </p>
                {!isAuthenticated && (
                    <div className="landing-actions">
                        <Link to="/register" className="primary-link landing-primary">
                            Create Account
                        </Link>
                        <Link to="/login" className="secondary-link landing-secondary">
                            Login
                        </Link>
                    </div>
                )}
            </section>

            <PlanCards currentPlanId={currentPlanId} authenticated={isAuthenticated} />
        </main>
    );
}

export default PricingPage;
