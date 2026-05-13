import { isDev } from "@/constants/timeConfig";

export type DevCommandAction = "twist" | "reset";

const DEV_COMMANDS: Record<string, DevCommandAction> = {
  "##twist": "twist",
  "##reset": "reset",
};

export function getDevCommandAction(text: string): DevCommandAction | null {
  if (!isDev()) {
    return null;
  }

  return DEV_COMMANDS[text.trim()] ?? null;
}
