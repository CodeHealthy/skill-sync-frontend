import axiosClient from "./axiosClient";

export const profileApi = {
    getProfile: () => {
        return axiosClient.get("/profile");
    },

    updateProfile: (payload) => {
        return axiosClient.patch("/profile", payload);
    },

    changePassword: (payload) => {
        return axiosClient.patch("/profile/password", payload);
    },
};