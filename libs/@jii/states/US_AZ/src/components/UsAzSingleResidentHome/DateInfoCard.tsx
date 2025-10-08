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

import { formatDistanceToNowStrict } from "date-fns";

import { CardHeading, CardValue, GoLink, SlateCopy } from "~@jii/common-ui";
import { formatFullDate } from "~@jii/data";
import { State } from "~@jii/paths";

import { usAzCopy } from "../../configs/copy";
import {
  DateInfoContent,
  HighlightedCard,
  LearnMoreLinkWrapper,
  StyledCard,
} from "./styles";

const { goLink, noDate, fromToday } = usAzCopy;

export interface DateInfoCardProps {
  title: string;
  date: string | undefined;
  info: string;
  shortName: string;
  dateKey: string;
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
  const CardComponent = isHighlighted ? HighlightedCard : StyledCard;

  if (!date) {
    return (
      <CardComponent>
        <CardHeading>{title}</CardHeading>
        <CardValue>{noDate}</CardValue>
        <LearnMoreLinkWrapper>
          <GoLink
            to={State.Resident.$.UsAzMoreInformation.DateInfo.buildRelativePath(
              {
                dateType: dateKey,
              },
            )}
          >
            {goLink}
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
      <CardValue>{formatFullDate(dateObj)}</CardValue>
      <SlateCopy>{`(${formatDistanceToNowStrict(dateObj)} ${fromToday})`}</SlateCopy>
      <DateInfoContent>{info}</DateInfoContent>
      <LearnMoreLinkWrapper>
        <GoLink
          to={State.Resident.$.UsAzMoreInformation.DateInfo.buildRelativePath({
            dateType: dateKey,
          })}
        >
          {goLink}
          {shortName}
        </GoLink>
      </LearnMoreLinkWrapper>
    </CardComponent>
  );
};
