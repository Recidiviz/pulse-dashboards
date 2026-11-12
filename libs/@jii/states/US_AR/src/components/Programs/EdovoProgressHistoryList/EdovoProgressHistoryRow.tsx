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

import { rem } from "polished";
import { FC } from "react";
import styled from "styled-components";

import { ActivityRow, SlateCopy } from "~@jii/common-ui";
import { UsArEdovoCreditActivity } from "~@jii/schemas";
import { useUsArTranslations } from "~@jii/translation";
import { spacing } from "~design-system";

const HistoryRow = styled(ActivityRow)`
  height: auto;
  margin-bottom: ${rem(spacing.md)};
  margin-top: ${rem(spacing.md)};
`;

const MonthName = styled.div`
  font-weight: 600;
`;

const CarryInSubtext = styled(SlateCopy)`
  font-size: ${rem(14)};
`;

export const EdovoProgressHistoryRow: FC<{
  activity: UsArEdovoCreditActivity;
}> = ({ activity }) => {
  const { t } = useUsArTranslations();
  return (
    <HistoryRow>
      <div>
        <MonthName>
          {t(($) => $.programs.onMyTablet.history.monthLabel, {
            date: activity.completionMonth,
          })}
        </MonthName>
        {activity.carryInHours > 0 && (
          <CarryInSubtext>
            {t(($) => $.programs.onMyTablet.history.carriedIn, {
              count: activity.carryInHours,
            })}
          </CarryInSubtext>
        )}
      </div>
      <div>
        {t(($) => $.programs.onMyTablet.history.totalHours, {
          count: activity.totalHours,
        })}
      </div>
    </HistoryRow>
  );
};
