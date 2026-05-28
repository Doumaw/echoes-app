import {
  ALLOWED_AI_DURATIONS,
  ALLOWED_AI_NEXT_SITUATIONS,
  DEMO_SLEEP_DURATION_MS,
  FIRST_SLEEP_AFTER_MS,
  MINUTE_MS,
  NEXT_SLEEP_MAX_DELAY_MS,
  NEXT_SLEEP_MIN_DELAY_MS,
  PLOT_TWIST_AFTER_MS,
  SLEEP_DURATION_MAX_MS,
  SLEEP_DURATION_MIN_MS,
} from "@/constants/appConstants";
import { ParsedAIResponse } from "@/types/ParsedAIResponse";
import { GameState, JuliePhase } from "@/types/GameState";

export function getChatStatus(juliePhase: JuliePhase | undefined) {
  if (!juliePhase) {
    return "Problème de connexion";
  }

  if (
    juliePhase === "asleep" ||
    juliePhase === "busy" ||
    juliePhase === "finalTwist"
  ) {
    return "Hors ligne";
  }

  return "En ligne";
}

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
  return gameState.juliePhase === "busy" || gameState.juliePhase === "asleep";
}

export function pickRandomMessage(messages: string[]) {
  return messages[Math.floor(Math.random() * messages.length)];
}

export function getRandomSleepDurationMs() {
  return (
    SLEEP_DURATION_MIN_MS +
    Math.floor(Math.random() * (SLEEP_DURATION_MAX_MS - SLEEP_DURATION_MIN_MS))
  );
}

export function getNextSleepTimestamp(from: number) {
  return (
    from +
    NEXT_SLEEP_MIN_DELAY_MS +
    Math.floor(Math.random() * (NEXT_SLEEP_MAX_DELAY_MS - NEXT_SLEEP_MIN_DELAY_MS))
  );
}

export function getFirstSleepTimestamp(firstMessageTimestamp: number) {
  return firstMessageTimestamp + FIRST_SLEEP_AFTER_MS;
}

export function getDemoSleepDurationMs() {
  return DEMO_SLEEP_DURATION_MS;
}

export function getBusyDurationMs(durationMinutes: number) {
  return durationMinutes * MINUTE_MS;
}

export function shouldTriggerFinalTwist(gameState: GameState, now: number) {
  return Boolean(
    gameState.firstMessageTimestamp &&
      now - gameState.firstMessageTimestamp > PLOT_TWIST_AFTER_MS &&
      gameState.juliePhase !== "finalTwist",
  );
}

export function shouldWakeFromBusy(gameState: GameState, now: number) {
  return Boolean(
    gameState.juliePhase === "busy" &&
      gameState.julieBusyUntil &&
      now >= gameState.julieBusyUntil,
  );
}

export function shouldWakeFromSleep(gameState: GameState, now: number) {
  return Boolean(
    gameState.juliePhase === "asleep" &&
      gameState.julieWakeUpTime &&
      now >= gameState.julieWakeUpTime,
  );
}

export function shouldStartSleep(gameState: GameState, now: number) {
  return Boolean(
    gameState.hasSeenIntro &&
      gameState.juliePhase === "awake" &&
      gameState.nextSleepAt &&
      now >= gameState.nextSleepAt &&
      (!gameState.pendingMessageIds || gameState.pendingMessageIds.length === 0),
  );
}

export function isAllowedAiDuration(value: number) {
  return ALLOWED_AI_DURATIONS.includes(
    value as (typeof ALLOWED_AI_DURATIONS)[number],
  );
}

export function isAllowedAiNextSituation(value: unknown) {
  return ALLOWED_AI_NEXT_SITUATIONS.includes(
    value as (typeof ALLOWED_AI_NEXT_SITUATIONS)[number],
  );
}
