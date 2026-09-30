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

import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components";

import {
  resolveTrusteeOutcome,
  trusteeFalseQuestionText,
  TrusteeFormSchema,
  UsTnReclassification2026DraftData,
} from "~datatypes";

import { UsTnReclassification2026Form } from "../../../../../WorkflowsStore/Opportunity/Forms/UsTnReclassification2026Form";
import DOCXFormTextArea from "../../../DOCXFormTextArea";
import { useOpportunityFormContext } from "../../../OpportunityFormContext";
import { Bold } from "./styles";

const Block = styled.div`
  margin-top: ${rem(8)};
`;

const HelperText = styled.div`
  margin-bottom: ${rem(2)};
`;

/**
 * DOCXFormTextArea grows to fit whatever is typed into it, but the page around
 * it is a fixed height and clips anything past the bottom edge, so an unbounded
 * box would push the rest of the form off the printed page. Capping the visible
 * rows makes it scroll instead of grow. Nothing is lost from the filed DOCX:
 * that is generated from formData, which holds the full text no matter how many
 * rows are on screen.
 */
const TEXTAREA_MAX_ROWS = 6;

const NotesLabel = styled.div`
  margin: ${rem(6)} 0 ${rem(2)};
`;

export const DENIAL_COPY = {
  empty: "Prefilled from responses above.",
} as const;

/** The denial reasons as plain text, one line per failed question, for the DOCX. */
export function trusteeDenialSummary(
  formData: Partial<TrusteeFormSchema>,
): string {
  const { failedHardBars } = resolveTrusteeOutcome(formData);

  return failedHardBars.length === 0
    ? DENIAL_COPY.empty
    : failedHardBars.map(trusteeFalseQuestionText).join("\n");
}

/** Margins zeroed: the printed page is measured to the pixel, and a list carries its own. */
const DenialList = styled.ul`
  margin: 0;
  padding-left: ${rem(14)};

  & li {
    margin-bottom: ${rem(2)};
  }
`;

/** Derived and not editable, so the filed form always agrees with the table above it. */
export const TrusteeDenialReasons = observer(function TrusteeDenialReasons() {
  const opportunityForm =
    useOpportunityFormContext() as UsTnReclassification2026Form;

  const { failedHardBars } = resolveTrusteeOutcome(opportunityForm.formData);

  return (
    <Block>
      <Bold>Reasons for Denial</Bold>
      {failedHardBars.length === 0 ? (
        <HelperText>{DENIAL_COPY.empty}</HelperText>
      ) : (
        <DenialList>
          {failedHardBars.map((key) => (
            <li key={key}>{trusteeFalseQuestionText(key)}</li>
          ))}
        </DenialList>
      )}
      <NotesLabel>Additional notes:</NotesLabel>
      <DOCXFormTextArea<UsTnReclassification2026DraftData>
        name="trusteeDenialNotes"
        maxRows={TEXTAREA_MAX_ROWS}
      />
    </Block>
  );
});

export const TrusteeNotesForWarden = observer(function TrusteeNotesForWarden() {
  return (
    <Block>
      <Bold>Notes for Warden Review</Bold>
      <HelperText>Context the Warden should see with this packet.</HelperText>
      <DOCXFormTextArea<UsTnReclassification2026DraftData>
        name="trusteeNotesForWarden"
        maxRows={TEXTAREA_MAX_ROWS}
      />
    </Block>
  );
});
