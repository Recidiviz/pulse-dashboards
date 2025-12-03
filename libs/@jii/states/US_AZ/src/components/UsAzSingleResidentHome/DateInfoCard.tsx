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

import { isSameDay, parseISO } from "date-fns";

import { CardHeading, CardValue, GoLink } from "~@jii/common-ui";
import { State } from "~@jii/paths";
import { useUsAzTranslations } from "~@jii/translation";

import {
  DateInfoContent,
  LearnMoreLinkWrapper,
  StyledCard,
  StyledSlateCopy,
} from "./styles";
import { UsAzDateField } from "./UsAzImportantDatesPresenter";

export interface DateInfoCardProps {
  title: string;
  date: string;
  info: string;
  shortName: string;
  dateKey: UsAzDateField;
  isUpcoming: boolean;
  highlightType?: UsAzDateField;
  infoPageHash: string;
}

export const DateInfoCard = ({
  title,
  date,
  info,
  shortName,
  dateKey,
  isUpcoming,
  highlightType,
  infoPageHash,
}: DateInfoCardProps) => {
  const { t } = useUsAzTranslations();

  const dateObj = parseISO(date);
  const today = new Date();
  const isPastDate = dateObj < today;
  const isToday = isSameDay(dateObj, today);

  // Determine which distance translation to use based on whether date is past/future/today
  const getDistanceTranslation = (dateValue: Date) => {
    if (isToday) {
      return t(($) => $.distanceFromTodayNow);
    } else if (isPastDate) {
      return t(($) => $.distanceFromTodayPast, { date: dateValue });
    } else {
      return t(($) => $.distanceFromTodayFuture, { date: dateValue });
    }
  };

  /*
  For upcoming dates in the next 31 days:
  - CardValue should show distanceFromToday without parentheses
  - SlateCopy should be the date

  For all other dates:
  - CardValue should be the date, SlateCopy should be distanceFromToday
  */
  const cardValue = isUpcoming
    ? getDistanceTranslation(dateObj).replace(/^\(|\)$/g, "") //remove parentheses
    : t(($) => $.importantDates.dates[dateKey].value, {
        replace: { [dateKey]: dateObj },
      });

  const slateCopyContent = isUpcoming
    ? t(($) => $.importantDates.dates[dateKey].value, {
        replace: { [dateKey]: dateObj },
      })
    : getDistanceTranslation(dateObj);

  return (
    <StyledCard $isUpcoming={isUpcoming} $highlightType={highlightType}>
      <CardHeading>{title}</CardHeading>
      <CardValue>{cardValue}</CardValue>
      <StyledSlateCopy $isPastDate={isPastDate}>
        {slateCopyContent}
      </StyledSlateCopy>
      <DateInfoContent>
        {isUpcoming && t(($) => $.upcomingDateCopy)}
        {info}
      </DateInfoContent>
      <LearnMoreLinkWrapper>
        <GoLink
          to={`${State.Resident.$.UsAzMoreInformation.ImportantDates.buildRelativePath(
            {},
          )}#${infoPageHash}`}
        >
          {t(($) => $.goLink)}
          {shortName}
        </GoLink>
      </LearnMoreLinkWrapper>
    </StyledCard>
  );
};
