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

import Skeleton from "react-loading-skeleton";

import {
  Card,
  CardHeading,
  CardValue,
  HomepageSectionHeading,
  TwoColumnCardWrapper,
} from "~@jii/common-ui";
import { useUsMaTranslations } from "~@jii/translation";

import { Wrapper } from "./TotalTimeEarnedSection";

export const TotalTimeEarnedSectionSkeleton = () => {
  const { t } = useUsMaTranslations();
  return (
    <Wrapper>
      <HomepageSectionHeading>
        {t(($) => $.home.totalTimeEarned.sectionTitle)}
      </HomepageSectionHeading>
      <TwoColumnCardWrapper>
        <Card>
          <CardHeading>
            {t(($) => $.home.totalTimeEarned.egtBoostsLabel)}
          </CardHeading>
          <CardValue>
            <Skeleton />
          </CardValue>
        </Card>
        <Card>
          <CardHeading>
            {t(($) => $.home.totalTimeEarned.completionLabel)}
          </CardHeading>
          <CardValue>
            <Skeleton />
          </CardValue>
        </Card>
      </TwoColumnCardWrapper>
    </Wrapper>
  );
};
