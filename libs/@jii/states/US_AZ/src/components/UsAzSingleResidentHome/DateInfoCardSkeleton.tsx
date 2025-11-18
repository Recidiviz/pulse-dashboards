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

import { FC } from "react";
import styled from "styled-components/macro";

import { CardHeading, CardValue, GoLink } from "~@jii/common-ui";
import { State } from "~@jii/paths";
import { useUsAzTranslations } from "~@jii/translation";
import { palette } from "~design-system";

import { DateInfoContent, LearnMoreLinkWrapper, StyledCard } from "./styles";
import { UsAzDateField } from "./UsAzImportantDatesPresenter";

export interface DateInfoCardSkeletonProps {
  dateKey: UsAzDateField;
  infoPageHash: string;
}

const StripedBar = styled.div`
  height: 3rem;
  width: 60%;
  background: repeating-linear-gradient(
    -45deg,
    ${palette.slate05},
    ${palette.slate05} 10px,
    ${palette.slate20} 10px,
    ${palette.slate20} 11px
  );
  border-radius: 4px;
`;

export const DateInfoCardSkeleton: FC<DateInfoCardSkeletonProps> = ({
  dateKey,
  infoPageHash,
}) => {
  const { t } = useUsAzTranslations();

  return (
    <StyledCard $isUpcoming={false}>
      <CardHeading>
        {t(($) => $.importantDates.dates[dateKey].title)}
      </CardHeading>
      <CardValue>
        <StripedBar />
      </CardValue>
      <DateInfoContent>
        {t(($) => $.importantDates.dates[dateKey].skeletonInfo)}
      </DateInfoContent>
      <LearnMoreLinkWrapper>
        <GoLink
          to={`${State.Resident.$.UsAzMoreInformation.ImportantDates.buildRelativePath(
            {},
          )}#${infoPageHash}`}
        >
          {t(($) => $.goLink)}
          {t(($) => $.importantDates.dates[dateKey].shortName)}
        </GoLink>
      </LearnMoreLinkWrapper>
    </StyledCard>
  );
};
