export type RunningCategory = "10k" | "halvmaraton" | "maraton" | "ultra";

export const RUNNING_CATEGORY_LABEL: Record<RunningCategory, string> = {
  "10k": "10K",
  halvmaraton: "Halvmaraton",
  maraton: "Maraton",
  ultra: "Ultra",
};

export function getRunningCategory(distance: number): RunningCategory {
  if (distance <= 10) return "10k";
  if (distance <= 22) return "halvmaraton";
  if (distance <= 45) return "maraton";
  return "ultra";
}
