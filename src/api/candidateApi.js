import axiosClient from "./axiosClient";

export const candidateApi = {
    getCandidates: () => {
        return axiosClient.get("/candidates");
    },

    createCandidate: (payload) => {
        return axiosClient.post("/candidates", payload);
    },

    inviteCandidate: (payload) => {
        return axiosClient.post("/candidates", payload);
    },
};
