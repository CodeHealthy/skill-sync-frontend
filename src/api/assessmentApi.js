import axiosClient from "./axiosClient";

export const assessmentApi = {
    getAssessments: () => {
        return axiosClient.get("/assessments");
    },

    createAssessment: (payload) => {
        return axiosClient.post("/assessments", payload);
    },

    assignAssessment: (payload) => {
        return axiosClient.post("/assessments/assign", payload);
    },

    getAssignments: () => {
        return axiosClient.get("/assessments/assignments");
    },

    getMyAssignments: () => {
        return axiosClient.get("/assessments/my-assignments");
    },

    submitAssignment: (assignmentId, payload) => {
        return axiosClient.post(
            `/assessments/assignments/${assignmentId}/submit`,
            payload
        );
    },

    gradeAssignment: (assignmentId, payload) => {
        return axiosClient.patch(
            `/assessments/assignments/${assignmentId}/grade`,
            payload
        );
    },

    executeAssignment: (assignmentId) => {
        return axiosClient.post(
            `/assessments/assignments/${assignmentId}/execute`
        );
    },

    runAssignmentCode: (assignmentId, payload) => {
        return axiosClient.post(
            `/assessments/assignments/${assignmentId}/run`,
            payload
        );
    },
};