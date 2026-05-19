import axiosClient from "./axiosClient";

export const generateAssessmentWithAi = async (payload) => {
  const response = await axiosClient.post("/ai/assessments/generate", payload);
  return response.data;
};