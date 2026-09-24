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
  getTrusteeCriterionNumber,
  resolveTrusteeOutcome,
  UsTnReclassification2026DraftData,
} from "~datatypes";

import { UsTnReclassification2026Form } from "../../../../../WorkflowsStore/Opportunity/Forms/UsTnReclassification2026Form";
import DOCXFormTextArea from "../../../DOCXFormTextArea";
import { useOpportunityFormContext } from "../../../OpportunityFormContext";
import { Bold } from "./styles";
import { listCriterionNumbers } from "./TrusteeCriteriaSection";

const Block = styled.div`
  margin-top: ${rem(8)};
`;

const HelperText = styled.div`
  margin-bottom: ${rem(2)};
`;

const NotesLabel = styled.div`
  margin: ${rem(6)} 0 ${rem(2)};
`;

/**
 * The failed criteria are derived and not editable, so the filed form always
 * agrees with the criteria table above it. Anything the case manager wants to
 * add goes in the notes below, where nothing recomputes over it.
 *
 * It names the criteria rather than restating them: the eligibility block on
 * the same page already prints each failed requirement verbatim, and repeating
 * thirteen of them costs two extra sheets. The DOCX still carries the full text.
 */
export const TrusteeDenialReasons = observer(function TrusteeDenialReasons() {
  const opportunityForm =
    useOpportunityFormContext() as UsTnReclassification2026Form;

  const { failedHardBars } = resolveTrusteeOutcome(opportunityForm.formData);
  const numbers = failedHardBars.map(getTrusteeCriterionNumber);
  const plural = numbers.length > 1;

  return (
    <Block>
      <Bold>Reasons for Denial</Bold>
      {numbers.length === 0 ? (
        <HelperText>
          Fills in automatically if a criterion in Groups A through D is marked
          False.
        </HelperText>
      ) : (
        <div>
          <Bold>
            {plural ? "Criteria" : "Criterion"} {listCriterionNumbers(numbers)}{" "}
            not met.
          </Bold>{" "}
          The {plural ? "requirements are" : "requirement is"} stated in full
          under Trustee custody above.
        </div>
      )}
      <NotesLabel>Additional notes</NotesLabel>
      <DOCXFormTextArea<UsTnReclassification2026DraftData> name="trusteeDenialNotes" />
    </Block>
  );
});

export const TrusteeNotesForWarden = observer(function TrusteeNotesForWarden() {
  return (
    <Block>
      <Bold>Notes for Warden Review</Bold>
      <HelperText>Context the Warden should see with this packet.</HelperText>
      <DOCXFormTextArea<UsTnReclassification2026DraftData> name="trusteeNotesForWarden" />
    </Block>
  );
});
