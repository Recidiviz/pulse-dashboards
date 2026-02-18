// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import React, { useState } from "react";

import { DialogModal, DialogView, ModalText } from "../../../DialogModal";

function joinNumbers(numbers: number[]): string {
  const { length } = numbers;
  switch (length) {
    case 0:
      return "";
    case 1:
      return `question ${numbers[0]}`;
    case 2:
      return `questions ${numbers[0]} and ${numbers[1]}`;
    default:
      return `questions ${numbers.slice(0, -1).join(", ")} and ${numbers[length - 1]}`;
  }
}

export function CafScoreSourceModal({
  lastestCafQs,
  latestRecordQs,
  sentenceHistoryQs,
  jobHistoryQs = [],
}: {
  lastestCafQs: number[];
  latestRecordQs: number[];
  sentenceHistoryQs: number[];
  jobHistoryQs?: number[];
}) {
  const [showCafScoresModal, setShowCafScoresModal] = useState(true);

  return (
    <DialogModal isOpen={showCafScoresModal}>
      <DialogView
        title="About CAF Scores"
        onSubmit={() => setShowCafScoresModal(false)}
        isSubmitDisabled={false}
        submitButtonText="Got it"
      >
        <ModalText>
          <b>For {joinNumbers(sentenceHistoryQs)}</b>, Recidiviz is auto-filling
          scores from this resident's <b>sentence history</b> directly from
          eTOMIS.
          <br />
          <br />
          <b>For {joinNumbers(lastestCafQs)}</b>, Recidiviz is auto-filling
          scores from this resident's <b>last completed CAF</b> directly from
          eTOMIS.
          <br />
          <br />
          <b>For {joinNumbers(latestRecordQs)}</b>, Recidiviz is auto-filling
          scores based on any{" "}
          <b>changes to the resident's disciplinary record</b> using data from
          eTOMIS.
          {jobHistoryQs.length > 0 && (
            <>
              <br />
              <br />
              <b>For {joinNumbers(jobHistoryQs)}</b>, Recidiviz is auto-filling
              scores based on <b>the resident’s class and job history</b> in
              eTOMIS.
            </>
          )}
        </ModalText>
      </DialogView>
    </DialogModal>
  );
}
