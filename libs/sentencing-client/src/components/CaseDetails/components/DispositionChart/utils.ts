import { Insight } from "../../../../api";
import { getGenderString, getLsirScoreString } from "../common/utils";

export function getDispositionChartSubtitle(insight: Insight) {
  const {
    gender,
    assessmentScoreBucketStart,
    assessmentScoreBucketEnd,
    offense,
  } = insight;
  const genderString = getGenderString(gender);
  const lsirScoreString = getLsirScoreString(
    assessmentScoreBucketStart,
    assessmentScoreBucketEnd,
  );
  const offenseString = `${offense} offenses`;

  const dispositionSubtitleStrings = [
    genderString,
    lsirScoreString,
    offenseString,
  ].filter((v) => v);

  return dispositionSubtitleStrings.join(", ");
}
