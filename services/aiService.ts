import { AI_API_URL, AI_MODEL } from "@/constants/appConstants";
import { getJuliePrompt } from "@/constants/prompts";
import { GameState } from "@/types/GameState";
import { Message } from "@/types/Message";

const API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_KEY;

export const aiService = {
  async getResponse(history: Message[], gameState: GameState) {
    if (!API_KEY) throw new Error("API Key manquante dans le .env");

    const formattedHistory = [...history].reverse().map((message) => ({
      role: message.isUser ? "user" : "assistant",
      content: message.text,
    }));

    const httpResponse = await fetch(AI_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:19006",
        "X-Title": "Echoes Game",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: "system", content: getJuliePrompt(gameState, history) },
          ...formattedHistory,
        ],
      }),
    });

    if (!httpResponse.ok) {
      throw new Error(`API_ERROR: ${httpResponse.status}`);
    }

    const responseBody = await httpResponse.json();
    return (
      responseBody.choices?.[0]?.message?.content ||
      "Tu es la??? Je ne reçois aucun message..."
    );
  },
};
