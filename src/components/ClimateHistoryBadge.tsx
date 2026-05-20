import type { ClimateStoryInput } from "../lib/climateStory";
import { getClimateStoryLabel } from "../lib/climateStory";

type Props = {
  years: ClimateStoryInput;
};

export function ClimateHistoryBadge({ years }: Props) {
  const label = getClimateStoryLabel(years);
  return (
    <div className="climate-history-badge">
      <span className="climate-history-badge__prefix">Historisk</span>
      <span className="climate-history-badge__pill">{label}</span>
    </div>
  );
}
