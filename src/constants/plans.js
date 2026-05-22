export const PLAN_IDS = {
    FREE: "free",
    STARTER: "starter",
    GROWTH: "growth",
    BUSINESS: "business",
};

export const PLAN_FEATURES = {
    ACTIVE_ASSESSMENTS: "activeAssessments",
    CANDIDATE_INVITES: "candidateInvites",
    AI_GENERATION: "aiGeneration",
    PROCTORING: "proctoring",
    BRANDING: "branding",
    TEAM_MEMBERS: "teamMembers",
};

export const PLAN_DEFINITIONS = [
    {
        id: PLAN_IDS.FREE,
        name: "Free",
        priceLabel: "0 د.إ AED",
        cadence: "forever",
        description: "For validating the core workflow with a small hiring loop.",
        stripePriceEnvKey: null,
        limits: {
            [PLAN_FEATURES.ACTIVE_ASSESSMENTS]: 1,
            [PLAN_FEATURES.CANDIDATE_INVITES]: 5,
            [PLAN_FEATURES.AI_GENERATION]: 0,
            [PLAN_FEATURES.PROCTORING]: false,
            [PLAN_FEATURES.BRANDING]: false,
            [PLAN_FEATURES.TEAM_MEMBERS]: 1,
        },
        highlights: [
            "1 published assessment",
            "5 candidate invites per month",
            "Basic results dashboard",
        ],
    },
    {
        id: PLAN_IDS.STARTER,
        name: "Starter",
        priceLabel: "20 د.إ AED",
        cadence: "per month",
        description: "For teams running repeatable screening for active roles.",
        stripePriceEnvKey: "REACT_APP_STRIPE_STARTER_PRICE_ID",
        limits: {
            [PLAN_FEATURES.ACTIVE_ASSESSMENTS]: 5,
            [PLAN_FEATURES.CANDIDATE_INVITES]: 50,
            [PLAN_FEATURES.AI_GENERATION]: true,
            [PLAN_FEATURES.PROCTORING]: true,
            [PLAN_FEATURES.BRANDING]: false,
            [PLAN_FEATURES.TEAM_MEMBERS]: 2,
        },
        highlights: [
            "5 active assessments",
            "50 candidate invites per month",
            "AI assessment generation",
            "Basic trust signals",
        ],
    },
    {
        id: PLAN_IDS.GROWTH,
        name: "Growth",
        priceLabel: "50 د.إ AED",
        cadence: "per month",
        description: "For growing recruiting teams that need reports and branding.",
        stripePriceEnvKey: "REACT_APP_STRIPE_GROWTH_PRICE_ID",
        recommended: true,
        limits: {
            [PLAN_FEATURES.ACTIVE_ASSESSMENTS]: 25,
            [PLAN_FEATURES.CANDIDATE_INVITES]: 250,
            [PLAN_FEATURES.AI_GENERATION]: true,
            [PLAN_FEATURES.PROCTORING]: true,
            [PLAN_FEATURES.BRANDING]: true,
            [PLAN_FEATURES.TEAM_MEMBERS]: 8,
        },
        highlights: [
            "25 active assessments",
            "250 candidate invites per month",
            "Branded assessment experience",
            "Advanced result reports",
        ],
    },
    {
        id: PLAN_IDS.BUSINESS,
        name: "Business",
        priceLabel: "150 د.إ AED",
        cadence: "per month",
        description: "For larger hiring operations with custom limits and support.",
        stripePriceEnvKey: "REACT_APP_STRIPE_BUSINESS_PRICE_ID",
        limits: {
            [PLAN_FEATURES.ACTIVE_ASSESSMENTS]: null,
            [PLAN_FEATURES.CANDIDATE_INVITES]: null,
            [PLAN_FEATURES.AI_GENERATION]: true,
            [PLAN_FEATURES.PROCTORING]: true,
            [PLAN_FEATURES.BRANDING]: true,
            [PLAN_FEATURES.TEAM_MEMBERS]: null,
        },
        highlights: [
            "Custom assessment volume",
            "Custom candidate volume",
            "ATS and webhook-ready foundation",
            "Priority support workflow",
        ],
    },
];

export const DEFAULT_SUBSCRIPTION = {
    planId: PLAN_IDS.FREE,
    status: "FREE",
    billingPeriodEndsAt: null,
    usage: {
        [PLAN_FEATURES.ACTIVE_ASSESSMENTS]: 0,
        [PLAN_FEATURES.CANDIDATE_INVITES]: 0,
        [PLAN_FEATURES.TEAM_MEMBERS]: 1,
    },
};
