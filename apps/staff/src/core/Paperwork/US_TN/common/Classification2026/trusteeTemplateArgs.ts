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

import {
  buildTrusteeDenialReasons,
  getTrusteeCriterionNumber,
  resolveAnnexOutcome,
  resolveTrusteeOutcome,
  resolveTrusteeSkipState,
  TRUSTEE_ANNEX_SUB_QUESTION,
  TRUSTEE_CRITERIA,
  TrusteeFormSchema,
} from "~datatypes";

const BLANK = "_________________________";

const APPROVAL_FIELDS = [
  {
    prefix: "wardenTrustee",
    decision: "trusteeWardenTrusteeApproved",
    date: "trusteeWardenTrusteeApprovalDate",
  },
  {
    prefix: "wardenAnnex",
    decision: "trusteeWardenAnnexApproved",
    date: "trusteeWardenAnnexApprovalDate",
  },
  {
    prefix: "contractMonitor",
    decision: "trusteeContractMonitorApproved",
    date: "trusteeContractMonitorApprovalDate",
  },
  {
    prefix: "ac",
    decision: "trusteeACApproved",
    date: "trusteeACApprovalDate",
  },
] as const satisfies readonly {
  prefix: string;
  decision: keyof TrusteeFormSchema;
  date: keyof TrusteeFormSchema;
}[];

/**
 * Template args for the reworked assessment, derived from `TRUSTEE_CRITERIA`.
 * The DOCX still has to be hand-edited to match; `trusteeReworkTemplateKeys` is
 * the contract between the two.
 */
export function getTrusteeReworkTemplateContents(
  formData: Partial<TrusteeFormSchema>,
): Record<string, string> {
  const contents: Record<string, string> = {};

  const trustee = resolveTrusteeOutcome(formData);
  const annex = resolveAnnexOutcome(formData);
  const { notRequired } = resolveTrusteeSkipState(formData);
  const notRequiredKeys = new Set<string>(notRequired);

  TRUSTEE_CRITERIA.forEach((criterion) => {
    const n = getTrusteeCriterionNumber(criterion.key);
    const value = formData[criterion.key];

    contents[`q${n}t`] = value === "true" ? "X" : "";
    contents[`q${n}f`] = value === "false" ? "X" : "";
    // Printed rather than left blank, so the form distinguishes a question
    // that other answers made moot from one nobody got to.
    contents[`q${n}na`] = notRequiredKeys.has(criterion.key)
      ? "Not required"
      : "";
  });

  // Only printed when the sub-question was actually asked, since the backing
  // field autofills for everyone once TN-2639 lands.
  const subQuestion = annex.subQuestionRequired
    ? formData[TRUSTEE_ANNEX_SUB_QUESTION.key]
    : undefined;
  contents.subQ3t = subQuestion === "true" ? "X" : "";
  contents.subQ3f = subQuestion === "false" ? "X" : "";

  contents.trusteeEligibleYes = trustee.status === "ELIGIBLE" ? "X" : "";
  contents.trusteeEligibleAc =
    trustee.status === "ELIGIBLE_REQUIRES_AC_APPROVAL" ? "X" : "";
  contents.trusteeEligibleNo = trustee.status === "NOT_ELIGIBLE" ? "X" : "";
  contents.trusteeEligiblePending = trustee.status === "INCOMPLETE" ? "X" : "";

  contents.annexEligibleYes = annex.status === "ELIGIBLE" ? "X" : "";
  contents.annexEligibleNo = annex.status === "NOT_ELIGIBLE" ? "X" : "";
  contents.annexEligiblePending = annex.status === "INCOMPLETE" ? "X" : "";

  APPROVAL_FIELDS.forEach(({ prefix, decision, date }) => {
    const value = formData[decision];
    contents[`${prefix}Approved`] = value === "true" ? "X" : "";
    contents[`${prefix}Denied`] = value === "false" ? "X" : "";
    contents[`${prefix}Date`] = formData[date] || BLANK;
  });

  // denialReasons has no backing form field. It is rebuilt from the failed
  // criteria every time, so the paragraph on the filed form always lists the
  // same failures as the criteria table printed above it and cannot drift from
  // them. The two notes fields below are free text the counselor owns, so those
  // are read straight from formData.
  contents.denialReasons = buildTrusteeDenialReasons(formData) || BLANK;
  contents.denialNotes = formData.trusteeDenialNotes || BLANK;
  contents.notesForWarden = formData.trusteeNotesForWarden || BLANK;

  return contents;
}

/**
 * Every placeholder the reworked DOCX must contain, and no others. A placeholder
 * with no arg here renders as literal `{text}` on filed paperwork.
 */
export const trusteeReworkTemplateKeys = Object.keys(
  getTrusteeReworkTemplateContents({}),
).sort();
