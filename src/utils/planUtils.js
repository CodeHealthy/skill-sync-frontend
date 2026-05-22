import { DEFAULT_SUBSCRIPTION, PLAN_DEFINITIONS, PLAN_FEATURES, PLAN_IDS } from "../constants/plans";

export function getPlanDefinition(planId) {
    return (
        PLAN_DEFINITIONS.find((plan) => plan.id === planId) ||
        PLAN_DEFINITIONS.find((plan) => plan.id === PLAN_IDS.FREE)
    );
}

export function normalizeSubscription(subscription) {
    const planId = subscription?.planId || subscription?.plan || DEFAULT_SUBSCRIPTION.planId;

    return {
        ...DEFAULT_SUBSCRIPTION,
        ...subscription,
        planId,
        usage: {
            ...DEFAULT_SUBSCRIPTION.usage,
            ...(subscription?.usage || {}),
        },
    };
}

export function getPlanLimit(subscription, feature) {
    const plan = getPlanDefinition(subscription?.planId);
    return plan?.limits?.[feature];
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

    return {
        subscription: normalized,
        plan: getPlanDefinition(normalized.planId),
        assessmentUsage,
        inviteUsage,
        canCreateAssessment: !assessmentUsage.isAtLimit,
        canInviteCandidate: !inviteUsage.isAtLimit,
        canUseAiGeneration: hasFeatureAccess(normalized, PLAN_FEATURES.AI_GENERATION),
        canUseProctoring: hasFeatureAccess(normalized, PLAN_FEATURES.PROCTORING),
        canCustomizeBranding: hasFeatureAccess(normalized, PLAN_FEATURES.BRANDING),
    };
}
