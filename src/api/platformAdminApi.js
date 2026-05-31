import axiosClient from "./axiosClient";

export const platformAdminApi = {
    getSummary: () => {
        return axiosClient.get("/platform-admin/summary");
    },

    getSubscriptionPlans: () => {
        return axiosClient.get("/platform-admin/subscription-plans");
    },

    createSubscriptionPlan: (payload) => {
        return axiosClient.post("/platform-admin/subscription-plans", payload);
    },

    updateSubscriptionPlan: (planId, payload) => {
        return axiosClient.patch(`/platform-admin/subscription-plans/${planId}`, payload);
    },

    deactivateSubscriptionPlan: (planId) => {
        return axiosClient.post(`/platform-admin/subscription-plans/${planId}/deactivate`);
    },
};
