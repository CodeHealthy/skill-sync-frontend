import axiosClient from "./axiosClient";

export const authApi = {
    login: (payload) => {
        return axiosClient.post("/auth/login", payload);
    },

    register: (payload) => {
        return axiosClient.post("/auth/register", payload);
    },

    verifyEmail: (token) => {
        return axiosClient.get("/auth/verify-email", {
            params: { token },
        });
    },

    resendVerification: (payload) => {
        return axiosClient.post("/auth/resend-verification", payload);
    },

    forgotPassword: (payload) => {
        return axiosClient.post("/auth/forgot-password", payload);
    },

    resetPassword: (payload) => {
        return axiosClient.post("/auth/reset-password", payload);
    },

    getInvite: (token) => {
        return axiosClient.get("/auth/invite", {
            params: { token },
        });
    },

    acceptInvite: (payload) => {
        return axiosClient.post("/auth/accept-invite", payload);
    },

    getTeamInvite: ({ token, name }) => {
        return axiosClient.get("/auth/team-invite", {
            params: { token, name },
        });
    },

    acceptTeamInvite: (payload) => {
        return axiosClient.post("/auth/accept-team-invite", payload);
    },
};
