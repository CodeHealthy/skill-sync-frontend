import axiosClient from "./axiosClient";

const AI_GENERATION_TIMEOUT_MS = Number(
  process.env.REACT_APP_AI_GENERATION_TIMEOUT_MS || 210000
);

export const generateAssessmentWithAi = async (payload, options = {}) => {
  const response = await axiosClient.post("/ai/assessments/generate", payload, {
    signal: options.signal,
    timeout: AI_GENERATION_TIMEOUT_MS,
  });

  return response.data;
};
