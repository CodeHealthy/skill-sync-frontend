import axiosClient from "./axiosClient";

export const assessmentApi = {
    getAssessments: () => {
        return axiosClient.get("/assessments");
    },

    getAssessmentTemplates: () => {
        return axiosClient.get("/assessment-templates");
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

    startAssignment: (assignmentId) => {
        return axiosClient.post(`/assessments/assignments/${assignmentId}/start`);
    },

    startAssignmentSection: (assignmentId, sectionId) => {
        return axiosClient.post(
            `/assessments/assignments/${assignmentId}/sections/start`,
            { sectionId }
        );
    },

    completeAssignmentSection: (assignmentId, sectionId) => {
        return axiosClient.post(
            `/assessments/assignments/${assignmentId}/sections/complete`,
            { sectionId }
        );
    },

    saveAssignmentDraft: (assignmentId, payload) => {
        return axiosClient.patch(
            `/assessments/assignments/${assignmentId}/draft`,
            payload
        );
    },

    recordIntegrityEvent: (assignmentId, payload) => {
        return axiosClient.post(
            `/assessments/assignments/${assignmentId}/integrity-events`,
            payload
        );
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
