export const PLAN_IDS = {
    FREE: "free",
};

export const PLAN_FEATURES = {
    ACTIVE_ASSESSMENTS: "activeAssessments",
    CANDIDATE_INVITES: "candidateInvites",
    AI_GENERATION: "aiGeneration",
    PROCTORING: "proctoring",
    BRANDING: "branding",
    TEAM_MEMBERS: "teamMembers",
};

export const DEFAULT_PLAN = {
    id: PLAN_IDS.FREE,
    code: PLAN_IDS.FREE,
    name: "Free",
    description: "",
    pricing: 0,
    currency: "AED",
    billingCycle: "forever",
    features: {},
    highlights: [],
    isFree: true,
};

export const DEFAULT_SUBSCRIPTION = {
    planId: PLAN_IDS.FREE,
    status: "FREE",
    billingPeriodEndsAt: null,
    plan: DEFAULT_PLAN,
    usage: {
        [PLAN_FEATURES.ACTIVE_ASSESSMENTS]: 0,
        [PLAN_FEATURES.CANDIDATE_INVITES]: 0,
        [PLAN_FEATURES.TEAM_MEMBERS]: 1,
    },
};
