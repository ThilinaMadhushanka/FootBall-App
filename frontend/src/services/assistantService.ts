import api from "../utils/api";

export interface AssistantReply {
  answer: string;
}

export const sendAssistantMessage = async (
  message: string,
  seasonID: number | null,
): Promise<string> => {
  const response = await api.post<AssistantReply>("/assistant/chat", {
    message,
    season_id: seasonID,
  });
  return response.data.answer;
};
