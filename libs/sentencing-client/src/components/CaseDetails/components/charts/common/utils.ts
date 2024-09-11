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

import _ from "lodash";

import { Insight } from "../../../../../api/APIClient";
import { GenderToDisplayName } from "../../../constants";

export function getDescriptionGender(rollupGender: Insight["gender"]) {
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
  }

  return ` ${genderString}`;
}

export function getSubtitleGender(gender: Insight["rollupGender"]) {
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
