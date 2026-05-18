import { getBusyDurationMs } from "@/services/timeService";
import { ParsedAIResponse } from "@/types/ParsedAIResponse";
import { GameState } from "@/types/GameState";

export function buildAssistantStateUpdates(
  gameState: GameState,
  parsedResponse: ParsedAIResponse,
): Partial<GameState> {
  const nextStress = Math.min(
    100,
    Math.max(0, (gameState.iaStress ?? 0) + parsedResponse.stressChange),
  );
  const nextTrust = Math.min(
    100,
    Math.max(0, (gameState.iaTrust ?? 0) + parsedResponse.trustChange),
  );

  const updates: Partial<GameState> = {
    iaStress: nextStress,
    iaTrust: nextTrust,
  };

  if (
    parsedResponse.nextSituation === "leg_freed" &&
    gameState.julieSituation !== "leg_freed"
  ) {
    updates.julieSituation = "leg_freed";
  }

  if (parsedResponse.durationMinutes > 0) {
    const now = Date.now();
    updates.juliePhase = "busy";
    updates.julieBusyUntil = now + getBusyDurationMs(parsedResponse.durationMinutes);
    updates.busyReason = parsedResponse.response;
  }

  return updates;
}

export function shouldQueueForLater(gameState: GameState) {
  return (
    gameState.juliePhase === "busy" || gameState.juliePhase === "asleep"
  );
}

export function getChatStatus(gameState: GameState | null) {
  if (!gameState) {
    return "Problème de connexion";
  }

  if (
    gameState.juliePhase === "asleep" ||
    gameState.juliePhase === "busy" ||
    gameState.juliePhase === "finalTwist"
  ) {
    return "Hors ligne";
  }

  return "En ligne";
}
