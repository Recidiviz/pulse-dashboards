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

interface LsirTextProps {
  rollupAssessmentScoreBucketStart: number | null;
  rollupAssessmentScoreBucketEnd: number | null;
}

export function LsirScoreText({
  rollupAssessmentScoreBucketStart,
  rollupAssessmentScoreBucketEnd,
}: LsirTextProps) {
  if (
    rollupAssessmentScoreBucketStart === null ||
    rollupAssessmentScoreBucketStart === -1 ||
    rollupAssessmentScoreBucketEnd === null
  ) {
    return null;
  }

  if (rollupAssessmentScoreBucketEnd === -1) {
    return (
      <>
        {" "}
        with{" "}
        <span>LSI-R scores of at least {rollupAssessmentScoreBucketStart}</span>
      </>
    );
  }

  return (
    <>
      {" "}
      with{" "}
      <span>
        LSI-R scores between {rollupAssessmentScoreBucketStart} and{" "}
        {rollupAssessmentScoreBucketEnd}
      </span>
    </>
  );
}
