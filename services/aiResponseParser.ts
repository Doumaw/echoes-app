import { ParsedAIResponse } from "@/types/AIResponse";

const ALLOWED_DURATIONS = [0, 5, 10, 15, 20] as const;
const ALLOWED_DURATION_VALUES: readonly number[] = ALLOWED_DURATIONS;
const ALLOWED_NEXT_SITUATIONS = ["leg_freed", null] as const;

export function parseAIResponse(raw: unknown): ParsedAIResponse {
  const payload = typeof raw === "string" ? JSON.parse(raw) : raw;
  const nextSituation = (payload as { next_situation?: unknown })?.next_situation ?? null;

  if (
    typeof payload !== "object" ||
    payload === null ||
    typeof (payload as { stress_change?: unknown }).stress_change !== "number" ||
    typeof (payload as { trust_change?: unknown }).trust_change !== "number" ||
    typeof (payload as { response?: unknown }).response !== "string" ||
    typeof (payload as { duration_minutes?: unknown }).duration_minutes !== "number"
  ) {
    throw new Error("Format inattendu");
  }

  if (!ALLOWED_DURATION_VALUES.includes((payload as { duration_minutes: number }).duration_minutes)) {
    throw new Error(
      `Durée invalide: ${(payload as { duration_minutes: number }).duration_minutes}`,
    );
  }

  if (
    !ALLOWED_NEXT_SITUATIONS.includes(
      nextSituation as (typeof ALLOWED_NEXT_SITUATIONS)[number],
    )
  ) {
    throw new Error(`Situation invalide: ${String(nextSituation)}`);
  }

  return {
    stressChange: (payload as { stress_change: number }).stress_change,
    trustChange: (payload as { trust_change: number }).trust_change,
    response: (payload as { response: string }).response,
    durationMinutes: (payload as { duration_minutes: number }).duration_minutes,
    nextSituation: nextSituation as "leg_freed" | null,
  };
}
