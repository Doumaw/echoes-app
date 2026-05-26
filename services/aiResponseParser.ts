import {
  ALLOWED_AI_DURATIONS,
  ALLOWED_AI_NEXT_SITUATIONS,
} from "@/constants/appConstants";
import { ParsedAIResponse } from "@/types/ParsedAIResponse";

function isAllowedDuration(value: number) {
  return ALLOWED_AI_DURATIONS.includes(
    value as (typeof ALLOWED_AI_DURATIONS)[number],
  );
}

function parseJsonPayload(raw: unknown) {
  if (typeof raw !== "string") {
    return raw;
  }

  try {
    return JSON.parse(raw);
  } catch {
  }

  const withoutMarkdown = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(withoutMarkdown);
  } catch {
  }

  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");

  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    return JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
  }

  throw new Error("JSON IA introuvable");
}

export function parseAIResponse(raw: unknown): ParsedAIResponse {
  const payload = parseJsonPayload(raw);
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

  if (!isAllowedDuration((payload as { duration_minutes: number }).duration_minutes)) {
    throw new Error(
      `Durée invalide: ${(payload as { duration_minutes: number }).duration_minutes}`,
    );
  }

  if (
    !ALLOWED_AI_NEXT_SITUATIONS.includes(
      nextSituation as (typeof ALLOWED_AI_NEXT_SITUATIONS)[number],
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
