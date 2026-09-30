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
  trusteeFalseQuestionText,
  TrusteeFormSchema,
} from "~datatypes";

import { UsTnReclassification2026Form } from "../../../../../WorkflowsStore/Opportunity/Forms/UsTnReclassification2026Form";
import { useOpportunityFormContext } from "../../../OpportunityFormContext";
import { Bold } from "./styles";
import { listCriterionNumbers, ROW_NOTE_COPY } from "./TrusteeCriteriaSection";

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

/** A verdict heading: underlined on screen, plain text in the DOCX. */
type OutcomeHeadingCopy = {
  lead: string;
  /** The underlined segment, always the verdict itself. */
  emphasis: string;
  tail: string;
};

export const TRUSTEE_OUTCOME_COPY = {
  incomplete: "Complete remaining questions to determine Trustee eligibility.",
  notEligible: {
    lead: "Inmate is ",
    emphasis: "not eligible",
    tail: " for Trustee custody",
  },
  eligible: {
    lead: "Inmate ",
    emphasis: "is eligible",
    tail: " for Trustee custody",
  },
  allQuestionsMet: `All ${TRUSTEE_CRITERIA.length} questions are met. Warden approval required.`,
  acApproval:
    "Assistant Commissioner approval required alongside the Warden approval.",
} as const satisfies Record<string, string | OutcomeHeadingCopy>;

export const ANNEX_OUTCOME_COPY = {
  incomplete: `Complete questions ${ANNEX_RANGE} to determine Annex eligibility.`,
  eligible: {
    lead: "Inmate ",
    emphasis: "is eligible",
    tail: " for Annex housing placement",
  },
  notEligible: {
    lead: "Inmate is ",
    emphasis: "not eligible",
    tail: " for Annex housing placement",
  },
  wardenApproval: "Warden approval required for Annex housing.",
  sexOffenderWardenApproval: `${ROW_NOTE_COPY.annexSexOffenderEligible} Warden approval required.`,
} as const satisfies Record<string, string | OutcomeHeadingCopy>;

export const CONTINUE_TO_APPROVALS_COPY =
  "Continue to the next page for approvals and signatures";

/** Flattened for the DOCX, which takes one text placeholder. */
function outcomeHeadingText(copy: OutcomeHeadingCopy): string {
  return `${copy.lead}${copy.emphasis}${copy.tail}`;
}

/** The Trustee outcome as plain text, one entry per printed line. */
export function trusteeOutcomeLines(
  formData: Partial<TrusteeFormSchema>,
): string[] {
  const { status, failedHardBars, failedConditionalCriteria } =
    resolveTrusteeOutcome(formData);

  switch (status) {
    case "INCOMPLETE":
      return [TRUSTEE_OUTCOME_COPY.incomplete];
    case "NOT_ELIGIBLE":
      return [
        outcomeHeadingText(TRUSTEE_OUTCOME_COPY.notEligible),
        ...failedHardBars.map(trusteeFalseQuestionText),
      ];
    case "ELIGIBLE":
      return [
        outcomeHeadingText(TRUSTEE_OUTCOME_COPY.eligible),
        TRUSTEE_OUTCOME_COPY.allQuestionsMet,
      ];
    case "ELIGIBLE_REQUIRES_AC_APPROVAL":
      return [
        outcomeHeadingText(TRUSTEE_OUTCOME_COPY.eligible),
        ...failedConditionalCriteria.map(trusteeFalseQuestionText),
        TRUSTEE_OUTCOME_COPY.acApproval,
      ];
    default:
      return assertNever(status);
  }
}

/** The Annex outcome as plain text, one entry per printed line. */
export function annexOutcomeLines(
  formData: Partial<TrusteeFormSchema>,
): string[] {
  const { status } = resolveAnnexOutcome(formData);

  switch (status) {
    case "INCOMPLETE":
      return [ANNEX_OUTCOME_COPY.incomplete];
    case "ELIGIBLE":
      return [
        outcomeHeadingText(ANNEX_OUTCOME_COPY.eligible),
        formData[TRUSTEE_ANNEX_SUB_QUESTION.parentKey] === "false"
          ? ANNEX_OUTCOME_COPY.sexOffenderWardenApproval
          : ANNEX_OUTCOME_COPY.wardenApproval,
      ];
    case "NOT_ELIGIBLE":
      return [outcomeHeadingText(ANNEX_OUTCOME_COPY.notEligible)];
    default:
      return assertNever(status);
  }
}

/** Both outcomes are derived, and share one box: they are one reading of one set of answers. */
const OutcomeBlock = styled.div`
  border: 2px solid black;
  padding: ${rem(8)} ${rem(10)};
  margin-top: ${rem(12)};
  /* Reserves its space so the page does not change length as outcomes resolve. */
  min-height: ${rem(104)};
`;

const OutcomeHeadingText = styled.div`
  font-weight: 600;
  margin-bottom: ${rem(3)};
`;

const Underlined = styled.span`
  text-decoration: underline;
`;

/** The paragraph break that separates the two outcomes inside the one box. */
const SecondOutcome = styled.div`
  margin-top: ${rem(10)};
`;

/** Margins zeroed: the printed page is measured to the pixel, and a list carries its own. */
const FalseQuestionList = styled.ul`
  margin: 0;
  padding-left: ${rem(14)};

  & li {
    margin-bottom: ${rem(2)};
  }
`;

const ContinueNote = styled.div`
  margin-top: ${rem(6)};
  text-align: right;
  font-style: italic;
`;

function OutcomeHeading({ copy }: { copy: OutcomeHeadingCopy }) {
  return (
    <OutcomeHeadingText>
      <Bold>
        {copy.lead}
        <Underlined>{copy.emphasis}</Underlined>
        {copy.tail}
      </Bold>
    </OutcomeHeadingText>
  );
}

function FalseQuestions({ keys }: { keys: readonly TrusteeCriterionKey[] }) {
  if (keys.length === 0) return null;

  return (
    <FalseQuestionList>
      {keys.map((key) => (
        <li key={key}>{trusteeFalseQuestionText(key)}</li>
      ))}
    </FalseQuestionList>
  );
}

export const TrusteeOutcome = observer(function TrusteeOutcome() {
  const opportunityForm =
    useOpportunityFormContext() as UsTnReclassification2026Form;

  const { status, failedHardBars, failedConditionalCriteria } =
    resolveTrusteeOutcome(opportunityForm.formData);

  // A switch, so a new status fails the build rather than rendering an empty box.
  switch (status) {
    case "INCOMPLETE":
      return (
        <OutcomeHeadingText>
          <Bold>{TRUSTEE_OUTCOME_COPY.incomplete}</Bold>
        </OutcomeHeadingText>
      );
    case "NOT_ELIGIBLE":
      return (
        <>
          <OutcomeHeading copy={TRUSTEE_OUTCOME_COPY.notEligible} />
          <FalseQuestions keys={failedHardBars} />
        </>
      );
    case "ELIGIBLE":
      return (
        <>
          <OutcomeHeading copy={TRUSTEE_OUTCOME_COPY.eligible} />
          <div>{TRUSTEE_OUTCOME_COPY.allQuestionsMet}</div>
        </>
      );
    case "ELIGIBLE_REQUIRES_AC_APPROVAL":
      return (
        <>
          <OutcomeHeading copy={TRUSTEE_OUTCOME_COPY.eligible} />
          <FalseQuestions keys={failedConditionalCriteria} />
          <div>{TRUSTEE_OUTCOME_COPY.acApproval}</div>
        </>
      );
    default:
      return assertNever(status);
  }
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
          <OutcomeHeadingText>
            <Bold>{ANNEX_OUTCOME_COPY.incomplete}</Bold>
          </OutcomeHeadingText>
        );
      case "ELIGIBLE":
        return (
          <>
            <OutcomeHeading copy={ANNEX_OUTCOME_COPY.eligible} />
            <div>
              {viaSexOffenderSentence
                ? ANNEX_OUTCOME_COPY.sexOffenderWardenApproval
                : ANNEX_OUTCOME_COPY.wardenApproval}
            </div>
          </>
        );
      case "NOT_ELIGIBLE":
        return <OutcomeHeading copy={ANNEX_OUTCOME_COPY.notEligible} />;
      default:
        return assertNever(status);
    }
  }

  return <SecondOutcome>{body()}</SecondOutcome>;
});

/** Both outcomes as one block: not eligible for Trustee but eligible for Annex is valid. */
export const TrusteeEligibility = observer(function TrusteeEligibility() {
  return (
    <>
      <OutcomeBlock>
        <TrusteeOutcome />
        <AnnexOutcome />
      </OutcomeBlock>
      <ContinueNote>{CONTINUE_TO_APPROVALS_COPY} &darr;</ContinueNote>
    </>
  );
});
