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

import { CardHeading, CardValue, GoLink } from "~@jii/common-ui";
import {
  useDateDistanceTranslation,
  useUsAzTranslations,
} from "~@jii/translation";

import { UsAzDateField } from "../UsAzSingleResidentContext/SingleResidentContextPresenter";
import { DateInfoTag } from "./DateInfoTag";
import {
  CardHighlightStyle,
  CardValueWrapper,
  DashedBorderSvg,
  DateInfoContent,
  LearnMoreLinkWrapper,
  StyledCard,
  StyledSlateCopy,
} from "./styles";

export interface DateInfoCardProps {
  title: string;
  date: Date;
  info: string;
  shortName: string;
  dateKey: UsAzDateField;
  isUpcoming: boolean;
  linkUrl: string;
  isPast: boolean;
}

export const DateInfoCard = ({
  title,
  date,
  info,
  shortName,
  dateKey,
  isUpcoming,
  linkUrl,
  isPast,
}: DateInfoCardProps) => {
  const { t } = useUsAzTranslations();
  const distanceFromToday = useDateDistanceTranslation(date);
  /*
  For upcoming dates in the next 31 days:
  - CardValue should show distanceFromToday
  - SlateCopy should be the date

  For all other dates:
  - CardValue should be the date, SlateCopy should be distanceFromToday in parentheses
  */
  const cardValue = isUpcoming
    ? distanceFromToday
    : t(($) => $.importantDates.dates[dateKey].value, {
        replace: { [dateKey]: date },
      });

  const slateCopyContent = isUpcoming
    ? t(($) => $.importantDates.dates[dateKey].value, {
        replace: { [dateKey]: date },
      })
    : `(${distanceFromToday})`;

  let highlightType: CardHighlightStyle | undefined;
  // this ordering is intentional because isPast supersedes TPR/DTP styles
  if (dateKey === "csbdDate" || isPast) {
    highlightType = "dashed";
  } else if (dateKey === "tprDate") {
    highlightType = "green";
  } else if (dateKey === "dtpDate") {
    highlightType = "purple";
  }

  return (
    <StyledCard $isUpcoming={isUpcoming} $highlightType={highlightType}>
      {highlightType === "dashed" && (
        <DashedBorderSvg>
          <rect />
        </DashedBorderSvg>
      )}
      <CardHeading>{title}</CardHeading>
      <CardValue>
        <CardValueWrapper>{cardValue}</CardValueWrapper>
        {/* infoTag is part of the dashed style */}
        {highlightType === "dashed" && (
          <DateInfoTag text={t(($) => $.importantDates.pastDateTag)} />
        )}
      </CardValue>
      <StyledSlateCopy $isPastDate={isPast}>{slateCopyContent}</StyledSlateCopy>
      <DateInfoContent>{info}</DateInfoContent>
      <LearnMoreLinkWrapper>
        <GoLink to={linkUrl}>
          {t(($) => $.goLink, { replace: { label: shortName } })}
        </GoLink>
      </LearnMoreLinkWrapper>
    </StyledCard>
  );
};
