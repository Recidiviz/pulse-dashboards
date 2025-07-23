// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { FC } from "react";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import { hydrateTemplate } from "../../../../configs/hydrateTemplate";
import { UsMaMonthlyReportCopy } from "../../configs/US_MA/copy";
import { SlateCopy } from "../Homepage/styles";

const CreditTotals = styled.div<{ marginTopBottom: string }>`
  display: flex;
  border: 1px solid ${palette.slate20};
  border-radius: ${rem(spacing.sm)};
  margin: ${(props) => props.marginTopBottom} 0;
`;

const CreditTypeCard = styled.div`
  flex: 1;
  border-right: 1px solid ${palette.slate10};
  margin: 0 ${rem(spacing.sm)};
  padding: ${rem(spacing.lg)};
  border-radius: ${rem(spacing.sm)} 0 0 ${rem(spacing.sm)};

  &:last-child {
    border-right: none;
  }
`;

const CardValue = styled.div`
  ${typography.Sans24};

  font-size: ${rem(24)};
`;

export type creditTypeToTotal = {
  totalEGTCreditDays: number;
  totalBoostCreditDays: number;
  totalCompletionCreditDays: number;
};

export const CreditsByTypeCard: FC<{
  copy: UsMaMonthlyReportCopy;
  credits: creditTypeToTotal;
  marginTopBottom: string;
}> = observer(function CreditsByTypeCard({ copy, credits, marginTopBottom }) {
  const {
    totalEGTCreditDays,
    totalBoostCreditDays,
    totalCompletionCreditDays,
  } = credits;
  return (
    <CreditTotals marginTopBottom={marginTopBottom}>
      <CreditTypeCard>
        <SlateCopy>{copy.egt.label}</SlateCopy>
        <CardValue>
          {hydrateTemplate(copy.egt.value, {
            totalEGTCreditDays,
          })}
        </CardValue>
      </CreditTypeCard>
      <CreditTypeCard>
        <SlateCopy>{copy.boosts.label}</SlateCopy>
        <CardValue>
          {hydrateTemplate(copy.boosts.value, {
            totalBoostCreditDays,
          })}
        </CardValue>
      </CreditTypeCard>
      <CreditTypeCard>
        <SlateCopy>{copy.completion.label}</SlateCopy>
        <CardValue>
          {hydrateTemplate(copy.completion.value, {
            totalCompletionCreditDays,
          })}
        </CardValue>
      </CreditTypeCard>
    </CreditTotals>
  );
});
