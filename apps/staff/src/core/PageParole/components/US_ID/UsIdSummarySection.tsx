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

import { spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components";

import { ParoleReportFourthAmendmentWaiver } from "~datatypes";
import { palette } from "~design-system";

import { ParoleBoardReportMode } from "../../../../ParoleStore/presenters/ParoleBoardReportPresenter";
import { ResolvedSummary } from "../../../../ParoleStore/report/summary";
import {
  ParoleSectionCard,
  ParoleSectionTitle,
} from "../ParoleCaseProfileStyles";
import { ReportDropdown, ReportDropdownOption } from "./report/ReportDropdown";
import { ReportLongTextField } from "./report/ReportLongTextField";

// The data sheet gives 2,500 characters to each of the four parts of the
// PHIs' current summary, which this one box holds together.
export const SUMMARY_MAX_LENGTH = 10_000;

const WAIVER_OPTIONS: Array<
  ReportDropdownOption<ParoleReportFourthAmendmentWaiver>
> = [
  { value: "YES", label: "Yes" },
  {
    value: "INTERVIEW_NOT_CONDUCTED",
    label: "No, interview was not conducted",
  },
];

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
`;

const WaiverStatement = styled.p`
  ${typography.Sans14}
  margin: 0;
  color: ${palette.slate70};
`;

/**
 * US_ID's Summary card, which ends the PHI report: the PHI's summary of the
 * case, then the Idaho Code 20-1007 statement and the PHI's answer about the
 * 4th Amendment Waiver. The summary saves as the PHI types, and the answer
 * saves when they pick it.
 *
 * @param mode - EDIT or READ. The report presenter picks it.
 * @param summary - The resolved Summary section.
 * @param onSaveSummary - Saves the summary text, or null when the PHI emptied
 *   the box.
 * @param onSaveWaiver - Saves the waiver answer the PHI picked.
 */
export function UsIdSummarySection({
  mode,
  summary,
  onSaveSummary,
  onSaveWaiver,
}: {
  mode: ParoleBoardReportMode;
  summary: ResolvedSummary;
  onSaveSummary: (value: string | null) => Promise<void>;
  onSaveWaiver: (value: ParoleReportFourthAmendmentWaiver) => Promise<void>;
}) {
  return (
    <ParoleSectionCard>
      <ParoleSectionTitle>Summary</ParoleSectionTitle>
      <Body>
        <ReportLongTextField
          mode={mode}
          label="Summary"
          hideLabel
          value={summary.fields.summary.value}
          onSave={onSaveSummary}
          maxLength={SUMMARY_MAX_LENGTH}
          rows={16}
        />
        <WaiverStatement>
          Idaho Code Section 20-1007, which requires a 4th Amendment Waiver of
          everyone granted parole, was read and reviewed during the interview.
          The resident indicated understanding and acceptance of the condition.
        </WaiverStatement>
        <ReportDropdown
          mode={mode}
          label="4th Amendment Waiver"
          options={WAIVER_OPTIONS}
          value={summary.fields.fourthAmendmentWaiver.value}
          onSave={onSaveWaiver}
        />
      </Body>
    </ParoleSectionCard>
  );
}
