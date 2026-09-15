import type { Discipline } from "./arrangements";

export type FilterDiscipline = "alle" | Discipline;

export type GearDisciplineGroup = "bike" | "run" | "ski";

/**
 * Buckets a discipline into a broad gear-behaviour group. Running disciplines
 * generate more body heat than cycling at the same air temp, and skiing needs
 * snow-specific wording plus wax tips — everything else keeps the baseline
 * (bike-oriented) rules.
 */
export function gearGroup(discipline: Discipline | string): GearDisciplineGroup {
  if (discipline === "langrenn") return "ski";
  if (discipline === "løping" || discipline === "ultraløp") return "run";
  return "bike";
}

/** Plain text labels for each discipline, used in cards and filter pills. */
export const DISCIPLINE_LABEL: Record<Discipline, string> = {
  landevei: "Landevei",
  gravel: "Gravel",
  terreng: "Terreng",
  langrenn: "Langrenn",
  triathlon: "Triathlon",
  ultraløp: "Ultraløp",
  løping: "Løping",
  cx: "Sykkelkross",
};

/** Labels with emoji, used in grouped selects (e.g. NavBar). */
export const DISCIPLINE_LABEL_WITH_EMOJI: Record<Discipline, string> = {
  terreng: "🚵 Terreng",
  landevei: "🚴 Landevei",
  gravel: "🪨 Gravel",
  langrenn: "⛷️ Langrenn",
  triathlon: "🏊 Triathlon",
  ultraløp: "🏃 Ultraløp",
  løping: "🏃 Løping",
  cx: "🚵 Sykkelkross",
};

/** Labels including the "alle" catch-all filter, used in filter pills. */
export const FILTER_DISCIPLINE_LABEL: Record<FilterDiscipline, string> = {
  alle: "Alle",
  ...DISCIPLINE_LABEL,
};
