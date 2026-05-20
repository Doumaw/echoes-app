import { parseAIResponse } from "@/services/aiResponseParser";
import { buildAssistantStateUpdates } from "@/services/chatService";
import { GameState } from "@/types/GameState";
import { ParsedAIResponse } from "@/types/ParsedAIResponse";

export function canRequestAssistantReply(
  gameState: GameState | null | undefined,
  isTyping: boolean,
) {
  if (isTyping || !gameState) {
    return false;
  }

  return (
    gameState.juliePhase !== "asleep" &&
    gameState.juliePhase !== "busy" &&
    gameState.juliePhase !== "finalTwist"
  );
}

export function parseAssistantResponse(rawResponse: unknown) {
  const parsedResponse = parseAIResponse(rawResponse);

  return {
    parsedResponse,
    stateUpdatesBuilder: (gameState: GameState) =>
      buildAssistantStateUpdates(gameState, parsedResponse),
  };
}

export function logParsedAssistantResponse(parsedResponse: ParsedAIResponse) {
  console.log("[useMessages] IA Response (valid):", {
    duration_minutes: parsedResponse.durationMinutes,
    stress_change: parsedResponse.stressChange,
    trust_change: parsedResponse.trustChange,
    next_situation: parsedResponse.nextSituation,
  });
}
