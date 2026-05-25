import { DEFAULT_PLAN, DEFAULT_SUBSCRIPTION, PLAN_FEATURES } from "../constants/plans";

export function getPlanId(plan) {
    return plan?.code || plan?.id || DEFAULT_PLAN.code;
}

export function normalizePlan(plan) {
    const normalized = {
        ...DEFAULT_PLAN,
        ...(plan || {}),
        features: {
            ...DEFAULT_PLAN.features,
            ...(plan?.features || {}),
        },
    };

    return {
        ...normalized,
        id: getPlanId(normalized),
        code: getPlanId(normalized),
        highlights: Array.isArray(normalized.highlights)
            ? normalized.highlights
            : [],
    };
}

export function normalizeSubscription(subscription) {
    const plan = normalizePlan(subscription?.plan);
    const planId = subscription?.planId || subscription?.plan || plan.code;

    return {
        ...DEFAULT_SUBSCRIPTION,
        ...subscription,
        plan,
        planId,
        usage: {
            ...DEFAULT_SUBSCRIPTION.usage,
            ...(subscription?.usage || {}),
        },
    };
}

export function getPlanLimit(subscription, feature) {
    return normalizeSubscription(subscription).plan?.features?.[feature];
}

export function hasFeatureAccess(subscription, feature) {
    const limit = getPlanLimit(subscription, feature);

    if (limit === null) {
        return true;
    }

    if (typeof limit === "boolean") {
        return limit;
    }

    if (typeof limit === "number") {
        return limit > 0;
    }

    return Boolean(limit);
}

export function getUsageStatus(subscription, feature, fallbackUsed = 0) {
    const normalized = normalizeSubscription(subscription);
    const limit = getPlanLimit(normalized, feature);
    const used = Number(normalized.usage?.[feature] ?? fallbackUsed ?? 0);

    if (limit === null) {
        return {
            used,
            limit,
            remaining: null,
            isUnlimited: true,
            isAtLimit: false,
            percentUsed: 0,
        };
    }

    if (typeof limit !== "number") {
        return {
            used,
            limit,
            remaining: null,
            isUnlimited: false,
            isAtLimit: !Boolean(limit),
            percentUsed: Boolean(limit) ? 100 : 0,
        };
    }

    return {
        used,
        limit,
        remaining: Math.max(limit - used, 0),
        isUnlimited: false,
        isAtLimit: used >= limit,
        percentUsed: Math.min(100, Math.round((used / limit) * 100)),
    };
}

export function buildPlanCapabilities(subscription, fallbackUsage = {}) {
    const normalized = normalizeSubscription(subscription);
    const assessmentUsage = getUsageStatus(
        normalized,
        PLAN_FEATURES.ACTIVE_ASSESSMENTS,
        fallbackUsage[PLAN_FEATURES.ACTIVE_ASSESSMENTS]
    );
    const inviteUsage = getUsageStatus(
        normalized,
        PLAN_FEATURES.CANDIDATE_INVITES,
        fallbackUsage[PLAN_FEATURES.CANDIDATE_INVITES]
    );
    const teamUsage = getUsageStatus(
        normalized,
        PLAN_FEATURES.TEAM_MEMBERS,
        fallbackUsage[PLAN_FEATURES.TEAM_MEMBERS]
    );

    return {
        subscription: normalized,
        plan: normalized.plan,
        assessmentUsage,
        inviteUsage,
        teamUsage,
        canCreateAssessment: !assessmentUsage.isAtLimit,
        canInviteCandidate: !inviteUsage.isAtLimit,
        canInviteTeamMember: !teamUsage.isAtLimit,
        canUseAiGeneration: hasFeatureAccess(normalized, PLAN_FEATURES.AI_GENERATION),
        canUseProctoring: hasFeatureAccess(normalized, PLAN_FEATURES.PROCTORING),
        canCustomizeBranding: hasFeatureAccess(normalized, PLAN_FEATURES.BRANDING),
    };
}

export function formatPlanPrice(plan) {
    const normalized = normalizePlan(plan);
    const price = Number(normalized.pricing || 0);

    if (price === 0 || normalized.isFree) {
        return "0";
    }

    return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: normalized.currency || "AED",
        maximumFractionDigits: 0,
    }).format(price);
}

export function formatBillingCycle(plan) {
    const cycle = normalizePlan(plan).billingCycle;

    if (!cycle || cycle === "forever") {
        return "forever";
    }

    return `per ${cycle}`;
}
