export interface ParsedAIResponse {
  stressChange: number;
  trustChange: number;
  response: string;
  durationMinutes: number;
  nextSituation: "leg_freed" | null;
}
