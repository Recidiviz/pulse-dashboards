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
  resolveAnnexOutcome,
  resolveTrusteeOutcome,
} from "~datatypes";
import { palette } from "~design-system";

import { UsTnReclassification2026Form } from "../../../../../WorkflowsStore/Opportunity/Forms/UsTnReclassification2026Form";
import { useOpportunityFormContext } from "../../../OpportunityFormContext";
import { Bold } from "./styles";
import { criteriaMarkedFalse } from "./TrusteeCriteriaSection";

type ApprovalRowState =
  | { kind: "recordable" }
  | { kind: "pending"; text: string }
  | { kind: "notApplicable"; text: string };

/**
 * Every row is three-way: "not applicable" is only honest once the outcome it
 * depends on is settled, so an unsettled row reads "pending".
 */
function rowState(
  resolvedEligible: boolean,
  unresolved: boolean,
  pendingText: string,
  notApplicableText: string,
): ApprovalRowState {
  if (resolvedEligible) return { kind: "recordable" };
  if (unresolved) return { kind: "pending", text: pendingText };
  return { kind: "notApplicable", text: notApplicableText };
}

const Section = styled.div`
  margin-top: ${rem(10)};
`;

const SectionHeading = styled.h2`
  font-size: ${rem(10)};
  font-weight: 600;
  margin: 0 0 ${rem(2)};
`;

const SectionNote = styled.div`
  margin-bottom: ${rem(4)};
  /* Reserved so the page does not change length when the header appears. */
  min-height: ${rem(12)};
`;

const ApprovalsTable = styled.table`
  border-collapse: collapse;
  border: 1px solid black;
  width: 100%;
  table-layout: fixed;

  & th,
  td {
    border: 1px solid black;
    padding: 0.3rem 0.25rem;
    vertical-align: top;
    text-align: left;
  }
`;

/** Narrow: the two decisions stack, so the cell is one word wide rather than two. */
const DecisionCell = styled.td`
  width: ${rem(74)};
`;

const DateCell = styled.td`
  width: ${rem(150)};
`;

/** A rule to write on, not a field: the form is printed before any approval happens. */
const WritingRule = styled.div`
  margin-top: ${rem(14)};
  border-bottom: 1px solid black;
`;

/** Separates the date line from the signature line above it. */
const DateLine = styled.div`
  margin-top: ${rem(6)};
`;

/** slate80 is the lightest palette grey that clears 4.5:1 on white, and this is small print. */
const Muted = styled.span`
  color: ${palette.slate80};
`;

const Trigger = styled.div`
  font-weight: 400;
  margin-top: ${rem(2)};
`;

/** Stacked rather than side by side, so the column costs one word of width. */
const DecisionLabel = styled.label`
  display: block;
  margin: 0;
  font-weight: 400;
`;

/**
 * A square to tick on paper. Disabled because the decision is made and recorded
 * offline: nothing here writes it back, so an enabled control would lie.
 */
const DecisionBox = styled.input`
  margin-right: ${rem(4)};
`;

const ApprovalRow = observer(function ApprovalRow({
  label,
  trigger,
  state,
}: {
  label: string;
  trigger?: string;
  state: ApprovalRowState;
}) {
  return (
    <tr>
      <th scope="row">
        {label}
        {trigger && <Trigger>{trigger}</Trigger>}
      </th>
      <DecisionCell>
        {state.kind === "recordable" ? (
          <>
            <DecisionLabel>
              <DecisionBox
                type="checkbox"
                aria-label={`${label}: approved`}
                disabled
              />
              Approved
            </DecisionLabel>
            <DecisionLabel>
              <DecisionBox
                type="checkbox"
                aria-label={`${label}: denied`}
                disabled
              />
              Denied
            </DecisionLabel>
          </>
        ) : (
          <Muted>{state.text}</Muted>
        )}
      </DecisionCell>
      <DateCell>
        {state.kind === "recordable" ? (
          <>
            Signature:
            <WritingRule />
            <DateLine>Date received:</DateLine>
            <WritingRule />
          </>
        ) : (
          <Muted>&mdash;</Muted>
        )}
      </DateCell>
    </tr>
  );
});

/**
 * Records of approvals made offline, not e-signatures. Kept separate from
 * eligibility so a missing Warden decision cannot read as a policy failure.
 */
export const TrusteeApprovals = observer(function TrusteeApprovals() {
  const opportunityForm =
    useOpportunityFormContext() as UsTnReclassification2026Form;

  const { formData } = opportunityForm;
  const trustee = resolveTrusteeOutcome(formData);
  const annex = resolveAnnexOutcome(formData);

  const trusteeEligible =
    trustee.status === "ELIGIBLE" ||
    trustee.status === "ELIGIBLE_REQUIRES_AC_APPROVAL";

  const wardenTrustee = rowState(
    trusteeEligible,
    trustee.status === "INCOMPLETE",
    "Pending. Complete the remaining criteria.",
    "Not applicable. Inmate is not eligible for Trustee custody.",
  );

  const wardenAnnex = rowState(
    annex.status === "ELIGIBLE",
    annex.status === "INCOMPLETE",
    "Pending. Complete criteria 1 through 6.",
    "Not applicable. Inmate is not eligible for Annex housing.",
  );

  // Only a Group E failure that actually triggers the approval belongs here: a
  // failed hard bar already makes the placement moot.
  const acCriteria =
    trustee.status === "ELIGIBLE_REQUIRES_AC_APPROVAL"
      ? trustee.failedConditionalCriteria.map(getTrusteeCriterionNumber)
      : [];

  const contractMonitor = rowState(
    trusteeEligible,
    trustee.status === "INCOMPLETE",
    "Pending. Complete the remaining criteria.",
    "Not applicable. Inmate is not eligible for Trustee custody.",
  );

  const acState = rowState(
    trustee.status === "ELIGIBLE_REQUIRES_AC_APPROVAL",
    trustee.status === "INCOMPLETE",
    "Pending. Complete the remaining criteria.",
    "Not applicable. Approval only required if criteria 14 or 15 is False.",
  );

  // Said explicitly rather than left empty, but only once Annex is settled too.
  const noApprovalsRequired =
    trustee.status === "NOT_ELIGIBLE" && annex.status === "NOT_ELIGIBLE";

  return (
    <Section>
      <SectionHeading>Approvals recorded</SectionHeading>
      <SectionNote>
        {noApprovalsRequired ? (
          <Bold>
            No approvals are required. Inmate is not eligible for Trustee
            custody or Annex housing placement.
          </Bold>
        ) : (
          "Record approvals obtained outside this form. These are records of decisions, not signatures."
        )}
      </SectionNote>
      <ApprovalsTable>
        <thead>
          <tr>
            <th scope="col">Approver</th>
            <th scope="col">Decision</th>
            <DateCell as="th" scope="col">
              Signature and date
            </DateCell>
          </tr>
        </thead>
        <tbody>
          <ApprovalRow
            label="Warden, Trustee custody placement"
            state={wardenTrustee}
          />
          <ApprovalRow
            label="Warden, Annex housing placement"
            state={wardenAnnex}
          />
          {/* The visibility rule for this row is parked with Nat and has no
              ticket: nothing on the record carries private facility status
              today. Until it does, the row keeps the current form's behavior of
              always showing and letting the counselor decide. */}
          <ApprovalRow
            label="Contract Monitor"
            trigger="Required for private facilities only."
            state={contractMonitor}
          />
          {/* TN-2667 question 3 asks whether this approval carries over to
              Annex placement or applies to Trustee custody only. This row
              assumes Trustee only, which is the narrower reading; if TDOC says
              otherwise, acState needs the Annex outcome too. */}
          <ApprovalRow
            label="Assistant Commissioner for Prison Operations or designee"
            trigger={
              acCriteria.length > 0
                ? `Required because ${criteriaMarkedFalse(acCriteria)}.`
                : undefined
            }
            state={acState}
          />
        </tbody>
      </ApprovalsTable>
    </Section>
  );
});
