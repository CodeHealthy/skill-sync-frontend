const candidateUser = {
    userId: "candidate-1",
    fullName: "Ada Candidate",
    email: "candidate@example.com",
    role: "CANDIDATE",
};

const adminUser = {
    userId: "admin-1",
    fullName: "Nora Recruiter",
    email: "nora@example.com",
    role: "ADMIN",
};

const superAdminUser = {
    userId: "super-admin-1",
    fullName: "Sam Superadmin",
    email: "sam@example.com",
    role: "SUPER_ADMIN",
};

const candidateRecord = {
    id: "candidate-1",
    name: "Ada Candidate",
    email: "candidate@example.com",
    status: "REGISTERED",
};

const assessmentRecord = {
    id: "assessment-1",
    title: "Java Fundamentals",
    type: "MCQ",
    status: "PUBLISHED",
    maxScore: 100,
};

function buildAssignedAssessment(overrides = {}) {
    return {
        id: "assignment-1",
        assessmentId: "assessment-1",
        assessmentTitle: "Java Fundamentals",
        assessmentType: "MCQ",
        status: "ASSIGNED",
        organizationName: "Skill Sync QA",
        prompt: "Answer the Java fundamentals questions.",
        assignedAt: "2026-05-31T10:00:00Z",
        dueAt: "2026-06-07T10:00:00Z",
        timeLimitMinutes: 30,
        maxScore: 100,
        draftAnswers: {},
        sectionAttempts: [],
        sections: [
            {
                id: "section-1",
                title: "Core Java",
                description: "Answer the core Java question.",
                questions: [
                    {
                        id: "q1",
                        type: "SHORT_ANSWER",
                        title: "Encapsulation",
                        prompt: "What problem does encapsulation solve?",
                        points: 100,
                    },
                ],
            },
        ],
        ...overrides,
    };
}

function buildSubmittedReviewAssignment(overrides = {}) {
    return buildAssignedAssessment({
        status: "SUBMITTED",
        submittedAt: "2026-05-31T11:05:00Z",
        completedAt: "2026-05-31T11:05:00Z",
        submittedAnswers: {
            q1: "Encapsulation keeps object state protected and narrows mutation paths.",
        },
        reviewStatus: "NEEDS_MANUAL_REVIEW",
        reviewedQuestionCount: 0,
        totalQuestionCount: 1,
        ...overrides,
    });
}

function buildGrowthSubscription() {
    return {
        planId: "growth",
        status: "ACTIVE",
        plan: {
            code: "growth",
            name: "Growth",
            features: {
                activeAssessments: null,
                candidateInvites: null,
                teamMembers: null,
                aiGeneration: true,
            },
        },
        usage: {
            activeAssessments: 1,
            candidateInvites: 1,
            teamMembers: 1,
        },
    };
}

module.exports = {
    adminUser,
    assessmentRecord,
    buildAssignedAssessment,
    buildSubmittedReviewAssignment,
    buildGrowthSubscription,
    candidateRecord,
    candidateUser,
    superAdminUser,
};
