export type DemoCommandAction = "twist" | "reset" | "awake" | "busy" | "sleep";

const DEMO_COMMANDS: Record<string, DemoCommandAction> = {
  "##twist": "twist",
  "##reset": "reset",
  "##awake": "awake",
  "##busy": "busy",
  "##sleep": "sleep",
};

export function getDemoCommandAction(text: string): DemoCommandAction | null {
  return DEMO_COMMANDS[text.trim()] ?? null;
}
