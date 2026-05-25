import { useCallback, useEffect, useMemo, useState } from "react";
import { billingApi } from "../api/billingApi";
import { DEFAULT_SUBSCRIPTION, PLAN_FEATURES } from "../constants/plans";
import { buildPlanCapabilities, normalizeSubscription } from "../utils/planUtils";

export function useSubscription(fallbackUsage = {}) {
    const [subscription, setSubscription] = useState(DEFAULT_SUBSCRIPTION);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const fallbackActiveAssessments =
        fallbackUsage[PLAN_FEATURES.ACTIVE_ASSESSMENTS];
    const fallbackCandidateInvites =
        fallbackUsage[PLAN_FEATURES.CANDIDATE_INVITES];
    const fallbackTeamMembers =
        fallbackUsage[PLAN_FEATURES.TEAM_MEMBERS];

    const fetchSubscription = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await billingApi.getSubscription();
            setSubscription(normalizeSubscription(response.data));
        } catch (err) {
            setSubscription((current) =>
                normalizeSubscription({
                    ...current,
                    usage: {
                        ...current.usage,
                        [PLAN_FEATURES.ACTIVE_ASSESSMENTS]:
                            fallbackActiveAssessments ??
                            current.usage?.[PLAN_FEATURES.ACTIVE_ASSESSMENTS],
                        [PLAN_FEATURES.CANDIDATE_INVITES]:
                            fallbackCandidateInvites ??
                            current.usage?.[PLAN_FEATURES.CANDIDATE_INVITES],
                        [PLAN_FEATURES.TEAM_MEMBERS]:
                            fallbackTeamMembers ??
                            current.usage?.[PLAN_FEATURES.TEAM_MEMBERS],
                    },
                })
            );
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [fallbackActiveAssessments, fallbackCandidateInvites, fallbackTeamMembers]);

    useEffect(() => {
        fetchSubscription();
    }, [fetchSubscription]);

    return useMemo(
        () => ({
            ...buildPlanCapabilities(subscription, fallbackUsage),
            loading,
            error,
            refreshSubscription: fetchSubscription,
        }),
        [subscription, fallbackUsage, loading, error, fetchSubscription]
    );
}
