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

import { spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import styled from "styled-components/macro";

import {
  ActivityList,
  ActivityRow,
  ActivityRowDivider,
  Card,
  HomepageSectionHeading,
} from "~@jii/common-ui";
import { useUsMaTranslations } from "~@jii/translation";
import { palette } from "~design-system";

import { CreditsByTypeCardSkeleton } from "../../MonthlyReport/CreditsByTypeCardSkeleton";

const SkeletonLine = styled.div`
  height: ${rem(1)};
  background-color: ${palette.slate90};
  margin-top: ${rem(11)};
`;

export const MonthlyReportHomepageCardSkeleton = observer(
  function MonthlyReportHomepageCardSkeleton() {
    const { t } = useUsMaTranslations();

    return (
      <section>
        <HomepageSectionHeading>
          {t(($) => $.home.monthlyReport.sectionTitle)}
        </HomepageSectionHeading>
        <Card>
          <CreditsByTypeCardSkeleton
            copy={t(($) => $.home.monthlyReport, { returnObjects: true })}
            marginTopBottom={rem(spacing.md)}
          />
          <ActivityList>
            {[1, 2, 3].map((index) => (
              <React.Fragment key={index}>
                <ActivityRow>
                  <SkeletonLine style={{ width: "60%" }} />
                  <SkeletonLine style={{ width: "20%" }} />
                </ActivityRow>
                <ActivityRowDivider />
              </React.Fragment>
            ))}
          </ActivityList>
        </Card>
      </section>
    );
  },
);
