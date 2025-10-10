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

import { CardHeading, CardValue, GoLink, SlateCopy } from "~@jii/common-ui";
import { State } from "~@jii/paths";
import { useUsAzTranslations } from "~@jii/translation";

import {
  DateInfoContent,
  HighlightedCard,
  LearnMoreLinkWrapper,
  StyledCard,
} from "./styles";
import { UsAzDateField } from "./UsAzImportantDatesPresenter";

export interface DateInfoCardProps {
  title: string;
  date: string | undefined;
  info: string;
  shortName: string;
  dateKey: UsAzDateField;
  isHighlighted?: boolean;
}

export const DateInfoCard = ({
  title,
  date,
  info,
  shortName,
  dateKey,
  isHighlighted = false,
}: DateInfoCardProps) => {
  const { t } = useUsAzTranslations();
  const CardComponent = isHighlighted ? HighlightedCard : StyledCard;

  if (!date) {
    return (
      <CardComponent>
        <CardHeading>{title}</CardHeading>
        <CardValue>{t(($) => $.noDate)}</CardValue>
        <LearnMoreLinkWrapper>
          <GoLink
            to={State.Resident.$.UsAzMoreInformation.DateInfo.buildRelativePath(
              {
                dateType: dateKey,
              },
            )}
          >
            {t(($) => $.goLink)}
            {shortName}
          </GoLink>
        </LearnMoreLinkWrapper>
      </CardComponent>
    );
  }

  const dateObj = new Date(date);

  return (
    <CardComponent>
      <CardHeading>{title}</CardHeading>
      <CardValue>
        {t(($) => $.importantDates.dates[dateKey].value, {
          replace: { [dateKey]: dateObj },
        })}
      </CardValue>
      <SlateCopy>{t(($) => $.distanceFromToday, { date: dateObj })}</SlateCopy>
      <DateInfoContent>{info}</DateInfoContent>
      <LearnMoreLinkWrapper>
        <GoLink
          to={State.Resident.$.UsAzMoreInformation.DateInfo.buildRelativePath({
            dateType: dateKey,
          })}
        >
          {t(($) => $.goLink)}
          {shortName}
        </GoLink>
      </LearnMoreLinkWrapper>
    </CardComponent>
  );
};
