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

import { useState } from "react";

import { BottomSheet, CardHeading, CardValue, GoLink } from "~@jii/common-ui";
import {
  useDateDistanceTranslation,
  useUsAzTranslations,
} from "~@jii/translation";

import { DateInfoTag } from "./DateInfoTag";
import {
  CardValueWrapper,
  DashedBorderSvg,
  DateInfoContent,
  LearnMoreLinkWrapper,
  OverlayBody,
  OverlayEyebrow,
  OverlayHeading,
  StyledCard,
  StyledSlateCopy,
} from "./styles";
import { DateEntry } from "./UsAzImportantDatesPresenter";

export const DateInfoCard = ({
  date,
  title,
  info,
  value,
  goLink,
  isUpcoming,
  isTentative,
  linkUrl,
  isPast,
  highlightType,
  showInfoTag,
  overlay,
}: DateEntry) => {
  const { t } = useUsAzTranslations();
  const distanceFromToday = useDateDistanceTranslation(date);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  let cardValue: string | undefined;
  let slateCopyContent: string;
  if (isUpcoming) {
    cardValue = distanceFromToday;
    slateCopyContent = value;
  } else if (isTentative && !isPast) {
    cardValue = value;
    slateCopyContent = "";
  } else {
    cardValue = value;
    slateCopyContent = `(${distanceFromToday})`;
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
        {showInfoTag && (
          <DateInfoTag text={t(($) => $.importantDates.pastDateTag)} />
        )}
      </CardValue>
      <StyledSlateCopy $isPastDate={isPast}>{slateCopyContent}</StyledSlateCopy>
      <DateInfoContent>{info}</DateInfoContent>
      <LearnMoreLinkWrapper>
        <GoLink
          to={linkUrl}
          onClick={
            overlay
              ? (e) => {
                  // Open the overlay instead of navigating to the FAQ page.
                  e.preventDefault();
                  setIsOverlayOpen(true);
                }
              : undefined
          }
        >
          {goLink}
        </GoLink>
      </LearnMoreLinkWrapper>

      {overlay && (
        <BottomSheet
          isOpen={isOverlayOpen}
          onRequestClose={() => setIsOverlayOpen(false)}
          closeLabel={overlay.closeLabel}
          ariaLabel={overlay.heading}
        >
          {overlay.eyebrow && (
            <OverlayEyebrow>{overlay.eyebrow}</OverlayEyebrow>
          )}
          <OverlayHeading>{overlay.heading}</OverlayHeading>
          <OverlayBody>{overlay.body}</OverlayBody>
          <GoLink to={linkUrl}>{overlay.linkText}</GoLink>
        </BottomSheet>
      )}
    </StyledCard>
  );
};
