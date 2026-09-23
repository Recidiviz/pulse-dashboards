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

import assertNever from "assert-never";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components";

import {
  getTrusteeCriterionNumber,
  resolveAnnexOutcome,
  resolveTrusteeOutcome,
  TRUSTEE_ANNEX_SUB_QUESTION,
  TRUSTEE_CRITERIA,
  TrusteeCriterionKey,
} from "~datatypes";

import { UsTnReclassification2026Form } from "../../../../../WorkflowsStore/Opportunity/Forms/UsTnReclassification2026Form";
import { useOpportunityFormContext } from "../../../OpportunityFormContext";
import { Bold } from "./styles";
import {
  CriterionText,
  listCriterionNumbers,
  ROW_NOTE_COPY,
} from "./TrusteeCriteriaSection";

const ANNEX_CRITERION_NUMBERS = TRUSTEE_CRITERIA.filter(
  (c) => c.affectsAnnex,
).map((c) => getTrusteeCriterionNumber(c.key));

/** Reads as a range only while the Annex criteria are contiguous; falls back to a list. */
const ANNEX_RANGE = ANNEX_CRITERION_NUMBERS.every(
  (n, i) => i === 0 || n === ANNEX_CRITERION_NUMBERS[i - 1] + 1,
)
  ? `${ANNEX_CRITERION_NUMBERS[0]} through ${
      ANNEX_CRITERION_NUMBERS[ANNEX_CRITERION_NUMBERS.length - 1]
    }`
  : listCriterionNumbers(ANNEX_CRITERION_NUMBERS);

/** Both outcomes are derived, and share one box: they are one reading of one set of answers. */
const OutcomeBlock = styled.div`
  border: 2px solid black;
  padding: ${rem(8)} ${rem(10)};
  margin-top: ${rem(12)};
  /* Reserves its space so the page does not change length as outcomes resolve. */
  min-height: ${rem(104)};
`;

const OutcomeHeading = styled.div`
  font-weight: 600;
  margin-bottom: ${rem(3)};
`;

/** The paragraph break that separates the two outcomes inside the one box. */
const SecondOutcome = styled.div`
  margin-top: ${rem(10)};
`;

const FailedCriterion = styled.div`
  margin-top: ${rem(3)};
`;

/** A failed criterion renders as the requirement not met, never as its own inverse. */
export const RequirementNotMet = observer(function RequirementNotMet({
  criterionKey,
}: {
  criterionKey: TrusteeCriterionKey;
}) {
  const criterion = TRUSTEE_CRITERIA.find((c) => c.key === criterionKey);
  if (!criterion) return null;

  return (
    <FailedCriterion>
      <Bold>Criterion {getTrusteeCriterionNumber(criterionKey)} not met.</Bold>{" "}
      Requirement: <CriterionText text={criterion.text} />
    </FailedCriterion>
  );
});

export const TrusteeOutcome = observer(function TrusteeOutcome() {
  const opportunityForm =
    useOpportunityFormContext() as UsTnReclassification2026Form;

  const { status, failedHardBars, failedConditionalCriteria } =
    resolveTrusteeOutcome(opportunityForm.formData);

  // A switch, so a new status fails the build rather than rendering an empty box.
  function body() {
    switch (status) {
      case "INCOMPLETE":
        return (
          <div>
            Complete remaining criteria to determine Trustee eligibility.
          </div>
        );
      case "NOT_ELIGIBLE":
        return (
          <>
            <div>Inmate is not eligible for Trustee custody.</div>
            {failedHardBars.map((key) => (
              <RequirementNotMet key={key} criterionKey={key} />
            ))}
          </>
        );
      case "ELIGIBLE":
        return (
          <div>
            Inmate is eligible for Trustee custody. All{" "}
            {TRUSTEE_CRITERIA.length} criteria are met. Placement still requires
            the Warden approval recorded below.
          </div>
        );
      case "ELIGIBLE_REQUIRES_AC_APPROVAL":
        return (
          <div>
            Inmate is eligible for Trustee custody. All other criteria are met,{" "}
            {failedConditionalCriteria.length > 1 ? "criteria" : "criterion"}{" "}
            {listCriterionNumbers(
              failedConditionalCriteria.map(getTrusteeCriterionNumber),
            )}{" "}
            {failedConditionalCriteria.length > 1 ? "were" : "was"} marked
            False, and the Assistant Commissioner must approve alongside the
            Warden.
          </div>
        );
      default:
        return assertNever(status);
    }
  }

  return (
    <div>
      <OutcomeHeading>Trustee custody</OutcomeHeading>
      {body()}
    </div>
  );
});

export const AnnexOutcome = observer(function AnnexOutcome() {
  const opportunityForm =
    useOpportunityFormContext() as UsTnReclassification2026Form;

  const { formData } = opportunityForm;
  const { status } = resolveAnnexOutcome(formData);

  const viaSexOffenderSentence =
    formData[TRUSTEE_ANNEX_SUB_QUESTION.parentKey] === "false";

  function body() {
    switch (status) {
      case "INCOMPLETE":
        return (
          <div>
            Complete criteria {ANNEX_RANGE} to determine Annex eligibility.
          </div>
        );
      case "ELIGIBLE":
        return (
          <>
            <div>Inmate is eligible for Annex housing placement.</div>
            <FailedCriterion>
              {viaSexOffenderSentence
                ? ROW_NOTE_COPY.annexSexOffenderEligible
                : "Warden approval is required for Annex housing placement."}
            </FailedCriterion>
          </>
        );
      case "NOT_ELIGIBLE":
        return <div>Inmate is not eligible for Annex housing placement.</div>;
      default:
        return assertNever(status);
    }
  }

  return (
    <SecondOutcome>
      <OutcomeHeading>Annex housing</OutcomeHeading>
      {body()}
    </SecondOutcome>
  );
});

/** Both outcomes as one block: not eligible for Trustee but eligible for Annex is valid. */
export const TrusteeEligibility = observer(function TrusteeEligibility() {
  return (
    <OutcomeBlock>
      <TrusteeOutcome />
      <AnnexOutcome />
    </OutcomeBlock>
  );
});
