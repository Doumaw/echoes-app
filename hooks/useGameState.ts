import { GameStateContext } from "@/hooks/GameStateContext";
import { useContext } from "react";

export function useGameState() {
  const context = useContext(GameStateContext);

  if (!context) {
    throw new Error("useGameState must be used inside GameStateProvider");
  }

  return context;
}
