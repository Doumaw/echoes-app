import { TIME_CONFIG } from "@/constants/appConstants";

export function getBusyDurationMs(durationMinutes: number) {
  return durationMinutes * 60 * 1000 * TIME_CONFIG.timeMultiplier;
}
