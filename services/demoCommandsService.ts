import { DEMO_COMMANDS } from "@/constants/appConstants";
import { DemoCommandAction } from "@/types/DemoCommandAction";

export function getDemoCommandAction(text: string): DemoCommandAction | null {
  return DEMO_COMMANDS[text.trim()] ?? null;
}
