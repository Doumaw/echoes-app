import {
  ALLOWED_AI_DURATIONS,
  ALLOWED_AI_NEXT_SITUATIONS,
} from "@/constants/appConstants";
import { ParsedAIResponse } from "@/types/ParsedAIResponse";

interface AIResponsePayload {
  stress_change: number;
  trust_change: number;
  response: string;
  duration_minutes: number;
  next_situation?: unknown;
}

// Validation du contrat IA
function isAllowedDuration(durationMinutes: number) {
  return ALLOWED_AI_DURATIONS.includes(
    durationMinutes as (typeof ALLOWED_AI_DURATIONS)[number],
  );
}

function isAllowedNextSituation(nextSituation: unknown) {
  return ALLOWED_AI_NEXT_SITUATIONS.includes(
    nextSituation as (typeof ALLOWED_AI_NEXT_SITUATIONS)[number],
  );
}

function isAIResponsePayload(payload: unknown): payload is AIResponsePayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    typeof (payload as { stress_change?: unknown }).stress_change === "number" &&
    typeof (payload as { trust_change?: unknown }).trust_change === "number" &&
    typeof (payload as { response?: unknown }).response === "string" &&
    typeof (payload as { duration_minutes?: unknown }).duration_minutes === "number"
  );
}

function tryParseJson(jsonText: string) {
  try {
    return JSON.parse(jsonText);
  } catch {
    return undefined;
  }
}

// Extraction JSON
function extractJsonPayload(rawAIResponse: unknown) {
  if (typeof rawAIResponse !== "string") {
    return rawAIResponse;
  }

  const directPayload = tryParseJson(rawAIResponse);
  if (directPayload !== undefined) {
    return directPayload;
  }

  // On retente avec un texte nettoyé.
  const withoutMarkdown = rawAIResponse
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  const markdownPayload = tryParseJson(withoutMarkdown);
  if (markdownPayload !== undefined) {
    return markdownPayload;
  }

  // On retente en isolant le JSON entre accolades.
  const jsonStart = rawAIResponse.indexOf("{");
  const jsonEnd = rawAIResponse.lastIndexOf("}");

  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    const isolatedPayload = tryParseJson(rawAIResponse.slice(jsonStart, jsonEnd + 1));

    if (isolatedPayload !== undefined) {
      return isolatedPayload;
    }
  }

  throw new Error("JSON IA introuvable");
}

// Conversion en réponse utilisable par le jeu
export function parseAIResponse(rawAIResponse: unknown): ParsedAIResponse {
  const payload = extractJsonPayload(rawAIResponse);

  // Si un champ obligatoire manque ou a un mauvais type, la réponse est invalide.
  if (!isAIResponsePayload(payload)) {
    throw new Error("Format inattendu");
  }

  const nextSituation = payload.next_situation ?? null;

  if (!isAllowedDuration(payload.duration_minutes)) {
    throw new Error(`Durée invalide: ${payload.duration_minutes}`);
  }

  if (!isAllowedNextSituation(nextSituation)) {
    throw new Error(`Situation invalide: ${String(nextSituation)}`);
  }

  // Conversion du format IA vers le format interne du jeu.
  return {
    stressChange: payload.stress_change,
    trustChange: payload.trust_change,
    response: payload.response,
    durationMinutes: payload.duration_minutes,
    nextSituation: nextSituation as "leg_freed" | null,
  };
}
