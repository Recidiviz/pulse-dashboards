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
import { ChangeEventHandler, Fragment, MouseEventHandler } from "react";
import styled from "styled-components";

import {
  getTrusteeCriterionNumber,
  resolveTrusteeSkipState,
  TRUSTEE_ANNEX_SUB_QUESTION,
  TRUSTEE_CRITERIA,
  TRUSTEE_CRITERIA_GROUPS,
  TRUSTEE_CRITERIA_SECTIONS,
  TrusteeCriterion,
  TrusteeCriterionGroup,
  TrusteeCriterionKey,
} from "~datatypes";
import { palette } from "~design-system";

import { UsTnReclassification2026Form } from "../../../../../WorkflowsStore/Opportunity/Forms/UsTnReclassification2026Form";
import { useOpportunityFormContext } from "../../../OpportunityFormContext";
import { Bold, FormFont } from "./styles";

const GROUP_KEYS = Object.keys(
  TRUSTEE_CRITERIA_GROUPS,
) as TrusteeCriterionGroup[];

/** Section 1 is exactly the criteria that determine Annex eligibility. */
export const TRUSTEE_SECTIONS = TRUSTEE_CRITERIA_SECTIONS.map((section) => ({
  section,
  groups: GROUP_KEYS.filter(
    (key) => TRUSTEE_CRITERIA_GROUPS[key].section === section,
  ).map((key) => {
    const group = TRUSTEE_CRITERIA_GROUPS[key];
    return {
      key,
      label: group.label,
      note: "note" in group ? group.note : undefined,
      criteria: TRUSTEE_CRITERIA.filter((c) => c.group === key),
    };
  }),
}));

const CriteriaTable = styled.table`
  border-collapse: collapse;
  border: 1px solid black;
  width: 100%;
  table-layout: fixed;

  & th,
  td {
    border: 1px solid black;
    padding: 0.3rem 0.25rem;
    vertical-align: top;
  }
`;

const NumberCell = styled.th`
  width: ${rem(28)};
  text-align: center;
  font-weight: 600;
`;

const AnswerCell = styled.td`
  width: ${rem(40)};
  text-align: center;
`;

const CriterionCell = styled.td`
  line-height: 1.35;
`;

const HelperText = styled.div`
  margin-top: ${rem(3)};
`;

/** Page font is rem(11) and CriterionCell sets line-height: 1.35. */
const NOTE_LINE_HEIGHT = 11 * 1.35;

/** The radio row under the sub-question, which is control height, not text. */
const SUB_QUESTION_CONTROL_HEIGHT = 18;

/** Shared by the note slot's top margin and the sub-question's. */
const SLOT_GAP = 3;

/** The sub-question's box: a rule top and bottom, plus its vertical padding. */
const SUB_QUESTION_BOX_CHROME = 2 + 2 * SLOT_GAP;

/** Between the question and its controls when the box wraps them. */
const SUB_QUESTION_ROW_GAP = 12;

/** The box wraps: the controls sit on their own line under the question. */
const SUB_QUESTION_BOX =
  SUB_QUESTION_BOX_CHROME +
  NOTE_LINE_HEIGHT +
  SUB_QUESTION_ROW_GAP +
  SUB_QUESTION_CONTROL_HEIGHT;

/** Criterion 3 holds the boxed sub-question plus a two-line note, the only one that needs two. */
const SUB_QUESTION_RESERVE =
  SLOT_GAP + SUB_QUESTION_BOX + SLOT_GAP + 2 * NOTE_LINE_HEIGHT;

/**
 * The slot holds its height whether or not a note shows, so the page does not
 * reflow as answers are entered. Reserving less than the content clips it.
 */
const NoteSlot = styled.div<{ $reserveSubQuestion: boolean }>`
  margin-top: ${rem(SLOT_GAP)};
  min-height: ${({ $reserveSubQuestion }) =>
    $reserveSubQuestion ? rem(SUB_QUESTION_RESERVE) : rem(NOTE_LINE_HEIGHT)};
`;

/** Greyed rather than hidden, so the printed page is the same either way. */
const NotRequiredCell = styled.td`
  text-align: center;
  font-style: italic;
`;

/** slate80 is the lightest palette grey that clears 4.5:1 on white, and this is small print. */
const NotRequired = styled.span`
  color: ${palette.slate80};
`;

/** Boxed, and above the note, so it does not read as part of criterion 3's own text. */
const SubQuestion = styled.div`
  margin-top: ${rem(SLOT_GAP)};
  border: 1px solid black;
  padding: ${rem(SLOT_GAP)} ${rem(7)};
  display: flex;
  align-items: center;
  gap: ${rem(SUB_QUESTION_ROW_GAP)};
  flex-wrap: wrap;

  & label {
    margin: 0 ${rem(8)} 0 ${rem(4)};
    font-weight: 400;
  }
`;

/** Separated from the box above it by the same gap the box has from the text. */
const FailureNote = styled.div`
  margin-top: ${rem(SLOT_GAP)};
`;

/** A heavy rule down the left edge of a failed hard bar, so failures read as a set. */
const FAILED_HARD_BAR_EDGE = "3px solid black";

const GroupHeaderRow = styled.tr`
  & th {
    text-align: left;
    font-weight: 600;
    background-color: #eee;
  }
`;

const GroupNote = styled.div`
  font-weight: 400;
  margin-top: ${rem(2)};
`;

const SectionHeading = styled.h2`
  font-size: ${rem(10)};
  font-weight: 600;
  margin: ${rem(8)} 0 ${rem(4)};
`;

const FormTitle = styled.h1`
  ${FormFont}
  text-align: center;
  font-size: ${rem(12)};
  font-weight: 600;
  margin: 0 0 ${rem(10)};
`;

const InstrumentName = styled.span`
  font-weight: 400;
`;

const GuideReference = styled.div`
  margin-bottom: ${rem(10)};
`;

const PartHeading = styled.h2`
  font-size: inherit;
  font-weight: 600;
  margin: 0 0 ${rem(3)};
`;

/** Margins are tight on purpose: the first criterion group has to fit the same sheet. */
const InstructionList = styled.ul`
  margin: ${rem(4)} 0 ${rem(10)};
  padding-left: ${rem(16)};

  & li {
    margin-bottom: ${rem(2)};
  }
`;

/** Formats criterion numbers as "1, 2, 4, 5 and 6". Shared so the page spells the list one way. */
export function listCriterionNumbers(numbers: readonly number[]): string {
  if (numbers.length === 0) return "";
  if (numbers.length === 1) return `${numbers[0]}`;
  return `${numbers.slice(0, -1).join(", ")} and ${numbers[numbers.length - 1]}`;
}

/**
 * "criterion 15 was marked False" or "criteria 13, 14 and 15 were marked False".
 * Shared so the outcome block and the approvals row cannot word it differently.
 * Carries no trailing punctuation; the caller supplies it.
 */
export function criteriaMarkedFalse(numbers: readonly number[]): string {
  const plural = numbers.length > 1;

  return `${plural ? "criteria" : "criterion"} ${listCriterionNumbers(
    numbers,
  )} ${plural ? "were" : "was"} marked False`;
}

/** "1 to 13" while the numbers are contiguous, and the plain list when not. */
function criterionRange(numbers: readonly number[]): string {
  const contiguous = numbers.every(
    (n, i) => i === 0 || n === numbers[i - 1] + 1,
  );

  return contiguous && numbers.length > 1
    ? `${numbers[0]} to ${numbers[numbers.length - 1]}`
    : listCriterionNumbers(numbers);
}

const criterionNumbersWhere = (
  predicate: (criterion: TrusteeCriterion) => boolean,
) =>
  TRUSTEE_CRITERIA.filter(predicate).map((c) =>
    getTrusteeCriterionNumber(c.key),
  );

/** Read off the criteria list rather than hardcoded; the set has been reordered before. */
const HARD_BAR_RANGE = criterionRange(
  criterionNumbersWhere((c) => c.isHardBar),
);

const CONDITIONAL_NUMBERS = criterionNumbersWhere((c) => !c.isHardBar);

const SUB_QUESTION_PARENT_NUMBER = getTrusteeCriterionNumber(
  TRUSTEE_ANNEX_SUB_QUESTION.parentKey,
);

/** The Annex criteria the sub-question cannot rescue, so all of them but its parent. */
const ANNEX_REQUIRED_NUMBERS = criterionNumbersWhere(
  (c) => c.affectsAnnex && c.key !== TRUSTEE_ANNEX_SUB_QUESTION.parentKey,
);

export function TrusteeAssessmentHeader() {
  return (
    <div>
      <FormTitle>
        <InstrumentName>TENNESSEE CLASSIFICATION INSTRUMENT</InstrumentName>
        <br />
        TRUSTEE AND ANNEX ASSESSMENT
      </FormTitle>

      {/* The mock links the guide. A printed form has nowhere to link to, so
          it reads as a plain reference, the same way criterion 4's Offense
          Severity List does. */}
      <GuideReference>
        See full instructions for <Bold>Trustee Assessment</Bold> and{" "}
        <Bold>Annex Placement</Bold> in the Pilot Classification User&rsquo;s
        Guide
      </GuideReference>

      <PartHeading>Part 1. Eligibility criteria</PartHeading>
      <div>Completed by the Case Manager.</div>
      <InstructionList>
        <li>
          Criteria {HARD_BAR_RANGE} must be marked True for placement on Trustee
          custody. True always means the inmate clears the requirement.
        </li>
        <li>
          If {CONDITIONAL_NUMBERS.length > 1 ? "criteria" : "criterion"}{" "}
          {listCriterionNumbers(CONDITIONAL_NUMBERS).replace(" and ", " or ")}{" "}
          is False, the Assistant Commissioner for Prison Operations or their
          designee must approve Trustee custody placement.
        </li>
        <li>Trustee custody inmates should be placed in Annex housing.</li>
        <li>
          An inmate who is not eligible for Trustee custody may still be
          eligible for Annex housing. Criteria{" "}
          {listCriterionNumbers(ANNEX_REQUIRED_NUMBERS)} must be True. Criterion{" "}
          {SUB_QUESTION_PARENT_NUMBER} may be False if the inmate has 7 years or
          less remaining to serve.
        </li>
        {/* "Part 2" has nothing to point at: the approvals section is headed
            "Approvals recorded". Kept verbatim anyway, because the copy is
            TDOC's and the design does label that section Part 2, so this is a
            question for policy staff rather than one to settle here. */}
        <li>
          Warden approval is required for every Trustee custody placement. Any
          additional approvers are listed in Part 2.
        </li>
      </InstructionList>
    </div>
  );
}

export const ROW_NOTE_COPY = {
  /** Bold, via the same `**` convention the criterion text uses. */
  trusteeNotMet: "**Trustee requirement not met.**",
  annexNotMet: "Annex requirement not met.",
  acApproval:
    "**The Assistant Commissioner for Prison Operations or their designee must approve Trustee custody placement. That approval is recorded below.**",
  annexSexOffenderEligible:
    "Sex offenders with 7 years or less remaining to serve on their sentence are eligible for Annex housing.",
} as const;

/**
 * The note under a criterion marked False. Derived from the criterion's flags
 * rather than its number, so reordering the form cannot misattach a note.
 */
export function criterionFailureNote(
  criterion: TrusteeCriterion,
  answer: string | undefined,
  subQuestionAnswer?: string,
): string | undefined {
  if (answer !== "false") return undefined;

  // Criteria 14 and 15 do not disqualify; a False adds an approver.
  if (!criterion.isHardBar) return ROW_NOTE_COPY.acApproval;

  if (criterion.key === TRUSTEE_ANNEX_SUB_QUESTION.parentKey) {
    // The sub-question decides Annex here, so that half of the note waits for it.
    if (subQuestionAnswer === "true") {
      return `${ROW_NOTE_COPY.trusteeNotMet} ${ROW_NOTE_COPY.annexSexOffenderEligible}`;
    }
    if (subQuestionAnswer === "false") {
      return `${ROW_NOTE_COPY.trusteeNotMet} ${ROW_NOTE_COPY.annexNotMet}`;
    }
    return ROW_NOTE_COPY.trusteeNotMet;
  }

  return criterion.affectsAnnex
    ? `${ROW_NOTE_COPY.trusteeNotMet} ${ROW_NOTE_COPY.annexNotMet}`
    : ROW_NOTE_COPY.trusteeNotMet;
}

/** Splits a criterion into its plain and `**`-delimited bold segments. */
export function criterionSegments(
  text: string,
): { key: string; text: string; bold: boolean }[] {
  return text
    .split("**")
    .map((segment, index) => ({
      key: `${index}:${segment}`,
      text: segment,
      bold: index % 2 === 1,
    }))
    .filter(({ text: segment }) => segment.length > 0);
}

/** Renders the negation in each criterion bold, so the polarity is scannable. */
export function CriterionText({ text }: { text: string }) {
  return (
    <>
      {criterionSegments(text).map(({ key, text: segment, bold }) =>
        bold ? (
          <Bold key={key}>{segment}</Bold>
        ) : (
          <Fragment key={key}>{segment}</Fragment>
        ),
      )}
    </>
  );
}

/** True, False and unanswered are three distinct states, so radios rather than a checkbox. */
const CriterionRow = observer(function CriterionRow({
  criterion,
  notRequired,
  subQuestionNotRequired,
}: {
  criterion: TrusteeCriterion;
  notRequired: boolean;
  subQuestionNotRequired: boolean;
}) {
  const opportunityForm =
    useOpportunityFormContext() as UsTnReclassification2026Form;

  const dataKey = criterion.key;
  const selected = opportunityForm.formData[dataKey] ?? "";

  const onChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    opportunityForm.updateDraftData(dataKey, event.target.value);
  };

  // A radio fires change only when it becomes checked, so returning a row to
  // unanswered has to come from the click rather than the change handler.
  //
  // It writes the empty string rather than clearing the draft entry. Every
  // criterion is prefilled from the record under the variant, and `formData`
  // is `{...prefilledData, ...draftData}`, so deleting the draft entry
  // uncovers the prefilled answer and the row looks unchanged.
  // `DOCXFormRadioButton` carries the same note.
  const onClick: MouseEventHandler<HTMLInputElement> = (event) => {
    if (event.currentTarget.value === selected) {
      opportunityForm.updateDraftData(dataKey, "");
    }
  };

  // Labelled per criterion so fifteen identical controls stay distinguishable.
  const criterionNumber = getTrusteeCriterionNumber(dataKey);

  const isSubQuestionParent =
    criterion.key === TRUSTEE_ANNEX_SUB_QUESTION.parentKey;
  const subQuestionAnswer = opportunityForm.formData[
    TRUSTEE_ANNEX_SUB_QUESTION.key
  ] as string | undefined;

  const note = criterionFailureNote(criterion, selected, subQuestionAnswer);
  const showSubQuestion =
    isSubQuestionParent && selected === "false" && !subQuestionNotRequired;
  const failedHardBar = criterion.isHardBar && selected === "false";

  const onSubQuestionChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    opportunityForm.updateDraftData(
      TRUSTEE_ANNEX_SUB_QUESTION.key,
      event.target.value,
    );
  };

  return (
    <tr>
      <NumberCell
        scope="row"
        style={failedHardBar ? { borderLeft: FAILED_HARD_BAR_EDGE } : undefined}
      >
        {criterionNumber}
      </NumberCell>
      <CriterionCell>
        {notRequired ? (
          <NotRequired>
            <CriterionText text={criterion.text} />
          </NotRequired>
        ) : (
          <CriterionText text={criterion.text} />
        )}
        {criterion.helper && <HelperText>NOTE: {criterion.helper}</HelperText>}
        <NoteSlot $reserveSubQuestion={isSubQuestionParent}>
          {showSubQuestion && (
            <SubQuestion>
              {/* One flex item, not one per bold run. CriterionText emits a
                  node per `**` segment, and as direct children of the box the
                  row gap fell between them: "Inmate has   7 years or less
                  remaining on their sentence." */}
              <span>
                <CriterionText text={TRUSTEE_ANNEX_SUB_QUESTION.text} />
              </span>
              {/* Labelled the same way the criterion rows are, so the two
                  extra controls are not announced as a bare "True"/"False"
                  detached from the question they belong to. */}
              <div>
                <label>
                  <input
                    type="radio"
                    checked={subQuestionAnswer === "true"}
                    value="true"
                    onChange={onSubQuestionChange}
                    aria-label={`Criterion ${criterionNumber} follow-up question: True`}
                  />{" "}
                  True
                </label>
                <label>
                  <input
                    type="radio"
                    checked={subQuestionAnswer === "false"}
                    value="false"
                    onChange={onSubQuestionChange}
                    aria-label={`Criterion ${criterionNumber} follow-up question: False`}
                  />{" "}
                  False
                </label>
              </div>
            </SubQuestion>
          )}
          {note && (
            <FailureNote>
              {/* Rendered through CriterionText so the lead sentence's `**`
                  bolds, the same way it does in the criterion text above. */}
              <CriterionText text={note} />
            </FailureNote>
          )}
        </NoteSlot>
      </CriterionCell>
      {notRequired ? (
        <NotRequiredCell colSpan={2}>
          <NotRequired>Not required</NotRequired>
        </NotRequiredCell>
      ) : (
        <>
          <AnswerCell>
            <input
              type="radio"
              name={dataKey}
              aria-label={`Criterion ${criterionNumber}: True`}
              checked={selected === "true"}
              value="true"
              onChange={onChange}
              onClick={onClick}
            />
          </AnswerCell>
          <AnswerCell>
            <input
              type="radio"
              name={dataKey}
              aria-label={`Criterion ${criterionNumber}: False`}
              checked={selected === "false"}
              value="false"
              onChange={onChange}
              onClick={onClick}
            />
          </AnswerCell>
        </>
      )}
    </tr>
  );
});

export const CriteriaSection = observer(function CriteriaSection({
  section,
  groups,
}: {
  section: string;
  groups: (typeof TRUSTEE_SECTIONS)[number]["groups"];
}) {
  const opportunityForm =
    useOpportunityFormContext() as UsTnReclassification2026Form;

  const { notRequired, subQuestionNotRequired } = resolveTrusteeSkipState(
    opportunityForm.formData,
  );
  const notRequiredKeys = new Set<TrusteeCriterionKey>(notRequired);

  return (
    <>
      <SectionHeading>{section}</SectionHeading>
      <CriteriaTable>
        <thead>
          <tr>
            <NumberCell scope="col">#</NumberCell>
            <th scope="col">Criteria</th>
            <AnswerCell as="th" scope="col">
              True
            </AnswerCell>
            <AnswerCell as="th" scope="col">
              False
            </AnswerCell>
          </tr>
        </thead>
        {groups.map(({ key, label, note, criteria }) => (
          <tbody key={key}>
            <GroupHeaderRow>
              <th scope="rowgroup" colSpan={2}>
                Group {key}. {label}
                {note && <GroupNote>{note}</GroupNote>}
              </th>
              {/* The column headings are repeated on every group rather than
                  stated once at the top of the table. A group header is a full
                  width band, so without them the reader has to scroll or turn
                  back a page to find out which of the two narrow columns is
                  True. */}
              <AnswerCell as="th" scope="col">
                True
              </AnswerCell>
              <AnswerCell as="th" scope="col">
                False
              </AnswerCell>
            </GroupHeaderRow>
            {criteria.map((criterion) => (
              <CriterionRow
                key={criterion.key}
                criterion={criterion}
                notRequired={notRequiredKeys.has(criterion.key)}
                subQuestionNotRequired={subQuestionNotRequired}
              />
            ))}
          </tbody>
        ))}
      </CriteriaTable>
    </>
  );
});
