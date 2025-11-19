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
import { rem } from "polished";
import { FC } from "react";
import styled from "styled-components";

import { Card } from "~@jii/common-ui";
import { useUsMaTranslations } from "~@jii/translation";
import { palette } from "~design-system";

import {
  AchievementKey,
  UsMaEGTMonthlyReport,
} from "../../models/UsMaEGTMonthlyReport";
import { TwoColumnWrapper } from "../styles";
import maxEarnedTimeUrl from "./assets/achievement-max-earned-time.svg";
import { MonthlyReportSectionHeading } from "./styles";

const AchievementCard = styled(Card).attrs({ as: "div" })`
  text-align: center;
  text-wrap: balance;
`;

const AchievementLabel = styled.dt`
  ${typography.Sans12}

  align-items: center;
  color: ${palette.slate85};
  display: flex;
  flex-direction: column;
  margin: 0 0 ${rem(spacing.sm)};
`;
const AchievementText = styled.dd`
  ${typography.Sans14}
  margin: 0;
`;
const AchievementImg = styled.img`
  height: auto;
  width: ${rem(48)};

  margin-bottom: ${rem(spacing.md)};
`;

const AchievementImageUrls: Record<AchievementKey, string> = {
  maxEarnedTime: maxEarnedTimeUrl,
};

export const Achievements: FC<{
  report: UsMaEGTMonthlyReport;
}> = ({ report }) => {
  const { t } = useUsMaTranslations();
  return (
    <>
      <MonthlyReportSectionHeading>
        {t(($) => $.individualMonthlyReport.achievements.heading)}
      </MonthlyReportSectionHeading>
      <TwoColumnWrapper as="dl">
        {report.achievements.map((achievementKey) => (
          <AchievementCard key={achievementKey}>
            <AchievementLabel>
              <AchievementImg
                alt=""
                src={AchievementImageUrls[achievementKey]}
              />

              {t(
                ($) =>
                  $.individualMonthlyReport.achievements[achievementKey]
                    .heading,
              )}
            </AchievementLabel>
            <AchievementText>
              {t(
                ($) =>
                  $.individualMonthlyReport.achievements[achievementKey].body,
              )}
            </AchievementText>
          </AchievementCard>
        ))}
      </TwoColumnWrapper>
    </>
  );
};
