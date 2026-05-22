import axiosClient from "./axiosClient";

export const billingApi = {
    getSubscription: () => {
        return axiosClient.get("/billing/subscription");
    },

    createCheckoutSession: (payload) => {
        return axiosClient.post("/billing/checkout-session", payload);
    },

    createCustomerPortalSession: () => {
        return axiosClient.post("/billing/customer-portal-session");
    },
};
