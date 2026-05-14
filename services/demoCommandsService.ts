import { DEMO_COMMANDS, DemoCommandAction } from "@/constants/appConstants";

export function getDemoCommandAction(text: string): DemoCommandAction | null {
  return DEMO_COMMANDS[text.trim()] ?? null;
}
