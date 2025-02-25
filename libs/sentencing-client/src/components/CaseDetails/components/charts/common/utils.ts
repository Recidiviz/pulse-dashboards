// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

import { captureException } from "@sentry/react";
import _ from "lodash";

import { CaseInsight } from "../../../../../api/APIClient";
import { GenderToDisplayName } from "../../../constants";
import { INDIVIDUALS_STRING } from "./constants";

export function getDescriptionGender(
  rollupGender: NonNullable<CaseInsight["rollupGender"]>,
) {
  let genderString;
  if (GenderToDisplayName[rollupGender] === GenderToDisplayName.MALE) {
    genderString = "men";
  } else if (GenderToDisplayName[rollupGender] === GenderToDisplayName.FEMALE) {
    genderString = "women";
  } else if (
    GenderToDisplayName[rollupGender] === GenderToDisplayName.NON_BINARY
  ) {
    genderString = "non-binary people";
  } else if (GenderToDisplayName[rollupGender] === GenderToDisplayName.TRANS) {
    genderString = "trans people";
  } else if (
    GenderToDisplayName[rollupGender] === GenderToDisplayName.TRANS_FEMALE
  ) {
    genderString = "trans women";
  } else if (
    GenderToDisplayName[rollupGender] === GenderToDisplayName.TRANS_MALE
  ) {
    genderString = "trans men";
  } else {
    genderString = INDIVIDUALS_STRING;
  }

  return ` ${genderString}`;
}

export function getSubtitleGender(gender: CaseInsight["rollupGender"]) {
  return gender
    ? `${_.chain(gender).lowerCase().startCase().value()}s`
    : undefined;
}

export function getSubtitleLsirScore(
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

export function getSentenceLengthBucketText(
  recommendationType: string | null,
  sentenceLengthBucketStart: number,
  sentenceLengthBucketEnd: number,
) {
  // If the bucket range is 0 to infinity, just return the recommendation type
  if (sentenceLengthBucketStart === 0 && sentenceLengthBucketEnd === -1) {
    if (!recommendationType) {
      captureException(
        new Error(
          "Recommendation type is null and there is no sentence length bucket!",
        ),
      );
    }

    return recommendationType ?? "UNKNOWN";
  }

  // If the bucket is 0 - x, just make it < x year(s)
  if (sentenceLengthBucketStart === 0) {
    return `< ${sentenceLengthBucketEnd} Year${sentenceLengthBucketEnd > 1 ? "s" : ""}`;
  }
  // If the bucket is x - infinity, just make it > x year(s)
  if (sentenceLengthBucketEnd === -1) {
    return `> ${sentenceLengthBucketStart} Year${sentenceLengthBucketStart > 1 ? "s" : ""}`;
  }

  // Otherwise, return the range
  return `${sentenceLengthBucketStart}-${sentenceLengthBucketEnd} Years`;
}
