import { Insight } from "../../../../api";

export function getGenderString(gender: Insight["rollupGender"]) {
  return gender ? `${gender}s` : undefined;
}

export function getLsirScoreString(
  rollupAssessmentScoreBucketStart: number | null,
  rollupAssessmentScoreBucketEnd: number | null,
) {
  if (
    rollupAssessmentScoreBucketStart === null ||
    rollupAssessmentScoreBucketStart === -1 ||
    rollupAssessmentScoreBucketEnd === null
  ) {
    return undefined;
  }

  let subString;
  if (rollupAssessmentScoreBucketEnd === -1) {
    subString = `${rollupAssessmentScoreBucketStart}+`;
  } else {
    subString = `${rollupAssessmentScoreBucketStart}-${rollupAssessmentScoreBucketEnd}`;
  }

  return `LSI-R = ${subString}`;
}
