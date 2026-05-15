import axiosClient from "./axiosClient";

export const candidateApi = {
    getCandidates: () => {
        return axiosClient.get("/candidates");
    },

    createCandidate: (payload) => {
        return axiosClient.post("/candidates", payload);
    },
};