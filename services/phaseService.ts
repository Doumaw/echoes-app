import {
  DEMO_SLEEP_DURATION_MS,
  FIRST_SLEEP_AFTER_MS,
  MINUTE_MS,
  NEXT_SLEEP_MAX_DELAY_MS,
  NEXT_SLEEP_MIN_DELAY_MS,
  PLOT_TWIST_AFTER_MS,
  SLEEP_DURATION_MAX_MS,
  SLEEP_DURATION_MIN_MS,
} from "@/constants/appConstants";
import { GameState } from "@/types/GameState";

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
